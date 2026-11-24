from fastapi import APIRouter, HTTPException

from app.database import get_messages, session_exists
from app.schemas import SessionMessagesResponse

router = APIRouter()


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
def get_session_messages(session_id: str):
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="session not found")
    return SessionMessagesResponse(session_id=session_id, messages=get_messages(session_id))
