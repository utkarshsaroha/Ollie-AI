# Final Testing Report

## Automated backend tests — PASS

`cd backend && .venv\Scripts\python -m pytest -q` → **20 passed**, using a mocked LLM provider
(`tests/helpers.py`) so the suite needs no real credentials. Covered:

| Spec test | File | Result |
|---|---|---|
| 1. Health check | `test_health.py` | PASS |
| 2. Basic chatbot | `test_chat.py::test_basic_chat` | PASS |
| 3. Multi-turn memory | `test_chat.py::test_multi_turn_memory` | PASS |
| 4. Session isolation | `test_chat.py::test_session_isolation` | PASS |
| 5. Cache hit (+ different message / different system prompt don't share cache) | `test_cache.py` | PASS (3 tests) |
| 6. Key failover (429 and 500) | `test_failover.py` | PASS (2 tests) |
| 7. All keys fail (503, nothing stored) | `test_failover.py::test_all_keys_fail` | PASS |
| — simulated failure doesn't persist to the next request | `test_failover.py` | PASS |
| 8. Validation (missing/empty/whitespace/too-long/invalid JSON) | `test_chat.py` | PASS (6 tests) |
| 9. Unknown session → 404 | `test_sessions.py::test_unknown_session_returns_404` | PASS |
| — messages exclude the system prompt, chronological order | `test_sessions.py` | PASS |
| 10. Database persistence across a simulated restart | `test_sessions.py::test_database_persists_across_restart` | PASS |

## Frontend — type-checked, built, and driven in a real browser

`npm run build` (`tsc -b && vite build`) passes with no type errors. The app was then run
against a live FastAPI instance (LLM call mocked the same way as the pytest suite, for
deterministic, credential-free verification) and driven end-to-end in the Claude Code browser
pane:

- Sent a message, confirmed the composer clears and the reply renders with a full metadata
  strip (`meta-source`/`meta-model`/`meta-latency`/`meta-input-tokens`/`meta-output-tokens`,
  plus `key_1`).
- Started a new chat, sent the identical first message, confirmed the UI shows
  `LLM_CACHE`/`0ms`/no key — and that the prior session appeared in the sidebar's conversation
  list and reloaded correctly on click.
- Resized to a 375px mobile viewport: sidebar hides behind a hamburger toggle, composer and
  metadata stay fully readable, no horizontal scroll.
- Killed the backend process: UI showed "offline" in the sidebar and a readable inline error
  bubble instead of crashing; restarted the backend and confirmed the health indicator and a
  follow-up message both recovered automatically.
- Found and fixed two real bugs this way: a sidebar open/closed state that read
  `window.innerWidth` before the preview pane had finished sizing itself (now driven by a
  `matchMedia` listener), and a stray scrollbar-thumb artifact on the composer textarea.

Not exercised in the browser: `X-Simulate-Failure` (it's a backend test header, not a UI
control — covered instead by the `test_failover.py` automated tests above).

## Docker (`make up`) — environment-blocked, not verified end-to-end

`docker compose config` resolves the compose file correctly (env vars, build args, healthcheck,
volumes, ports all as intended — see command output from this session). However, Docker
Desktop would not stay up in this sandboxed Windows environment long enough to run
`docker compose up --build`: the daemon came up briefly during a startup poll and then dropped
again (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`)
before an image build could run. This looks like an environment/Docker Desktop stability issue
in this sandbox, not a project config problem, but it means the actual container build/run and
the `/data` volume-persistence behavior are **not yet verified on a live daemon**.

**Action needed from you:** run `make up` (or `docker compose up --build`) locally with
Docker Desktop fully started, confirm `http://localhost:8000/health` and
`http://localhost:3000` both come up, then `make down`. Flag it back if the build itself fails
(as opposed to the daemon issue above) and I'll fix it.

## Live LLM integration — not run (no credentials)

No real provider API keys were available in this environment. The failover/cache/token-usage
behavior is verified with a deterministic mocked provider (see above); a true live run needs
real keys in `.env` and should be done once you have them, per the spec's "mocked for CI, live
when credentials exist" guidance.

## Deployment — configured, not live

Render/Vercel configuration and steps are in the README's **Deployment** section. Nothing is
deployed publicly; doing so needs your own hosting accounts.
