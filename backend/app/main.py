from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.database.connection import init_db
from app.api.ai_router import router as ai_router
from app.utils.logger import logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting StudyHub AI Backend", env=settings.app_env)
    await init_db()
    yield
    logger.info("Shutting down")


app = FastAPI(title="StudyHub AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env}
