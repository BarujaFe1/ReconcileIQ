"""Append-only JSONL audit store for local MVP durability across restarts."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[4]
DEFAULT_AUDIT_PATH = ROOT / "data" / "audit" / "audit.jsonl"
DEFAULT_STATE_PATH = ROOT / "data" / "audit" / "exception_state.json"


def _path_from_env(name: str, default: Path) -> Path:
    raw = os.getenv(name)
    return Path(raw) if raw else default


def audit_path() -> Path:
    return _path_from_env("RECONCILEIQ_AUDIT_PATH", DEFAULT_AUDIT_PATH)


def state_path() -> Path:
    return _path_from_env("RECONCILEIQ_STATE_PATH", DEFAULT_STATE_PATH)


def ensure_dirs() -> None:
    audit_path().parent.mkdir(parents=True, exist_ok=True)


def load_audit_events(limit: int = 500) -> list[dict[str, Any]]:
    path = audit_path()
    if not path.exists():
        return []
    events: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events[-limit:]


def append_audit_event(event: dict[str, Any]) -> None:
    ensure_dirs()
    path = audit_path()
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(event, ensure_ascii=False) + "\n")


def load_exception_state() -> dict[str, dict[str, Any]]:
    path = state_path()
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(data, dict):
        return {}
    return data


def save_exception_state(state: dict[str, dict[str, Any]]) -> None:
    ensure_dirs()
    path = state_path()
    payload = json.dumps(state, ensure_ascii=False, indent=2)
    # Atomic-ish write for local MVP.
    fd, tmp_name = tempfile.mkstemp(prefix="exception_state_", suffix=".json", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(payload)
        Path(tmp_name).replace(path)
    finally:
        tmp = Path(tmp_name)
        if tmp.exists():
            tmp.unlink(missing_ok=True)


def clear_persisted_store() -> None:
    """Test helper: remove persisted audit/state files."""
    for path in (audit_path(), state_path()):
        if path.exists():
            path.unlink()
