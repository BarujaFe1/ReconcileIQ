from fastapi.testclient import TestClient

from app.main import app

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
