"""
Persistent storage for video job metadata using SQLite.

Only metadata that must survive a server restart is stored here:
  job_id, status, output_path, error, created_at, last_polled_at

Transient fields (progress, frame, total, cancel_event) live only in the
in-memory _video_jobs dict inside app.py.
"""
import os
import sqlite3
import threading
import time
from typing import Optional

_DB_PATH = os.path.join(os.path.dirname(__file__), "video_jobs.db")
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the jobs table if it does not already exist."""
    with _lock:
        conn = _connect()
        try:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS video_jobs (
                    job_id        TEXT PRIMARY KEY,
                    status        TEXT NOT NULL DEFAULT 'running',
                    output_path   TEXT,
                    error         TEXT,
                    created_at    REAL NOT NULL,
                    last_polled_at REAL NOT NULL
                )
            """)
            conn.commit()
        finally:
            conn.close()


def insert_job(job_id: str, created_at: float, output_path: str = None) -> None:
    """Insert a new job record with status='running'.

    output_path should be the pre-assigned destination path so that, if the
    server crashes after processing finishes but before update_job is called,
    startup recovery can recognise the completed file and mark the job 'done'
    rather than treating it as an orphan.
    """
    with _lock:
        conn = _connect()
        try:
            conn.execute(
                "INSERT INTO video_jobs (job_id, status, output_path, created_at, last_polled_at) "
                "VALUES (?, 'running', ?, ?, ?)",
                (job_id, output_path, created_at, created_at),
            )
            conn.commit()
        finally:
            conn.close()


def update_job(job_id: str, **fields) -> None:
    """
    Update one or more fields for a job.
    Accepted kwargs: status, output_path, error, last_polled_at
    """
    allowed = {"status", "output_path", "error", "last_polled_at"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [job_id]
    with _lock:
        conn = _connect()
        try:
            conn.execute(
                f"UPDATE video_jobs SET {set_clause} WHERE job_id = ?",
                values,
            )
            conn.commit()
        finally:
            conn.close()


def delete_job(job_id: str) -> None:
    """Remove a job record from the database."""
    with _lock:
        conn = _connect()
        try:
            conn.execute("DELETE FROM video_jobs WHERE job_id = ?", (job_id,))
            conn.commit()
        finally:
            conn.close()


def load_all_jobs() -> list:
    """Return all job rows as a list of dicts."""
    with _lock:
        conn = _connect()
        try:
            rows = conn.execute("SELECT * FROM video_jobs").fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


def delete_stale_jobs(cutoff: float) -> list:
    """
    Delete all jobs whose last_polled_at is older than cutoff.
    Returns a list of dicts for the deleted rows (so callers can remove files).
    """
    with _lock:
        conn = _connect()
        try:
            rows = conn.execute(
                "SELECT * FROM video_jobs WHERE last_polled_at < ?", (cutoff,)
            ).fetchall()
            stale = [dict(r) for r in rows]
            if stale:
                placeholders = ",".join("?" * len(stale))
                conn.execute(
                    f"DELETE FROM video_jobs WHERE job_id IN ({placeholders})",
                    [r["job_id"] for r in stale],
                )
                conn.commit()
            return stale
        finally:
            conn.close()
