import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);
"""


@contextmanager
def get_connection():
    conn = sqlite3.connect(settings.db_path)
    try:
        yield conn
    finally:
        conn.close()


def init_db() -> None:
    db_dir = os.path.dirname(settings.db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        conn.commit()


def ping() -> bool:
    with get_connection() as conn:
        conn.execute("SELECT 1")
    return True


def insert_message(session_id: str, role: str, content: str, metadata: dict | None) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                session_id,
                role,
                content,
                json.dumps(metadata) if metadata is not None else None,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()


def get_messages(session_id: str) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT role, content, metadata FROM messages WHERE session_id = ? ORDER BY id ASC",
            (session_id,),
        ).fetchall()
    messages = []
    for role, content, metadata in rows:
        entry = {"role": role, "content": content}
        if metadata:
            entry["metadata"] = json.loads(metadata)
        messages.append(entry)
    return messages


def session_exists(session_id: str) -> bool:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT 1 FROM messages WHERE session_id = ? LIMIT 1", (session_id,)
        ).fetchone()
    return row is not None
