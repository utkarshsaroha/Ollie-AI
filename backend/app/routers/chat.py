from typing import Optional

from fastapi import APIRouter, Header

from app.config import settings
from app.database import get_messages, insert_message
from app.schemas import ChatMetadata, ChatRequest, ChatResponse
from app.services.failover_service import resolve_chat

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, x_simulate_failure: Optional[str] = Header(default=None)):
    system_prompt = payload.system_prompt or settings.default_system_prompt
    history = get_messages(payload.session_id)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend({"role": m["role"], "content": m["content"]} for m in history)
    messages.append({"role": "user", "content": payload.message})

    result = resolve_chat(messages, x_simulate_failure)

    metadata = ChatMetadata(
        resolution_source=result["resolution_source"],
        model=result["model"],
        latency_ms=result["latency_ms"],
        input_tokens=result["input_tokens"],
        output_tokens=result["output_tokens"],
        key_id=result["key_id"],
        fallback_attempts=result["fallback_attempts"],
    )

    insert_message(payload.session_id, "user", payload.message, None)
    insert_message(payload.session_id, "assistant", result["reply"], metadata.model_dump())

    return ChatResponse(session_id=payload.session_id, reply=result["reply"], metadata=metadata)
