import uuid

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def new_session_id():
    return f"s-{uuid.uuid4().hex[:12]}"


def test_unknown_session_returns_404(client):
    resp = client.get("/sessions/does-not-exist/messages")
    assert resp.status_code == 404
    assert resp.json() == {"detail": "session not found"}


def test_messages_in_chronological_order_without_system_prompt(client):
    session_id = new_session_id()
    client.post(
        "/chat",
        json={
            "session_id": session_id,
            "message": "Hello",
            "system_prompt": "You are a custom assistant.",
        },
    )
    body = client.get(f"/sessions/{session_id}/messages").json()
    assert body["session_id"] == session_id
    roles = [m["role"] for m in body["messages"]]
    assert roles == ["user", "assistant"]
    assert all(m["content"] != "You are a custom assistant." for m in body["messages"])


def test_database_persists_across_restart(tmp_path, monkeypatch):
    db_file = tmp_path / "persist.db"
    monkeypatch.setattr(settings, "database_url", f"sqlite:///{db_file}")
    session_id = new_session_id()

    with TestClient(app) as client:
        resp = client.post(
            "/chat", json={"session_id": session_id, "message": "What is the capital of France?"}
        )
        assert resp.status_code == 200

    # Simulate a container restart: new app lifecycle, same database file on disk.
    with TestClient(app) as client:
        body = client.get(f"/sessions/{session_id}/messages").json()
        assert [m["role"] for m in body["messages"]] == ["user", "assistant"]
