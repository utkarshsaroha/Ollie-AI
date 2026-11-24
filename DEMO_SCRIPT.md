# Demo Video Script (2–3 minutes)

Setup beforehand: `make up`, `.env` has 2 real `LLM_API_KEYS`, browser open to
`http://localhost:3000`.

**0:00–0:20 — What this is**
"This is Ollie AI, a chatbot with multi-turn memory, automatic API-key failover, LiteLLM
response caching, and SQLite persistence, running end-to-end with a FastAPI backend and a
React frontend." Show the empty state and sidebar (session id, backend/keys/cache status).

**0:20–0:50 — Basic chat + metadata**
Click a suggested prompt ("What is the capital of France?"). Point at the reply's metadata
strip: `LIVE_INFERENCE`, model, latency, input/output tokens, `key_1`. Say: "every field here
comes straight from the backend response, nothing is hardcoded in the UI."

**0:50–1:10 — Multi-turn memory**
Type "My name is Utkarsh.", send, then "What is my name?" — show the assistant recalling it,
then open `GET /sessions/{id}/messages` (curl or browser) to show both turns persisted in
SQLite in order.

**1:10–1:40 — Cache hit**
Click "New Chat", send the exact same first message as before. Point out the badge flips to
`LLM_CACHE`, `key_id` is empty, and `latency_ms` is visibly lower than the first run's.

**1:40–2:15 — Key failover**
Switch to a terminal: run the `X-Simulate-Failure: key_1=429` curl example from the README —
show HTTP 200, `key_id: key_2`, `fallback_attempts: 1`, and a real reply. Then run
`X-Simulate-Failure: *=429` — show HTTP 503 `{"detail": "all providers unavailable"}`, and that
`GET /sessions/.../messages` for that session returns 404 (nothing was stored).

**2:15–2:40 — Resilience + tests**
Stop the backend container, show the UI's inline error and the sidebar flipping to "offline"
without crashing. Restart it, show the indicator recover. Run `pytest -q` in a terminal to show
the full automated suite passing.

**2:40–3:00 — Wrap-up**
Restate what's covered: failover, caching, persistence, validation, Docker — and point at the
README for curl examples and deployment steps.
