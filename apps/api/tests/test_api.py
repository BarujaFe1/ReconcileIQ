from fastapi.testclient import TestClient

from app.main import app
from app.services.matching import reset_state, run_reconciliation
from app.services.thresholds import normalize_text, sort_exceptions

client = TestClient(app)


def setup_function() -> None:
    reset_state()


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


def test_resolve_exception():
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

    again = client.get("/api/reconcile").json()
    item = next(e for e in again["exceptions"] if e["exception_id"] == exception_id)
    assert item["status"] == "investigating"


def test_normalize_strips_diacritics():
    assert normalize_text("João Pedro") == normalize_text("Joao Pedro")


def test_sort_exceptions_helper():
    sorted_items = sort_exceptions(
        [
            {"severity": "low", "financial_impact": 10},
            {"severity": "high", "financial_impact": 50},
            {"severity": "high", "financial_impact": 90},
        ]
    )
    assert [i["financial_impact"] for i in sorted_items] == [90, 50, 10]


def test_fuzzy_and_orphan_present():
    result = run_reconciliation()
    methods = {m["method"] for m in result["matches"]}
    statuses = {m["status"] for m in result["matches"]}
    assert "exact_ref" in methods
    assert "fuzzy_name_amount" in methods or "fuzzy_matched" in statuses
    assert "unmatched_payment" in statuses
    assert "unmatched_order" in statuses
