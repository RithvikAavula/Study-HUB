from typing import AsyncGenerator, List, Optional
from openai import AsyncOpenAI
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()


class LLMService:
    """OpenRouter-backed LLM service using OpenAI-compatible API."""

    def __init__(self):
        self._client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )

    async def chat(
        self,
        system_prompt: str,
        user_message: str,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> str:
        """Single-turn chat completion."""
        model = model or settings.openrouter_model
        try:
            response = await self._client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                extra_headers={
                    "HTTP-Referer": settings.frontend_url,
                    "X-Title": "StudyHub AI Assistant",
                },
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error("LLM chat error", error=str(e), model=model)
            raise

    async def chat_stream(
        self,
        system_prompt: str,
        user_message: str,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat completion — yields text chunks."""
        model = model or settings.openrouter_model
        try:
            stream = await self._client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                extra_headers={
                    "HTTP-Referer": settings.frontend_url,
                    "X-Title": "StudyHub AI Assistant",
                },
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as e:
            logger.error("LLM stream error", error=str(e), model=model)
            raise

    async def chat_with_history(
        self,
        messages: List[dict],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> str:
        """Multi-turn chat with message history."""
        model = model or settings.openrouter_model
        try:
            response = await self._client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                extra_headers={
                    "HTTP-Referer": settings.frontend_url,
                    "X-Title": "StudyHub AI Assistant",
                },
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error("LLM history chat error", error=str(e))
            raise


# Singleton
llm_service = LLMService()
