import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app


def test_fallback_activated_on_degraded_sensor_health():
    with TestClient(app) as tc:
        # Sensor health 0.40 (< 0.75 threshold)
        payload = {
            "observations": {
                "load_factor": 0.80,
                "winding_temperature_c": 98.0,
                "ambient_temperature_c": 32.0,
                "voltage_variance": 0.04,
                "current_variance": 0.05,
                "power_factor": 0.90,
            },
            "sensor_health": 0.40,
        }
        resp = tc.post("/api/v1/assets/TX-MUM-1005/risk", json=payload)
        assert resp.status_code == 200
        pred = resp.json()

        assert pred["route"] == "safety-fallback"
        assert pred["runtime_mode"] == "fallback"
        assert pred["confidence"] <= 0.65
        assert "SAFETY FALLBACK" in pred["recommended_action"]
        assert "Sensor health" in pred["recommended_action"]


def test_fallback_activated_on_stale_telemetry():
    with TestClient(app) as tc:
        stale_time = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
        payload = {
            "observations": {
                "load_factor": 0.60,
                "winding_temperature_c": 65.0,
                "ambient_temperature_c": 30.0,
                "voltage_variance": 0.02,
                "current_variance": 0.03,
                "power_factor": 0.95,
            },
            "sensor_health": 0.95,
            "observed_at": stale_time,
        }
        resp = tc.post("/api/v1/assets/TX-MUM-1006/risk", json=payload)
        assert resp.status_code == 200
        pred = resp.json()

        assert pred["route"] == "safety-fallback"
        assert pred["runtime_mode"] == "fallback"
        assert "staleness" in pred["recommended_action"].lower() or "stale" in pred["recommended_action"].lower()


def test_fallback_activated_on_forced_failure_injection():
    with TestClient(app) as tc:
        payload = {
            "force_fallback": True,
        }
        resp = tc.post("/api/v1/assets/TX-MUM-1007/risk", json=payload)
        assert resp.status_code == 200
        pred = resp.json()

        assert pred["route"] == "safety-fallback"
        assert pred["runtime_mode"] == "fallback"
        assert "Failure injection" in pred["recommended_action"]


def test_metrics_reflect_fallback_rate():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert "ml" in data
        assert "fallback_rate" in data["ml"]
        assert data["ml"]["route_distribution"]["safety-fallback"] >= 1
