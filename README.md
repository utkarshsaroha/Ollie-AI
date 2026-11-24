# Ollie AI — Full-Stack LLM Chat

A multi-turn chatbot with automatic API-key failover, LiteLLM-backed response caching,
per-request token tracking, and SQLite-backed conversation persistence — FastAPI + LiteLLM
on the backend, React/Vite/TypeScript on the frontend, both container-ready.

```
┌────────────┐      HTTP/JSON       ┌──────────────┐      litellm.completion()     ┌──────────────┐
│  Frontend  │ ───────────────────▶ │   FastAPI    │ ─────────────────────────────▶│  LLM Provider│
│ React/Vite │ ◀─────────────────── │   backend    │ ◀───────────────────────────── │ (e.g. Gemini)│
└────────────┘     reply + metadata └──────┬───────┘                               └──────────────┘
                                            │   │
                                     ┌──────▼┐ ┌▼──────────────┐
                                     │SQLite │ │ litellm.Cache │
                                     │/data  │ │  (in-memory)  │
                                     └───────┘ └───────────────┘
```

## Live URLs

Not deployed publicly. This submission was built and verified locally (Docker + manual
browser testing); no hosting account/credentials were available in this environment.
See **Deployment** below for the exact steps to put it on Vercel/Netlify + Render/Railway/Fly.

## Run locally: with Docker and without

### With Docker (recommended)

```powershell
cp .env.example .env
# edit .env: set LLM_API_KEYS to at least 2 real keys for your provider
make up
```

- Backend: http://localhost:8000 (http://localhost:8000/health)
- Frontend: http://localhost:3000
- Stop everything: `make down`

`make up` runs `docker compose up --build -d`. The SQLite database lives on the named
volume `db_data`, mounted at `/data` in the backend container, so it survives
`docker compose restart` / container recreation (not `docker compose down -v`).

### Without Docker

Backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
$env:LLM_API_KEYS = "key-one,key-two"
$env:DATABASE_URL = "sqlite:///./data/app.db"
$env:ALLOWED_ORIGINS = "http://localhost:3000"
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL = "http://localhost:8000"
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `LLM_MODEL` | LiteLLM `provider/model` string, e.g. `gemini/gemini-3.5-flash-lite` |
| `LLM_API_KEYS` | Comma-separated API keys, **minimum 2**, tried in order as `key_1`, `key_2`, ... |
| `DATABASE_URL` | `sqlite:///<path>`; use `sqlite:////data/app.db` in Docker |
| `ENABLE_FAILURE_SIMULATION` | `true`/`false` — enables the `X-Simulate-Failure` test header |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins allowed to call the API |
| `CACHE_ENABLED` | `true`/`false` — enables LiteLLM response caching |
| `DEFAULT_SYSTEM_PROMPT` | Used when a request doesn't send `system_prompt` |
| `VITE_API_BASE_URL` | Frontend build-time var pointing at the backend (baked in at `vite build`) |

The app refuses to start (clear `RuntimeError` at boot) if fewer than 2 keys are configured.

## Design decisions: key fallback, caching, SQLite session storage

**Key fallback.** [`app/utils/key_manager.py`](backend/app/utils/key_manager.py) assigns
`key_1..key_n` in the order keys appear in `LLM_API_KEYS`.
[`app/services/failover_service.py`](backend/app/services/failover_service.py) tries each
key in order via `litellm.completion(api_key=...)`; any failure (simulated or real) advances
to the next key and increments `fallback_attempts`. If every key fails, it raises a single
`HTTPException(503, "all providers unavailable")` — no internal error detail or stack trace
reaches the client, and nothing is written to SQLite for that request.

**Caching.** We use `litellm.caching.caching.Cache(type="local")` — LiteLLM's own built-in,
in-memory cache — not a hand-rolled replacement. The one deliberate twist: instead of letting
`Cache.get_cache_key()` derive the key from kwargs via its own reflection over every
provider's param schema (which — unrelated to this project — currently breaks under very new
Python/typing releases, see `cache_service._cache_key`'s docstring), we hash `model` + the full
`messages` list (system prompt, history, and the new message) ourselves and pass it in via
LiteLLM's own `cache_key=` kwarg, which `Cache.get_cache/add_cache` honor directly. Same
storage/TTL/eviction machinery, deterministic key derivation. Failure simulation is checked
*before* the cache lookup, so a cached response never hides a requested failover demo.

**SQLite session storage.** A single `messages` table (see `app/database.py`), indexed on
`session_id`, holds every user/assistant turn with the assistant's full metadata as a JSON
column. System prompts are never persisted as messages — they're re-supplied (or defaulted)
on every request and only included in the in-memory list sent to the model. Session isolation
and chronological ordering fall out of `WHERE session_id = ? ORDER BY id ASC`; no caching or
in-memory session state is needed since every request re-reads history from SQLite.

## Verification: how to see failover, cache hits and per-message token usage

Run the automated suite (mocked provider, no credentials needed, see `backend/tests/`):

```powershell
cd backend
.venv\Scripts\python -m pytest -v
```

Or against a running server with curl:

**Per-message token usage / basic chat:**

```bash
curl -s http://localhost:8000/chat -X POST -H "Content-Type: application/json" \
  -d '{"session_id":"s-demo","message":"What is the capital of France?"}'
```

`metadata.input_tokens` / `metadata.output_tokens` are specific to this request — never a
running conversation total.

**Cache hit** (send the exact same first message in a brand-new session):

```bash
curl -s http://localhost:8000/chat -X POST -H "Content-Type: application/json" \
  -d '{"session_id":"s-demo-2","message":"What is the capital of France?"}'
```

The second call returns `"resolution_source": "LLM_CACHE"`, `"key_id": null`,
`"fallback_attempts": 0`, the same `reply`/token counts, and a lower `latency_ms`.

**Key failover:**

```bash
curl -s http://localhost:8000/chat -X POST -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: key_1=429" \
  -d '{"session_id":"s-demo-3","message":"Hello"}'
```

Returns HTTP 200 with `"key_id": "key_2"`, `"fallback_attempts": 1` — `key_2` makes a real
provider call.

**All keys unavailable:**

```bash
curl -s -i http://localhost:8000/chat -X POST -H "Content-Type: application/json" \
  -H "X-Simulate-Failure: *=429" \
  -d '{"session_id":"s-demo-4","message":"Hello"}'
```

Returns `503 {"detail": "all providers unavailable"}`; nothing is stored for `s-demo-4`
(`GET /sessions/s-demo-4/messages` → `404`).

In the UI, every assistant bubble carries a metadata strip
(`meta-source` / `meta-model` / `meta-latency` / `meta-input-tokens` / `meta-output-tokens`)
showing exactly what the backend returned for that message — cache hits render in the accent
color with a database icon, live calls with a bolt icon; a fallback count, when non-zero,
renders in red.

## API Reference

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | 200 only if DB reachable, ≥2 keys configured, cache initialized |
| `POST` | `/chat` | Body: `session_id`, `message`, optional `system_prompt`. Header: optional `X-Simulate-Failure` |
| `GET` | `/sessions/{session_id}/messages` | 404 if the session has no messages |

Full request/response shapes live in `backend/app/schemas.py` — the Pydantic models FastAPI
validates every request/response against (422 on violation).

## Deployment

Frontend (Vercel or Netlify) and backend (Render, Railway, or Fly.io) configs are ready;
putting them live needs accounts/credentials this environment doesn't have, so the steps
below are what to run, not a claim that it's already live.

**Backend (Render, Docker-based web service):**
1. Push this repo to GitHub.
2. New Web Service → connect the repo → Root directory `backend`, Dockerfile `backend/Dockerfile`.
3. Add a persistent disk mounted at `/data` (Render: "Add Disk"; ephemeral filesystem will lose
   the SQLite file on every deploy/restart otherwise).
4. Set env vars from `.env.example` (`LLM_MODEL`, `LLM_API_KEYS`, `ENABLE_FAILURE_SIMULATION`,
   `CACHE_ENABLED`, `DATABASE_URL=sqlite:////data/app.db`, and `ALLOWED_ORIGINS` set to your
   frontend's deployed URL).
5. Render's health check path: `/health`.

**Frontend (Vercel):**
1. Import the repo → root directory `frontend` → framework preset "Vite".
2. Build command `npm run build`, output `dist`.
3. Set `VITE_API_BASE_URL` to the backend's Render URL (this is a *build-time* var — redeploy
   after changing it).

## Setup Used: your editor and AI tools

Built with **Claude Code** (Claude Sonnet 5) running directly in this repository — it wrote
the backend/frontend source, ran `pytest`, drove a real browser (via the Claude Code browser
pane) to click through the chat UI end-to-end (including a mocked-backend run for
deterministic live-inference/cache/error screenshots), and iterated on bugs it found that way
(e.g. a sidebar responsive-breakpoint bug and a textarea scrollbar artifact, both fixed during
this session).

## Bonus features (if any): what you added beyond the requirements and why

- **Session switcher in the sidebar.** Starting a new chat keeps the previous session in a
  "Conversations" list; clicking one re-fetches it via the existing
  `GET /sessions/{id}/messages` endpoint. No new backend surface — it's the required endpoint,
  used for more than the single required flow.
- **Auto-reconnecting health indicator.** The sidebar polls `/health` every 15s, so
  "online/offline" and the configured key/cache counts reflect the backend live instead of a
  one-time check.
- **Graceful offline UX.** If the backend is unreachable, the composer stays usable and the
  error renders inline instead of a blank screen or uncaught exception (see `ApiError` in
  `frontend/src/api.ts`).

These were added only after every mandatory item in the spec was implemented and covered by
the automated tests under `backend/tests/`, and none of them change the documented API
contract.
