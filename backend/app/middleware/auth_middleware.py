import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> dict:
    """Verify Supabase JWT and return user payload."""
    token = credentials.credentials
    try:
        url = f"{settings.supabase_url}/auth/v1/user"
        headers = {
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {token}",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Auth verification failed", error=str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")
