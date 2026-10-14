import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_field_crews():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/crews")
        assert resp.status_code == 200
        crews = resp.json()
        assert len(crews) >= 5
        crew_ids = [c["crew_id"] for c in crews]
        assert "CREW-03-THERMAL" in crew_ids
        assert "CREW-01-RELAY" in crew_ids


def test_list_existing_work_orders():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/work-orders")
        assert resp.status_code == 200
        orders = resp.json()
        assert len(orders) >= 2
        wo_9941 = next((w for w in orders if w["work_order_id"] == "WO-2024-9941"), None)
        assert wo_9941 is not None
        assert wo_9941["asset_id"] == "TX-04"
        assert wo_9941["priority"] == "P1-EMERGENCY"


def test_dispatch_field_crew_success():
    with TestClient(app) as tc:
        payload = {
            "asset_id": "TX-MUM-1042",
            "crew_id": "CREW-01-RELAY",
            "priority": "P1-EMERGENCY",
            "failure_mode": "Top-oil temperature critical runaway (94.2°C) and Fan Bank trip",
            "sop_reference": "SOP-TX-10 (Transformer Hotspot Mitigation)",
            "notes": "Verify dual-operator breaker lock before accessing radiator valves.",
            "eta_minutes": 18,
        }
        resp = tc.post("/api/v1/dispatch", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["asset_id"] == "TX-MUM-1042"
        assert data["crew_id"] == "CREW-01-RELAY"
        assert data["priority"] == "P1-EMERGENCY"
        assert data["status"] == "dispatched"
        assert data["eta_minutes"] == 18
        assert data["work_order_id"].startswith("WO-2026-")

        # Verify retrieved via single work order endpoint
        wo_id = data["work_order_id"]
        resp_get = tc.get(f"/api/v1/work-orders/{wo_id}")
        assert resp_get.status_code == 200
        assert resp_get.json()["work_order_id"] == wo_id

        # Verify audit event was logged
        audit_resp = tc.get("/api/v1/audit?limit=10")
        assert audit_resp.status_code == 200
        audits = audit_resp.json()
        disp_audit = next((a for a in audits if a.get("event_type") == "work_order_dispatch"), None)
        assert disp_audit is not None
        assert disp_audit["asset_id"] == "TX-MUM-1042"


def test_update_work_order_status():
    with TestClient(app) as tc:
        # Create work order
        create_resp = tc.post("/api/v1/dispatch", json={
            "asset_id": "TX-Pine-02",
            "crew_id": "CREW-02-HV",
            "priority": "P2-URGENT",
            "failure_mode": "Radiator valve inspection",
            "sop_reference": "SOP-TX-04",
        })
        assert create_resp.status_code == 201
        wo_id = create_resp.json()["work_order_id"]

        # Update status to on_site
        patch_resp = tc.patch(f"/api/v1/work-orders/{wo_id}/status", json={
            "status": "on_site",
            "notes": "Crew arrived on scene. Commencing infrared thermography."
        })
        assert patch_resp.status_code == 200
        updated = patch_resp.json()
        assert updated["status"] == "on_site"
        assert "Crew arrived" in updated["notes"]


def test_maintenance_queue_endpoint():
    """Tests GET /api/v1/transformers/maintenance-queue returns multi-transformer pending queue with cascading risk."""
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/transformers/maintenance-queue")
        assert resp.status_code == 200
        data = resp.json()
        assert data["pending_count"] >= 3
        assert len(data["queue"]) >= 5
        assert data["critical_cascading_risk_count"] >= 2
        tx_ids = [t["asset_id"] for t in data["queue"]]
        assert "TX-04" in tx_ids
        assert "TX-09" in tx_ids
        assert "TX-Pine-02" in tx_ids


def test_record_audit_event_endpoint():
    """Tests POST /api/v1/audit/record adds operational actions to audit log."""
    with TestClient(app) as tc:
        payload = {
            "action": "RTU Diagnostic Probe Initiated",
            "asset_id": "TX-09",
            "details": {"latency_ms": 14, "protocol": "DNP3"}
        }
        resp = tc.post("/api/v1/audit/record", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "audit_id" in data
        assert data["event_type"] == "operational_action"
        assert data["asset_id"] == "TX-09"


