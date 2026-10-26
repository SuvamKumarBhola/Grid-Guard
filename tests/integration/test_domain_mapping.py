import pytest
from fastapi.testclient import TestClient
from app.main import app, app_state
from app.domain.grid_mapping import (
    resolve_canonical_asset_id,
    resolve_canonical_feeder_id,
    WESTERN_TO_MUMBAI_ASSET_MAP,
    WESTERN_TO_MUMBAI_FEEDER_MAP,
)


def test_repository_asset_alias_resolution():
    """Verify InMemoryAssetRepository resolves Western aliases to canonical Mumbai assets."""
    with TestClient(app):
        # Direct alias TX-04 -> TX-MUM-1042
        asset_tx04 = app_state.asset_repo.get("TX-04")
        assert asset_tx04 is not None
        assert asset_tx04.asset_id == "TX-04"
        assert asset_tx04.canonical_id == "TX-MUM-1042"
        assert asset_tx04.alias in ["TX-Oak-04", "TX-04"]

        # Alias TX-Oak-04 -> TX-MUM-1042
        asset_oak = app_state.asset_repo.get("TX-Oak-04")
        assert asset_oak is not None
        assert asset_oak.canonical_id == "TX-MUM-1042"

        # Canonical TX-MUM-1042 retains canonical identity with alias set
        asset_canonical = app_state.asset_repo.get("TX-MUM-1042")
        assert asset_canonical is not None
        assert asset_canonical.asset_id == "TX-MUM-1042"
        assert asset_canonical.alias == "TX-Oak-04"

        # Other Western assets resolve
        assert app_state.asset_repo.get("TX-09") is not None
        assert app_state.asset_repo.get("TX-Pine-02") is not None
        assert app_state.asset_repo.get("TX-01") is not None
        assert app_state.asset_repo.get("TX-Maple-01") is not None


def test_repository_feeder_alias_resolution():
    """Verify InMemoryFeederRepository resolves Western feeder aliases."""
    with TestClient(app):
        feeder_f03 = app_state.feeder_repo.get("Feeder F-03")
        assert feeder_f03 is not None
        assert feeder_f03.canonical_id == "FDR-MUM-22"

        west_sub = app_state.feeder_repo.get("WEST-SUB")
        assert west_sub is not None
        assert west_sub.canonical_id == "FDR-MUM-11"

        fdr_canonical = app_state.feeder_repo.get("FDR-MUM-22")
        assert fdr_canonical is not None
        assert fdr_canonical.alias == "Feeder F-03"


def test_get_asset_detail_western_alias():
    """GET /api/v1/assets/TX-04 must return 200 OK with telemetry, prediction, and work orders."""
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/assets/TX-04")
        assert resp.status_code == 200
        data = resp.json()
        assert data["asset"]["asset_id"] == "TX-04"
        assert data["asset"]["canonical_id"] == "TX-MUM-1042"
        assert data["latest_telemetry"] is not None
        assert data["latest_prediction"] is not None
        assert data["data_quality"] is not None

        # Also test TX-Oak-04
        resp_oak = tc.get("/api/v1/assets/TX-Oak-04")
        assert resp_oak.status_code == 200
        data_oak = resp_oak.json()
        assert data_oak["asset"]["canonical_id"] == "TX-MUM-1042"


def test_score_asset_risk_western_alias():
    """POST /api/v1/assets/TX-04/risk must return 200 OK with risk prediction."""
    with TestClient(app) as tc:
        resp = tc.post("/api/v1/assets/TX-04/risk")
        assert resp.status_code == 200
        pred = resp.json()
        assert pred["asset_id"] == "TX-04"
        assert "risk_score" in pred
        assert "failure_window_hours" in pred


def test_detect_anomalies_western_alias():
    """POST /api/v1/anomalies/detect with asset_id='TX-04' must return 200 OK."""
    with TestClient(app) as tc:
        payload = {
            "asset_id": "TX-04",
            "observations": {
                "load_factor": 1.15,
                "winding_temperature_c": 104.2,
                "ambient_temperature_c": 36.5,
                "oil_temperature_c": 94.0,
                "voltage_variance": 0.08,
                "current_variance": 0.12,
                "power_factor": 0.82,
                "vibration_g": 4.5,
            },
        }
        resp = tc.post("/api/v1/anomalies/detect", json=payload)
        assert resp.status_code == 200
        anom = resp.json()
        assert anom["asset_id"] == "TX-04"
        assert anom["is_anomaly"] is True
        assert len(anom["evidence"]) > 0


def test_simulation_load_redistribution_western_domain():
    """POST /api/v1/simulations/load-redistribution with TX-04 and Western feeders must succeed."""
    with TestClient(app) as tc:
        # Feeder F-03 alias or WEST-SUB
        payload = {
            "source_asset_id": "TX-04",
            "target_feeder_id": "WEST-SUB",
            "redistribution_percent": 15.0,
            "duration_hours": 6.0,
        }
        resp = tc.post("/api/v1/simulations/load-redistribution", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["result"]["status"] == "advisable_with_review"
        assert data["result"]["customers_protected_estimate"] > 0
        assert data["result"]["requires_human_approval"] is True


def test_work_order_list_alias_resolution():
    """GET /api/v1/work-orders must return TX-04 work orders when queried by TX-04, TX-Oak-04, or TX-MUM-1042."""
    with TestClient(app) as tc:
        resp_tx04 = tc.get("/api/v1/work-orders?asset_id=TX-04")
        assert resp_tx04.status_code == 200
        orders_tx04 = resp_tx04.json()
        assert any(wo["work_order_id"] == "WO-2024-9941" for wo in orders_tx04)

        resp_oak = tc.get("/api/v1/work-orders?asset_id=TX-Oak-04")
        assert resp_oak.status_code == 200
        orders_oak = resp_oak.json()
        assert any(wo["work_order_id"] == "WO-2024-9941" for wo in orders_oak)

        resp_mum = tc.get("/api/v1/work-orders?asset_id=TX-MUM-1042")
        assert resp_mum.status_code == 200
        orders_mum = resp_mum.json()
        assert any(wo["work_order_id"] == "WO-2024-9941" for wo in orders_mum)


def test_maintenance_queue_includes_canonical_metadata():
    """GET /api/v1/transformers/maintenance-queue returns items with alias and canonical_asset_id."""
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/transformers/maintenance-queue")
        assert resp.status_code == 200
        data = resp.json()
        tx04_item = next((item for item in data["queue"] if item["asset_id"] == "TX-04"), None)
        assert tx04_item is not None
        assert tx04_item["alias"] == "TX-Oak-04"
        assert tx04_item["canonical_asset_id"] == "TX-MUM-1042"
