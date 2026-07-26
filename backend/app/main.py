from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.database.connection import init_db, get_supabase
from app.api.ai_router import router as ai_router
from app.utils.logger import logger

settings = get_settings()


async def _sync_chroma_state():
    """If Chroma collection was wiped/recreated, reset all Supabase document records
    so they get reindexed when users select them."""
    import asyncio
    try:
        from app.rag.vector_store import chroma_service
        loop = asyncio.get_running_loop()
        count = await loop.run_in_executor(None, chroma_service.count)
        if count == 0:
            db = get_supabase()
            db.table("document_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            db.table("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            logger.info("Chroma collection empty — cleared all Supabase document records for fresh reindex")
        else:
            logger.info("Chroma collection has chunks, no reset needed", count=count)
    except Exception as e:
        logger.warning("Could not sync Chroma state", error=str(e))


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting StudyHub AI Backend", env=settings.app_env)
    await init_db()
    # Validate Chroma collection dimension — resets stale Supabase records if collection was wiped
    await _sync_chroma_state()
    yield
    logger.info("Shutting down")


app = FastAPI(title="StudyHub AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env}
