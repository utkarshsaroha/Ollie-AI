from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import ping
from app.services import cache_service

router = APIRouter()


@router.get("/health")
def health():
    try:
        db_ok = ping()
    except Exception:
        db_ok = False
    keys_configured = len(settings.api_keys)
    cache_ok = cache_service.is_initialized() if settings.cache_enabled else True

    body = {
        "status": "ok",
        "keys_configured": keys_configured,
        "cache_enabled": settings.cache_enabled,
    }
    healthy = db_ok and keys_configured >= 2 and cache_ok
    if not healthy:
        body["status"] = "error"
        return JSONResponse(status_code=503, content=body)
    return body
