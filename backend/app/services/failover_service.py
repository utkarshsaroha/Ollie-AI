import time

from fastapi import HTTPException

from app.config import settings
from app.services import cache_service, llm_service, token_service
from app.utils.key_manager import ordered_keys, parse_simulate_failure, simulated_status_for


def resolve_chat(messages: list[dict], simulate_failure_header: str | None) -> dict:
    """Runs the cache-then-key-failover flow and returns a metadata-shaped dict, or
    raises HTTPException(503) if every configured key is unavailable."""
    model = settings.llm_model
    sim_map = (
        parse_simulate_failure(simulate_failure_header)
        if settings.enable_failure_simulation
        else {}
    )

    start = time.perf_counter()

    # Simulated failures must be demonstrable even when a prior run cached this
    # exact request, so skip the cache lookup entirely whenever simulation is active.
    if not sim_map:
        cached = cache_service.get_cached(model, messages)
        if cached is not None:
            reply, input_tokens, output_tokens = token_service.extract_reply_and_usage(cached)
            return {
                "reply": reply,
                "resolution_source": "LLM_CACHE",
                "model": model,
                "latency_ms": int((time.perf_counter() - start) * 1000),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "key_id": None,
                "fallback_attempts": 0,
            }

    fallback_attempts = 0
    for key_id, key_value in ordered_keys():
        simulated_status = simulated_status_for(key_id, sim_map)
        if simulated_status is not None:
            fallback_attempts += 1
            continue

        try:
            response = llm_service.call_provider(model, messages, key_value)
        except Exception:
            fallback_attempts += 1
            continue

        reply, input_tokens, output_tokens = token_service.extract_reply_and_usage(response)
        cache_service.set_cached(model, messages, response)
        return {
            "reply": reply,
            "resolution_source": "LIVE_INFERENCE",
            "model": model,
            "latency_ms": int((time.perf_counter() - start) * 1000),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "key_id": key_id,
            "fallback_attempts": fallback_attempts,
        }

    raise HTTPException(status_code=503, detail="all providers unavailable")
