from __future__ import annotations

import json
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.matching import (
    export_match_fingerprint,
    reset_state,
    resolve_exception,
    run_reconciliation,
)

ROOT = Path(__file__).resolve().parents[3]
GOLDEN = ROOT / "data" / "golden" / "demo_fingerprint.json"
TMP_DIR = ROOT / "data" / "audit" / "_pytest"


@pytest.fixture(autouse=True)
def isolated_store(tmp_path, monkeypatch):
    audit = tmp_path / "audit.jsonl"
    state = tmp_path / "state.json"
    monkeypatch.setenv("RECONCILEIQ_AUDIT_PATH", str(audit))
    monkeypatch.setenv("RECONCILEIQ_STATE_PATH", str(state))
    reset_state(clear_disk=True)
    yield
    reset_state(clear_disk=True)


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "reconcileiq-api"


def test_demo_and_reconcile():
    demo = client.get("/api/demo")
    assert demo.status_code == 200
    body = demo.json()
    assert body["orders"] >= 10
    assert body["payments"] >= 10
    assert body["fees"] >= 8

    result = client.get("/api/reconcile")
    assert result.status_code == 200
    payload = result.json()
    assert payload["summary"]["exception_count"] >= 1
    assert payload["summary"]["matched_count"] + payload["summary"]["fuzzy_count"] >= 1
    assert len(payload["matches"]) >= 1
    assert len(payload["audit_trail"]) >= 1


def test_exceptions_are_prioritized():
    payload = client.get("/api/reconcile").json()
    severities = [e["severity"] for e in payload["exceptions"]]
    rank = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    scores = [rank[s] for s in severities]
    assert scores == sorted(scores)
    assert severities[0] in {"critical", "high", "medium"}


def test_resolve_exception_persists_across_reload(monkeypatch, tmp_path):
    result = client.get("/api/reconcile").json()
    exception_id = result["exceptions"][0]["exception_id"]
    resolved = client.post(
        "/api/exceptions/resolve",
        json={
            "exception_id": exception_id,
            "action": "mark_investigating",
            "note": "Checking marketplace settlement file",
            "actor": "tester@reconcileiq.local",
        },
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "investigating"

    # Simulate process restart: clear memory cache but keep disk files.
    from app.services import matching as matching_mod

    matching_mod._AUDIT.clear()
    matching_mod._EXCEPTIONS.clear()
    matching_mod._LOADED = False

    again = client.get("/api/reconcile").json()
    item = next(e for e in again["exceptions"] if e["exception_id"] == exception_id)
    assert item["status"] == "investigating"
    assert any(e["action"] == "mark_investigating" for e in again["audit_trail"])


def test_audit_persists_to_jsonl(tmp_path):
    run_reconciliation()
    audit_file = Path(os.environ["RECONCILEIQ_AUDIT_PATH"])
    assert audit_file.exists()
    lines = [ln for ln in audit_file.read_text(encoding="utf-8").splitlines() if ln.strip()]
    assert len(lines) >= 1
    first = json.loads(lines[0])
    assert "event_id" in first and "action" in first


def test_golden_fingerprint_parity():
    expected = json.loads(GOLDEN.read_text(encoding="utf-8"))["matches"]
    actual = export_match_fingerprint()
    assert actual == expected


def test_fuzzy_and_orphan_present():
    result = run_reconciliation()
    methods = {m["method"] for m in result["matches"]}
    statuses = {m["status"] for m in result["matches"]}
    assert "exact_ref" in methods
    assert "fuzzy_name_amount" in methods
    assert "unmatched_payment" in statuses
    assert "unmatched_order" in statuses


def test_resolve_write_off():
    result = run_reconciliation()
    exception_id = result["exceptions"][0]["exception_id"]
    out = resolve_exception(exception_id, "write_off", "demo", "tester")
    assert out["status"] == "resolved"
