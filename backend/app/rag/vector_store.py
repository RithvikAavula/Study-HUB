from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb import QueryResult
from app.config.settings import get_settings
from app.utils.logger import logger

_INCLUDE = ["documents", "metadatas", "distances"]

settings = get_settings()


class ChromaService:
    """Manages Chroma Cloud vector store operations."""

    _client: Optional[Any] = None
    _collection: Optional[Any] = None

    def _get_client(self) -> chromadb.HttpClient:
        if self._client is None:
            self._client = chromadb.HttpClient(
                host=settings.chroma_host,
                ssl=True,
                headers={"x-chroma-token": settings.chroma_api_key},
                settings=ChromaSettings(
                    chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
                    chroma_client_auth_credentials=settings.chroma_api_key,
                    chroma_server_authn_provider="chromadb.auth.token_authn.TokenAuthenticationServerProvider",
                ),
                tenant=settings.chroma_tenant,
                database=settings.chroma_database,
            )
            logger.info("Chroma client connected", host=settings.chroma_host)
        return self._client

    def _get_collection(self):
        if self._collection is None:
            client = self._get_client()
            self._collection = client.get_or_create_collection(
                name=settings.chroma_collection,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info("Chroma collection ready", name=settings.chroma_collection)
        return self._collection

    def upsert_chunks(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[Dict[str, Any]],
    ) -> None:
        """Upsert chunks into Chroma in batches of 100."""
        collection = self._get_collection()
        batch_size = 100

        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i : i + batch_size]
            # Force plain Python lists — numpy arrays cause '_type' error in Chroma 0.6
            batch_embeddings = [list(map(float, e)) for e in embeddings[i : i + batch_size]]
            batch_documents = documents[i : i + batch_size]
            batch_metadatas = metadatas[i : i + batch_size]

            collection.upsert(
                ids=batch_ids,
                embeddings=batch_embeddings,
                documents=batch_documents,
                metadatas=batch_metadatas,
            )

        logger.info("Chunks upserted to Chroma", count=len(ids))

    def query(
        self,
        query_embedding: List[float],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Query Chroma for similar chunks."""
        collection = self._get_collection()

        # Chroma errors if n_results > number of items in collection
        count = collection.count()
        if count == 0:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
        actual_n = min(n_results, count)

        kwargs: Dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": actual_n,
            "include": _INCLUDE,
        }
        if where:
            kwargs["where"] = where

        try:
            results = collection.query(**kwargs)
            logger.info("Chroma query", count=collection.count(), n_results=actual_n, has_where=where is not None, hits=len((results.get("documents") or [[]])[0]))
            return results
        except Exception as e:
            logger.error("Chroma query failed", error=repr(e))
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

    def delete_by_document_id(self, document_id: str) -> None:
        """Delete all chunks for a document."""
        collection = self._get_collection()
        collection.delete(where={"document_id": document_id})
        logger.info("Deleted chunks from Chroma", document_id=document_id)

    def delete_by_resource_id(self, resource_id: str) -> None:
        """Delete all chunks for a resource."""
        collection = self._get_collection()
        collection.delete(where={"resource_id": resource_id})
        logger.info("Deleted chunks from Chroma", resource_id=resource_id)

    def count(self) -> int:
        collection = self._get_collection()
        return collection.count()


# Singleton
chroma_service = ChromaService()
