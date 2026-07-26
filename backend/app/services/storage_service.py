import httpx
from typing import Optional
from app.config.settings import get_settings
from app.utils.logger import logger

settings = get_settings()


class SupabaseStorageService:
    """Downloads files from Supabase Storage using service role key."""

    def __init__(self):
        self._headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }

    def _resolve_url(self, file_url: str) -> str:
        """Ensure file_url is a full URL. If it's a storage path, build the public URL."""
        if file_url.startswith("http://") or file_url.startswith("https://"):
            return file_url
        # Strip leading slash or bucket prefix
        path = file_url.lstrip("/")
        bucket = settings.supabase_storage_bucket
        if path.startswith(f"{bucket}/"):
            path = path[len(f"{bucket}/"):]
        return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{path}"

    async def download_file(self, file_url: str) -> Optional[bytes]:
        """Download a file from Supabase Storage."""
        url = self._resolve_url(file_url)
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(url, headers=self._headers)
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as e:
            logger.error("Supabase storage download failed", url=url, status=e.response.status_code)
            raise
        except Exception as e:
            logger.error("File download error", url=url, error=str(e))
            raise

    async def get_resource_metadata(self, resource_id: str) -> Optional[dict]:
        """Fetch resource metadata from Supabase DB via REST API."""
        try:
            url = f"{settings.supabase_url}/rest/v1/resources"
            params = {
                "id": f"eq.{resource_id}",
                "select": "id,title,file_url,file_type,department,year,subject,uploaded_by",
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self._headers, params=params)
                response.raise_for_status()
                data = response.json()
                return data[0] if data else None
        except Exception as e:
            logger.error("Failed to fetch resource metadata", resource_id=resource_id, error=str(e))
            return None

    async def verify_user_access(self, user_id: str, resource_id: str) -> bool:
        """Check if user can access this resource (public or own upload)."""
        try:
            url = f"{settings.supabase_url}/rest/v1/resources"
            params = {
                "id": f"eq.{resource_id}",
                "select": "id,uploaded_by",
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers=self._headers, params=params)
                response.raise_for_status()
                data = response.json()
                if not data:
                    return False
                # All resources are public in this platform
                return True
        except Exception as e:
            logger.error("Access verification failed", error=str(e))
            return False


supabase_storage = SupabaseStorageService()
