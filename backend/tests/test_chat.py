import uuid


def new_session_id():
    return f"s-{uuid.uuid4().hex[:12]}"


def test_basic_chat(client):
    session_id = new_session_id()
    resp = client.post(
        "/chat", json={"session_id": session_id, "message": "What is the capital of France?"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["session_id"] == session_id
    assert body["reply"]
    meta = body["metadata"]
    assert meta["resolution_source"] == "LIVE_INFERENCE"
    assert meta["model"] == "gemini/gemini-2.0-flash"
    assert isinstance(meta["latency_ms"], int)
    assert meta["input_tokens"] > 0
    assert meta["output_tokens"] > 0
    assert meta["key_id"] == "key_1"
    assert meta["fallback_attempts"] == 0


def test_multi_turn_memory(client):
    session_id = new_session_id()
    client.post("/chat", json={"session_id": session_id, "message": "My name is Utkarsh."})
    resp = client.post("/chat", json={"session_id": session_id, "message": "What is my name?"})
    assert resp.status_code == 200
    assert "Utkarsh" in resp.json()["reply"]

    history = client.get(f"/sessions/{session_id}/messages").json()["messages"]
    assert len(history) == 4
    assert [m["role"] for m in history] == ["user", "assistant", "user", "assistant"]


def test_session_isolation(client):
    session_a = new_session_id()
    session_b = new_session_id()
    client.post("/chat", json={"session_id": session_a, "message": "My name is Alice."})
    client.post("/chat", json={"session_id": session_b, "message": "My name is Bob."})

    reply_a = client.post(
        "/chat", json={"session_id": session_a, "message": "What is my name?"}
    ).json()["reply"]
    reply_b = client.post(
        "/chat", json={"session_id": session_b, "message": "What is my name?"}
    ).json()["reply"]

    assert "Alice" in reply_a
    assert "Bob" in reply_b

    messages_a = client.get(f"/sessions/{session_a}/messages").json()["messages"]
    assert all("Bob" not in m["content"] for m in messages_a)


def test_validation_missing_session_id(client):
    resp = client.post("/chat", json={"message": "hello"})
    assert resp.status_code == 422


def test_validation_missing_message(client):
    resp = client.post("/chat", json={"session_id": new_session_id()})
    assert resp.status_code == 422


def test_validation_empty_message(client):
    resp = client.post("/chat", json={"session_id": new_session_id(), "message": ""})
    assert resp.status_code == 422


def test_validation_whitespace_only_message(client):
    resp = client.post("/chat", json={"session_id": new_session_id(), "message": "   "})
    assert resp.status_code == 422


def test_validation_message_too_long(client):
    resp = client.post(
        "/chat", json={"session_id": new_session_id(), "message": "a" * 4001}
    )
    assert resp.status_code == 422


def test_validation_invalid_json(client):
    resp = client.post(
        "/chat", data="not json", headers={"Content-Type": "application/json"}
    )
    assert resp.status_code == 422
