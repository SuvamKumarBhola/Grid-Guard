import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_and_ready_endpoints():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "gridguard-api"

        resp_ready = tc.get("/api/v1/ready")
        assert resp_ready.status_code == 200
        assert resp_ready.json()["status"] == "ready"


def test_list_assets_and_feeders():
    with TestClient(app) as tc:
        resp_assets = tc.get("/api/v1/assets")
        assert resp_assets.status_code == 200
        assets = resp_assets.json()
        assert len(assets) == 50

        # Check TX-MUM-1042 exists
        tx_1042 = next((a for a in assets if a["asset"]["asset_id"] == "TX-MUM-1042"), None)
        assert tx_1042 is not None
        assert tx_1042["severity"] == "critical"

        # Check feeders
        resp_feeders = tc.get("/api/v1/feeders")
        assert resp_feeders.status_code == 200
        feeders = resp_feeders.json()
        assert len(feeders) == 5


def test_get_single_asset_detail():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/assets/TX-MUM-1042")
        assert resp.status_code == 200
        data = resp.json()
        assert data["asset"]["asset_id"] == "TX-MUM-1042"
        assert data["latest_prediction"] is not None
        assert data["latest_prediction"]["severity"] == "critical"


def test_risk_prediction_api_normal_asset():
    with TestClient(app) as tc:
        # Score normal asset
        resp = tc.post("/api/v1/assets/TX-MUM-1001/risk")
        assert resp.status_code == 200
        pred = resp.json()
        assert pred["asset_id"] == "TX-MUM-1001"
        assert "risk_score" in pred
        assert "severity" in pred
        assert "failure_window_hours" in pred
        assert "confidence" in pred
        assert "model_version" in pred
        assert "runtime_mode" in pred
        assert "route" in pred
        assert "contributing_factors" in pred
        assert "recommended_action" in pred
        assert "data_quality" in pred


def test_risk_prediction_api_with_custom_observation():
    with TestClient(app) as tc:
        payload = {
            "observations": {
                "load_factor": 0.95,
                "winding_temperature_c": 112.0,
                "ambient_temperature_c": 36.0,
                "voltage_variance": 0.07,
                "current_variance": 0.12,
                "power_factor": 0.81,
            },
            "sensor_health": 0.98,
        }
        resp = tc.post("/api/v1/assets/TX-MUM-1002/risk", json=payload)
        assert resp.status_code == 200
        pred = resp.json()
        assert pred["severity"] == "critical"
        assert pred["risk_score"] >= 0.70


def test_anomaly_detection_api():
    with TestClient(app) as tc:
        # Test detection on high stress observation
        payload = {
            "asset_id": "TX-MUM-1042",
            "observations": {
                "load_factor": 1.20,
                "winding_temperature_c": 105.0,
                "ambient_temperature_c": 35.0,
                "voltage_variance": 0.09,
                "current_variance": 0.14,
                "power_factor": 0.78,
                "vibration_g": 4.2,
            },
        }
        resp = tc.post("/api/v1/anomalies/detect", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_anomaly"] is True
        assert data["severity"] == "critical"
        assert len(data["evidence"]) >= 3


def test_structured_error_on_missing_asset():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/assets/TX-NONEXISTENT")
        assert resp.status_code == 404
        err = resp.json()
        assert "error" in err
        assert err["error"]["code"] == "RESOURCE_NOT_FOUND"
        assert "request_id" in err["error"]
