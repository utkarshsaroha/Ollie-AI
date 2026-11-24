import hashlib
import json

from litellm.caching.caching import Cache

from app.config import settings

_cache: Cache | None = None


def init_cache() -> None:
    global _cache
    if settings.cache_enabled:
        _cache = Cache(type="local")


def is_initialized() -> bool:
    return _cache is not None


def _cache_key(model: str, messages: list[dict]) -> str:
    """Our own cache key (model + full message list, system prompt and history
    included) passed explicitly via litellm's `cache_key` kwarg. litellm.Cache
    can derive this key itself, but its auto-derivation walks every provider's
    param schema via reflection, which breaks on newer Python/typing releases
    it hasn't caught up with yet -- passing the key ourselves uses the same
    litellm.Cache storage/TTL/eviction machinery while sidestepping that."""
    payload = json.dumps({"model": model, "messages": messages}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def get_cached(model: str, messages: list[dict]):
    if _cache is None:
        return None
    return _cache.get_cache(cache_key=_cache_key(model, messages))


def set_cached(model: str, messages: list[dict], response) -> None:
    if _cache is None:
        return
    _cache.add_cache(response, cache_key=_cache_key(model, messages))
