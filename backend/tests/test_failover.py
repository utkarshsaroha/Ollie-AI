import uuid


def new_session_id():
    return f"s-{uuid.uuid4().hex[:12]}"


def test_failover_on_429(client):
    resp = client.post(
        "/chat",
        json={"session_id": new_session_id(), "message": "What is the capital of France?"},
        headers={"X-Simulate-Failure": "key_1=429"},
    )
    assert resp.status_code == 200
    meta = resp.json()["metadata"]
    assert meta["key_id"] == "key_2"
    assert meta["fallback_attempts"] == 1
    assert resp.json()["reply"]


def test_failover_on_500(client):
    resp = client.post(
        "/chat",
        json={"session_id": new_session_id(), "message": "What is the capital of France?"},
        headers={"X-Simulate-Failure": "key_1=500"},
    )
    assert resp.status_code == 200
    meta = resp.json()["metadata"]
    assert meta["key_id"] == "key_2"
    assert meta["fallback_attempts"] == 1


def test_all_keys_fail(client):
    session_id = new_session_id()
    resp = client.post(
        "/chat",
        json={"session_id": session_id, "message": "What is the capital of France?"},
        headers={"X-Simulate-Failure": "*=429"},
    )
    assert resp.status_code == 503
    assert resp.json() == {"detail": "all providers unavailable"}

    history = client.get(f"/sessions/{session_id}/messages")
    assert history.status_code == 404


def test_failure_simulation_does_not_persist_across_requests(client):
    session_id = new_session_id()
    failed = client.post(
        "/chat",
        json={"session_id": session_id, "message": "Hello"},
        headers={"X-Simulate-Failure": "*=429"},
    )
    assert failed.status_code == 503

    ok = client.post(
        "/chat",
        json={"session_id": session_id, "message": "Hello"},
    )
    assert ok.status_code == 200
    assert ok.json()["metadata"]["key_id"] == "key_1"
    assert ok.json()["metadata"]["fallback_attempts"] == 0
