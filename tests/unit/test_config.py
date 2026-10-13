import os
from app.config import Settings


def test_settings_default_values():
    settings = Settings()
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.min_sensor_health == 0.75
    assert settings.feature_freshness_max_seconds == 300.0
    assert settings.max_inference_latency_ms == 900.0


def test_settings_env_override(monkeypatch):
    monkeypatch.setenv("GRIDGUARD_MODEL_MODE", "artifact")
    monkeypatch.setenv("GRIDGUARD_MIN_SENSOR_HEALTH", "0.85")
    monkeypatch.setenv("GRIDGUARD_REQUIRE_APPROVED_MODEL", "true")

    settings = Settings()
    assert settings.model_mode == "artifact"
    assert settings.min_sensor_health == 0.85
    assert settings.require_approved_model is True
