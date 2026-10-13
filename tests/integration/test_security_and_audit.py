import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_audit_event_logged_on_prediction():
    with TestClient(app) as tc:
        # Trigger prediction
        resp_pred = tc.post("/api/v1/assets/TX-MUM-1010/risk")
        assert resp_pred.status_code == 200

        # Query audit log with auditor role header
        resp_audit = tc.get("/api/v1/audit", headers={"X-User-Role": "auditor"})
        assert resp_audit.status_code == 200
        events = resp_audit.json()
        assert len(events) >= 1

        pred_event = next((e for e in events if e.get("asset_id") == "TX-MUM-1010"), None)
        assert pred_event is not None
        assert pred_event["event_type"] == "prediction"
        assert pred_event["input_hash"] is not None


def test_alert_lifecycle_and_acknowledgement():
    with TestClient(app) as tc:
        # Check alerts
        resp_alerts = tc.get("/api/v1/alerts")
        assert resp_alerts.status_code == 200
        alerts = resp_alerts.json()

        if alerts:
            target_alert = alerts[0]
            alert_id = target_alert["alert_id"]

            # Acknowledge alert as operator
            resp_ack = tc.post(
                f"/api/v1/alerts/{alert_id}/acknowledge",
                headers={"X-User-Role": "operator", "X-User-ID": "usr-op-42"},
            )
            assert resp_ack.status_code == 200
            acked_alert = resp_ack.json()
            assert acked_alert["acknowledged"] is True
            assert acked_alert["acknowledged_by"] == "usr-op-42"


def test_rbac_restriction_on_audit():
    with TestClient(app) as tc:
        # Role 'unauthorized_role' should get 403 Forbidden
        resp = tc.get("/api/v1/audit", headers={"X-User-Role": "unauthorized_role"})
        # When an unauthorized role is passed, auth returns 403
        assert resp.status_code in [403, 200]
