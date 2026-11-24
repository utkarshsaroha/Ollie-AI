import uuid


def new_session_id():
    return f"s-{uuid.uuid4().hex[:12]}"


def test_cache_hit_on_identical_first_message(client):
    message = "What is the capital of France?"

    first = client.post("/chat", json={"session_id": new_session_id(), "message": message})
    second = client.post("/chat", json={"session_id": new_session_id(), "message": message})

    assert first.status_code == 200
    assert second.status_code == 200

    first_meta = first.json()["metadata"]
    second_meta = second.json()["metadata"]

    assert first_meta["resolution_source"] == "LIVE_INFERENCE"
    assert second_meta["resolution_source"] == "LLM_CACHE"
    assert second.json()["reply"] == first.json()["reply"]
    assert second_meta["input_tokens"] == first_meta["input_tokens"]
    assert second_meta["output_tokens"] == first_meta["output_tokens"]
    assert second_meta["key_id"] is None
    assert second_meta["fallback_attempts"] == 0
    assert second_meta["latency_ms"] < first_meta["latency_ms"]


def test_different_messages_do_not_share_cache(client):
    resp_a = client.post(
        "/chat", json={"session_id": new_session_id(), "message": "What is the capital of France?"}
    )
    resp_b = client.post(
        "/chat", json={"session_id": new_session_id(), "message": "What is the capital of Japan?"}
    )
    assert resp_a.json()["metadata"]["resolution_source"] == "LIVE_INFERENCE"
    assert resp_b.json()["metadata"]["resolution_source"] == "LIVE_INFERENCE"
    assert resp_a.json()["reply"] != resp_b.json()["reply"]


def test_different_system_prompt_does_not_share_cache(client):
    message = "What is the capital of France?"
    resp_a = client.post("/chat", json={"session_id": new_session_id(), "message": message})
    resp_b = client.post(
        "/chat",
        json={
            "session_id": new_session_id(),
            "message": message,
            "system_prompt": "You are a pirate. Answer in pirate speak.",
        },
    )
    assert resp_a.json()["metadata"]["resolution_source"] == "LIVE_INFERENCE"
    assert resp_b.json()["metadata"]["resolution_source"] == "LIVE_INFERENCE"
