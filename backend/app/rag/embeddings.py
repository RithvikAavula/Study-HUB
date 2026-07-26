from typing import List, Optional
from sentence_transformers import SentenceTransformer
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()


class EmbeddingService:
    """Generates embeddings using BAAI/bge-small-en-v1.5."""

    _instance: Optional["EmbeddingService"] = None
    _model: Optional[SentenceTransformer] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        if self._model is None:
            logger.info("Loading embedding model", model=settings.embedding_model)
            self._model = SentenceTransformer(settings.embedding_model)
            logger.info("Embedding model loaded")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of texts. Returns list of float vectors."""
        self._load_model()
        # BGE models benefit from a query prefix for retrieval
        embeddings = self._model.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query with BGE query prefix."""
        self._load_model()
        # BGE recommends this prefix for retrieval queries
        prefixed = f"Represent this sentence for searching relevant passages: {query}"
        embedding = self._model.encode(
            [prefixed],
            normalize_embeddings=True,
        )
        return embedding[0].tolist()

    def get_dimension(self) -> int:
        self._load_model()
        return self._model.get_sentence_embedding_dimension()


# Singleton instance
embedding_service = EmbeddingService()
