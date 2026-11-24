from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.middleware.error_handler import register_error_handlers
from app.routers import chat, health, sessions
from app.services import cache_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    if len(settings.api_keys) < 2:
        raise RuntimeError(
            "LLM_API_KEYS must configure at least 2 keys for failover (got "
            f"{len(settings.api_keys)})"
        )
    init_db()
    cache_service.init_cache()
    yield


app = FastAPI(title="Lyftr AI Chat API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(sessions.router)
