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

_DB_PATH = os.path.abspath(
    os.getenv("VIDEO_JOBS_DB", "")
    or os.path.join(os.path.expanduser("~"), "video_data", "video_jobs.db")
)
_db_parent = os.path.dirname(_DB_PATH)
if _db_parent:
    os.makedirs(_db_parent, exist_ok=True)
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _parse_positive_int(env_name: str, default: int) -> int:
    raw = os.getenv(env_name, "")
    if raw:
        try:
            val = int(raw)
            if val < 1:
                raise ValueError("must be >= 1")
            return val
        except ValueError as exc:
            import sys
            print(
                f"[job_store] WARNING: {env_name}={raw!r} is invalid ({exc}); "
                f"using default {default}",
                file=sys.stderr,
            )
    return default


_STATS_HISTORY_MAX = _parse_positive_int("STATS_HISTORY_SIZE", 60)


def init_db() -> None:
    """Create the jobs and stats_history tables if they do not already exist."""
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
            conn.execute("""
                CREATE TABLE IF NOT EXISTS stats_history (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts           REAL    NOT NULL,
                    total_jobs   INTEGER NOT NULL DEFAULT 0,
                    running      INTEGER NOT NULL DEFAULT 0,
                    done         INTEGER NOT NULL DEFAULT 0,
                    error        INTEGER NOT NULL DEFAULT 0,
                    cancelled    INTEGER NOT NULL DEFAULT 0,
                    output_bytes INTEGER NOT NULL DEFAULT 0
                )
            """)
            conn.commit()
        finally:
            conn.close()


def insert_stats_snapshot(ts: float, total_jobs: int, running: int, done: int,
                          error: int, cancelled: int, output_bytes: int) -> None:
    """Insert one stats snapshot, then prune the table to _STATS_HISTORY_MAX rows."""
    with _lock:
        conn = _connect()
        try:
            conn.execute(
                "INSERT INTO stats_history "
                "(ts, total_jobs, running, done, error, cancelled, output_bytes) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (ts, total_jobs, running, done, error, cancelled, output_bytes),
            )
            conn.execute(
                "DELETE FROM stats_history WHERE id NOT IN "
                "(SELECT id FROM stats_history ORDER BY id DESC LIMIT ?)",
                (_STATS_HISTORY_MAX,),
            )
            conn.commit()
        finally:
            conn.close()


def get_stats_history(limit: int = _STATS_HISTORY_MAX) -> list:
    """Return up to `limit` most recent stats snapshots, oldest first."""
    with _lock:
        conn = _connect()
        try:
            rows = conn.execute(
                "SELECT ts, total_jobs, running, done, error, cancelled, output_bytes "
                "FROM stats_history ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
            return list(reversed([dict(r) for r in rows]))
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
    # Column names are interpolated (SQL identifiers cannot be parameterised),
    # but they are strictly filtered to the hardcoded `allowed` set above, so
    # no user-supplied input can reach the query string.  Values are always
    # passed as named parameters and never interpolated.
    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    params = dict(updates)
    params["job_id"] = job_id
    with _lock:
        conn = _connect()
        try:
            conn.execute(
                f"UPDATE video_jobs SET {set_clause} WHERE job_id = :job_id",
                params,
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
                placeholders = ",".join(["?"] * len(stale))
                conn.execute(
                    "DELETE FROM video_jobs WHERE job_id IN (" + placeholders + ")",
                    [r["job_id"] for r in stale],
                )
                conn.commit()
            return stale
        finally:
            conn.close()
