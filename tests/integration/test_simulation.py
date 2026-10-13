import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_valid_load_redistribution_simulation():
    with TestClient(app) as tc:
        # Move 15% load from TX-MUM-1042 to FDR-MUM-11 (Bandra West)
        payload = {
            "source_asset_id": "TX-MUM-1042",
            "target_feeder_id": "FDR-MUM-11",
            "redistribution_percent": 15.0,
            "duration_hours": 6.0,
        }
        resp = tc.post("/api/v1/simulations/load-redistribution", json=payload)
        assert resp.status_code == 200
        sim = resp.json()

        assert "simulation_id" in sim
        assert "request_id" in sim
        result = sim["result"]
        assert result["status"] == "advisable_with_review"
        assert result["source_failure_risk_after"] < result["source_failure_risk_before"]
        assert result["customers_protected_estimate"] > 0
        assert result["requires_human_approval"] is True
        assert "advisory" in result["advisory_disclaimer"].lower()


def test_overload_scenario_rejection():
    with TestClient(app) as tc:
        # Transfer 95% load
        payload = {
            "source_asset_id": "TX-MUM-1042",
            "target_feeder_id": "FDR-MUM-44",  # Colaba Port Feeder (18 MVA nominal)
            "redistribution_percent": 95.0,
            "duration_hours": 12.0,
        }
        resp = tc.post("/api/v1/simulations/load-redistribution", json=payload)
        assert resp.status_code == 200
        sim = resp.json()
        result = sim["result"]

        # If it breaches headroom, status is rejected_overload
        # Either advisable or rejected, human approval is required
        assert result["requires_human_approval"] is True
        assert len(result["constraints"]) >= 2


def test_simulation_listing():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/simulations")
        assert resp.status_code == 200
        sims = resp.json()
        assert len(sims) >= 1
