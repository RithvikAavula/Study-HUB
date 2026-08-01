import asyncio
import uuid
import json
from typing import List, Optional
from supabase import Client

from app.models.schemas import Citation, DocumentUploadRequest
from app.rag.pdf_parser import PDFParser
from app.rag.chunker import DocumentChunker
from app.rag.embeddings import embedding_service
from app.rag.vector_store import chroma_service
from app.rag.llm_client import llm_service
from app.services.storage_service import supabase_storage
from app.prompts.system_prompts import RAG_SYSTEM_PROMPT, FRIENDLY_FALLBACK_PROMPT
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()
pdf_parser = PDFParser()
chunker = DocumentChunker()


class RAGService:

    # ─── Indexing ──────────────────────────────────────────────────────────────

    async def index_document(self, request: DocumentUploadRequest, db: Client) -> str:
        # Check if already indexed or in progress — avoid duplicate work
        existing = db.table("documents").select("id, index_status").eq("resource_id", request.resource_id).execute()
        if existing.data:
            doc = existing.data[0]
            if doc["index_status"] == "completed":
                return doc["id"]
            # Delete and re-index if failed or stuck in processing
            db.table("documents").delete().eq("id", doc["id"]).execute()

        doc_id = str(uuid.uuid4())
        db.table("documents").insert({
            "id": doc_id,
            "resource_id": request.resource_id,
            "file_name": request.file_name,
            "pages": 0,
            "uploaded_by": request.uploaded_by,
            "is_indexed": False,
            "index_status": "processing",
        }).execute()

        # Schedule background task using the running event loop
        loop = asyncio.get_running_loop()
        loop.create_task(self._run_indexing_pipeline(doc_id, request))
        logger.info("Indexing task created", doc_id=doc_id, resource_id=request.resource_id)
        return doc_id

    async def _run_indexing_pipeline(self, doc_id: str, request: DocumentUploadRequest) -> None:
        from app.database.connection import get_supabase
        db = get_supabase()
        try:
            logger.info("Starting indexing pipeline", doc_id=doc_id, url=request.file_url)
            pdf_bytes = await supabase_storage.download_file(request.file_url)
            if not pdf_bytes:
                raise ValueError(f"Empty file downloaded from: {request.file_url}")
            logger.info("PDF downloaded", doc_id=doc_id, size=len(pdf_bytes))

            loop = asyncio.get_running_loop()
            pages, chunks = await self._parse_and_chunk(loop, doc_id, pdf_bytes)
            embeddings = await self._generate_embeddings(loop, doc_id, chunks)
            chroma_ids, chroma_embeddings, chroma_docs, chroma_metas, db_chunks = \
                self._build_chunk_payloads(doc_id, request, chunks, embeddings)

            await self._persist_chunks(
                loop, db, doc_id, len(pages),
                chroma_ids, chroma_embeddings, chroma_docs, chroma_metas, db_chunks,
            )
            logger.info("Document indexed successfully", doc_id=doc_id, chunks=len(db_chunks))

        except Exception as e:
            logger.error("Indexing failed", doc_id=doc_id, error=repr(e), exc_info=True)
            try:
                db.table("documents").update({
                    "index_status": "failed",
                    "index_error": str(e)[:500],
                }).eq("id", doc_id).execute()
            except Exception as db_err:
                logger.error("Failed to update index_status to failed", error=str(db_err))

    async def _parse_and_chunk(self, loop, doc_id: str, pdf_bytes: bytes):
        valid, err = await loop.run_in_executor(None, pdf_parser.validate_pdf, pdf_bytes)
        if not valid:
            raise ValueError(err)
        pages = await loop.run_in_executor(None, pdf_parser.extract_pages, pdf_bytes)
        if not pages:
            raise ValueError("PDF has no readable pages")
        logger.info("PDF parsed", doc_id=doc_id, pages=len(pages))
        chunks = await loop.run_in_executor(None, chunker.chunk_pages, pages)
        if not chunks:
            raise ValueError("No text content extracted from PDF")
        logger.info("Chunks created", doc_id=doc_id, chunks=len(chunks))
        return pages, chunks

    async def _generate_embeddings(self, loop, doc_id: str, chunks):
        texts = [c.text for c in chunks]
        embeddings = await loop.run_in_executor(None, embedding_service.embed_texts, texts)
        logger.info("Embeddings generated", doc_id=doc_id, count=len(embeddings))
        return embeddings

    def _build_chunk_payloads(self, doc_id: str, request: DocumentUploadRequest, chunks, embeddings):
        chroma_ids, chroma_embeddings, chroma_docs, chroma_metas, db_chunks = [], [], [], [], []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chroma_id = f"{doc_id}_{i}"
            chroma_ids.append(chroma_id)
            chroma_embeddings.append(embedding)
            chroma_docs.append(chunk.text)
            chroma_metas.append({
                "resource_id": str(request.resource_id),
                "document_id": str(doc_id),
                "page_number": int(chunk.page_number),
                "chunk_index": int(chunk.chunk_index),
                "department": str(request.department or ""),
                "year": str(request.year),
                "subject": str(request.subject or ""),
                "title": str(request.title or ""),
                "uploaded_by": str(request.uploaded_by),
                "file_name": str(request.file_name or ""),
            })
            db_chunks.append({
                "id": str(uuid.uuid4()),
                "document_id": doc_id,
                "chunk_text": chunk.text,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "embedding_id": chroma_id,
            })
        return chroma_ids, chroma_embeddings, chroma_docs, chroma_metas, db_chunks

    async def _persist_chunks(
        self, loop, db, doc_id: str, page_count: int,
        chroma_ids, chroma_embeddings, chroma_docs, chroma_metas, db_chunks,
    ):
        await loop.run_in_executor(
            None,
            lambda: chroma_service.upsert_chunks(chroma_ids, chroma_embeddings, chroma_docs, chroma_metas),
        )
        logger.info("Chroma upsert done", doc_id=doc_id)
        for i in range(0, len(db_chunks), 100):
            db.table("document_chunks").insert(db_chunks[i:i + 100]).execute()
        db.table("documents").update({
            "pages": page_count,
            "is_indexed": True,
            "index_status": "completed",
            "index_error": None,
        }).eq("id", doc_id).execute()

    # ─── RAG Query ─────────────────────────────────────────────────────────────

    async def query(
        self,
        question: str,
        user_id: str,
        resource_ids: Optional[List[str]] = None,
    ) -> tuple:
        loop = asyncio.get_running_loop()
        query_embedding = await loop.run_in_executor(None, embedding_service.embed_query, question)
        query_embedding = list(map(float, query_embedding))

        where_filter = self._build_where_filter(resource_ids)

        results = await loop.run_in_executor(
            None,
            lambda: chroma_service.query(query_embedding, n_results=settings.top_k_results, where=where_filter),
        )

        citations: List[Citation] = []
        context_parts: List[str] = []

        if results and results.get("documents") and results["documents"][0]:
            for doc_text, meta in zip(results["documents"][0], results["metadatas"][0]):
                citations.append(Citation(
                    document_name=meta.get("file_name", "Unknown"),
                    page_number=int(meta.get("page_number", 1)),
                    snippet=doc_text[:300],
                    resource_id=meta.get("resource_id", ""),
                    document_id=meta.get("document_id", ""),
                    chunk_index=int(meta.get("chunk_index", 0)),
                ))
                context_parts.append(
                    f"[Source: {meta.get('file_name', 'Unknown')}, Page {meta.get('page_number', '?')}]\n{doc_text}"
                )

        if not context_parts:
            answer = await llm_service.chat(
                system_prompt=FRIENDLY_FALLBACK_PROMPT,
                user_message=question,
            )
            return answer, []

        context = "\n\n---\n\n".join(context_parts)
        answer = await llm_service.chat(
            system_prompt=RAG_SYSTEM_PROMPT.format(context=context),
            user_message=question,
        )
        return answer, citations

    def _build_where_filter(self, resource_ids: Optional[List[str]]) -> Optional[dict]:
        if not resource_ids:
            return None
        if len(resource_ids) == 1:
            return {"resource_id": {"$eq": resource_ids[0]}}
        return {"resource_id": {"$in": resource_ids}}

    async def query_stream(
        self,
        question: str,
        user_id: str,
        resource_ids: Optional[List[str]] = None,
    ):
        loop = asyncio.get_running_loop()
        query_embedding = await loop.run_in_executor(None, embedding_service.embed_query, question)
        query_embedding = list(map(float, query_embedding))

        where_filter = self._build_where_filter(resource_ids)

        results = await loop.run_in_executor(
            None,
            lambda: chroma_service.query(query_embedding, n_results=settings.top_k_results, where=where_filter),
        )

        citations: List[Citation] = []
        context_parts: List[str] = []

        if results and results.get("documents") and results["documents"][0]:
            for doc_text, meta in zip(results["documents"][0], results["metadatas"][0]):
                citations.append(Citation(
                    document_name=meta.get("file_name", "Unknown"),
                    page_number=int(meta.get("page_number", 1)),
                    snippet=doc_text[:300],
                    resource_id=meta.get("resource_id", ""),
                    document_id=meta.get("document_id", ""),
                    chunk_index=int(meta.get("chunk_index", 0)),
                ))
                context_parts.append(
                    f"[Source: {meta.get('file_name', 'Unknown')}, Page {meta.get('page_number', '?')}]\n{doc_text}"
                )

        if not context_parts:
            async for chunk in llm_service.chat_stream(
                system_prompt=FRIENDLY_FALLBACK_PROMPT,
                user_message=question,
            ):
                yield chunk
            yield f"__CITATIONS__{json.dumps([])}"
            return

        context = "\n\n---\n\n".join(context_parts)
        async for chunk in llm_service.chat_stream(
            system_prompt=RAG_SYSTEM_PROMPT.format(context=context),
            user_message=question,
        ):
            yield chunk

        yield f"__CITATIONS__{json.dumps([c.model_dump() for c in citations])}"

    # ─── Status ────────────────────────────────────────────────────────────────

    async def get_indexing_status(self, document_id: str, db: Client) -> dict:
        res = db.table("documents").select("*").eq("id", document_id).execute()
        if not res.data:
            raise ValueError("Document not found")
        doc = res.data[0]

        chunks_res = db.table("document_chunks").select("id", count="exact").eq("document_id", document_id).execute()
        chunk_count = chunks_res.count or 0

        return {
            "document_id": doc["id"],
            "status": doc["index_status"],
            "pages": doc["pages"],
            "chunks_indexed": chunk_count,
            "error": doc.get("index_error"),
        }


rag_service = RAGService()
