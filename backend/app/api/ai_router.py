import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from supabase import Client

from app.database.connection import get_supabase
from app.middleware.auth_middleware import get_current_user
from app.models.schemas import (
    ChatRequest, ChatResponse,
    SummaryRequest, SummaryResponse,
    QuizRequest, QuizResponse,
    FlashcardsRequest, FlashcardsResponse,
    ExamQuestionsRequest, ExamQuestionsResponse,
    DocumentUploadRequest, DocumentUploadResponse, IndexingStatusResponse,
    ConversationSummary, ConversationDetail,
    SuggestedQuestionsRequest, SuggestedQuestionsResponse,
)
from app.services.rag_service import rag_service
from app.services.ai_tools_service import ai_tools_service
from app.services.conversation_service import conversation_service
from app.utils.logger import logger

router = APIRouter(prefix="/api/ai", tags=["AI"])


def get_db() -> Client:
    return get_supabase()


# ─── Chat ──────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    user_id = user["id"]

    if body.stream:
        async def event_stream():
            full_text = ""
            conv_id = None
            try:
                async for chunk in rag_service.query_stream(body.question, user_id, body.resource_ids):
                    if chunk.startswith("__CITATIONS__"):
                        citations_data = json.loads(chunk[len("__CITATIONS__"):])
                        conv_id = await conversation_service.get_or_create_conversation(user_id, body.conversation_id, body.question[:80], db)
                        await conversation_service.save_message(conv_id, "user", body.question, None, db)
                        from app.models.schemas import Citation
                        await conversation_service.save_message(conv_id, "assistant", full_text, [Citation(**c) for c in citations_data], db)
                        yield f"data: {json.dumps({'type': 'citations', 'data': citations_data, 'conversation_id': conv_id})}\n\n"
                    else:
                        full_text += chunk
                        yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
            except Exception as e:
                logger.error("Stream error", error=str(e))
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    answer, citations = await rag_service.query(body.question, user_id, body.resource_ids)
    conv_id = await conversation_service.get_or_create_conversation(user_id, body.conversation_id, body.question[:80], db)
    await conversation_service.save_message(conv_id, "user", body.question, None, db)
    msg_id = await conversation_service.save_message(conv_id, "assistant", answer, citations, db)

    return ChatResponse(answer=answer, citations=citations, conversation_id=conv_id, message_id=msg_id)


# ─── Summary ───────────────────────────────────────────────────────────────────

@router.post("/summary", response_model=SummaryResponse)
async def summary(body: SummaryRequest, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        return await ai_tools_service.generate_summary(body.resource_id, db)
    except ValueError as e:
        msg = str(e)
        status = 422 if "No indexed" in msg or "no indexed" in msg.lower() else 404
        raise HTTPException(status_code=status, detail=msg)


# ─── Quiz ───────────────────────────────────────────────────────────────────────

@router.post("/quiz", response_model=QuizResponse)
async def quiz(body: QuizRequest, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        return await ai_tools_service.generate_quiz(body.resource_id, body.num_questions, body.difficulty, body.question_types, db)
    except ValueError as e:
        msg = str(e)
        status = 422 if "No indexed" in msg or "no indexed" in msg.lower() else 404
        raise HTTPException(status_code=status, detail=msg)


# ─── Flashcards ─────────────────────────────────────────────────────────────────

@router.post("/flashcards", response_model=FlashcardsResponse)
async def flashcards(body: FlashcardsRequest, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        return await ai_tools_service.generate_flashcards(body.resource_id, body.num_cards, db)
    except ValueError as e:
        msg = str(e)
        status = 422 if "No indexed" in msg or "no indexed" in msg.lower() else 404
        raise HTTPException(status_code=status, detail=msg)


# ─── Exam Questions ─────────────────────────────────────────────────────────────

@router.post("/questions", response_model=ExamQuestionsResponse)
async def exam_questions(body: ExamQuestionsRequest, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        return await ai_tools_service.generate_exam_questions(body.resource_id, body.marks, body.num_questions, db)
    except ValueError as e:
        msg = str(e)
        status = 422 if "No indexed" in msg or "no indexed" in msg.lower() else 404
        raise HTTPException(status_code=status, detail=msg)


# ─── Suggested Questions ────────────────────────────────────────────────────────

@router.post("/suggested-questions", response_model=SuggestedQuestionsResponse)
async def suggested_questions(body: SuggestedQuestionsRequest, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        return await ai_tools_service.generate_suggested_questions(body.resource_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Document Upload ────────────────────────────────────────────────────────────

@router.post("/reindex-document", response_model=DocumentUploadResponse)
async def reindex_document(body: DocumentUploadRequest, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    """Force re-index a document (deletes existing and re-indexes)."""
    try:
        # Delete existing document record so index_document re-indexes from scratch
        existing = db.table("documents").select("id").eq("resource_id", body.resource_id).execute()
        if existing.data:
            doc_id = existing.data[0]["id"]
            db.table("document_chunks").delete().eq("document_id", doc_id).execute()
            db.table("documents").delete().eq("id", doc_id).execute()
            from app.rag.vector_store import chroma_service
            chroma_service.delete_by_document_id(doc_id)
        doc_id = await rag_service.index_document(body, db)
        return DocumentUploadResponse(document_id=doc_id, status="processing", message="Re-indexing started.")
    except Exception as e:
        logger.error("Reindex error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(body: DocumentUploadRequest, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        doc_id = await rag_service.index_document(body, db)
        return DocumentUploadResponse(document_id=doc_id, status="processing", message="Document is being indexed in the background.")
    except Exception as e:
        logger.error("Upload document error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document-status/{document_id}", response_model=IndexingStatusResponse)
async def document_status(document_id: str, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        status = await rag_service.get_indexing_status(document_id, db)
        return IndexingStatusResponse(**status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/debug/chroma-count")
async def chroma_count(user: dict = Depends(get_current_user)):
    from app.rag.vector_store import chroma_service
    count = chroma_service.count()
    return {"total_chunks": count}


@router.get("/debug/chroma-query")
async def chroma_debug_query(
    resource_id: str,
    user: dict = Depends(get_current_user),
):
    from app.rag.vector_store import chroma_service
    from app.rag.embeddings import embedding_service
    import asyncio
    loop = asyncio.get_event_loop()
    emb = await loop.run_in_executor(None, embedding_service.embed_query, "test query")
    results = chroma_service.query(emb, n_results=3, where={"resource_id": {"$eq": resource_id}})
    return {
        "total_in_collection": chroma_service.count(),
        "hits": len((results.get("documents") or [[]])[0]),
        "metadatas": (results.get("metadatas") or [[]])[0],
    }


# ─── Conversations ──────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    return await conversation_service.list_conversations(user["id"], db)


@router.get("/conversation/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    conv = await conversation_service.get_conversation(conversation_id, user["id"], db)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str, user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    deleted = await conversation_service.delete_conversation(conversation_id, user["id"], db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}
