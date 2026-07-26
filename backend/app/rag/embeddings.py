import httpx
from typing import List
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()

# text-embedding-3-small produces 1536-dim vectors, widely supported
EMBEDDING_MODEL = "openai/text-embedding-3-small"
EMBEDDING_DIM = 1536


class EmbeddingService:
    """Generates embeddings via OpenRouter's embedding API (no local model)."""

    def _embed(self, texts: List[str]) -> List[List[float]]:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{settings.openrouter_base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": EMBEDDING_MODEL, "input": texts},
            )
            response.raise_for_status()
            data = response.json()
            # Sort by index to preserve order
            items = sorted(data["data"], key=lambda x: x["index"])
            return [item["embedding"] for item in items]

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of texts in chunks of 100."""
        all_embeddings: List[List[float]] = []
        for i in range(0, len(texts), 100):
            batch = texts[i:i + 100]
            logger.info("Embedding batch", start=i, size=len(batch))
            all_embeddings.extend(self._embed(batch))
        return all_embeddings

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query string."""
        return self._embed([query])[0]

    def get_dimension(self) -> int:
        return EMBEDDING_DIM


# Singleton
embedding_service = EmbeddingService()
