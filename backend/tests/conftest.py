import os

os.environ.setdefault("LLM_API_KEYS", "test-key-1,test-key-2")
os.environ.setdefault("ENABLE_FAILURE_SIMULATION", "true")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("CACHE_ENABLED", "true")
os.environ.setdefault("LLM_MODEL", "gemini/gemini-3.5-flash-lite")

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services import llm_service

from tests.helpers import fake_call_provider


@pytest.fixture(autouse=True)
def mock_llm(monkeypatch):
    monkeypatch.setattr(llm_service, "call_provider", fake_call_provider)


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_file = tmp_path / "test.db"
    monkeypatch.setattr(settings, "database_url", f"sqlite:///{db_file}")
    with TestClient(app) as c:
        yield c
