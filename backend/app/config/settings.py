from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # OpenRouter
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "google/gemini-2.5-flash"

    # Chroma
    chroma_host: str = "api.trychroma.com"
    chroma_api_key: str
    chroma_tenant: str
    chroma_database: str
    chroma_collection: str = "study_hub_embeddings"

    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    supabase_storage_bucket: str = "academic-resources"

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Database (optional — not used, Supabase client handles DB)
    database_url: Optional[str] = None

    # RAG
    chunk_size: int = 700
    chunk_overlap: int = 100
    top_k_results: int = 5
    max_pdf_size_mb: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
