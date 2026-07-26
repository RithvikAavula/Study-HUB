from supabase import create_client, Client
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        key = settings.supabase_service_role_key
        if not key or key == "your_supabase_service_role_key_here":
            logger.warning("Service role key not set — RLS will block backend DB writes. Set SUPABASE_SERVICE_ROLE_KEY in .env")
            key = settings.supabase_anon_key
        _client = create_client(settings.supabase_url, key)
        logger.info("Supabase client initialized")
    return _client


async def init_db():
    """No-op: tables are created via Supabase SQL migration."""
    logger.info("DB layer: using Supabase client (no direct connection needed)")
