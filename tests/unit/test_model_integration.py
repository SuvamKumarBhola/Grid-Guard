import os
import pytest
from datetime import datetime, timezone

from app.config import Settings
from app.domain.models import (
    Asset,
    AssetLocation,
    FeatureVector,
    DataQualityReport,
)
from app.inference.stub import StubModelProvider
from app.inference.artifact import ArtifactModelProvider, ModelInferenceTimeoutError
from app.inference.fallback import SafetyFallbackProvider
from app.inference.validator import ModelArtifactValidator, ArtifactValidationError
from app.inference.resolver import ModelProviderResolver


@pytest.fixture
def sample_asset():
    return Asset(
        asset_id="TX-MUM-1042",
        asset_type="transformer",
        feeder_id="FDR-MUM-22",
        location=AssetLocation(substation="SUB-ANDHERI", lat=19.076, lng=72.877),
        rated_capacity_kva=1000.0,
        age_years=18.5,
        criticality_class="tier_1",
        connected_customers=1840,
        last_maintenance_date="2025-11-01",
        maintenance_overdue_days=45,
    )


@pytest.fixture
def sample_features():
    return FeatureVector(
        asset_id="TX-MUM-1042",
        timestamp=datetime.now(timezone.utc),
        load_factor_current=0.91,
        load_p95_1h=0.88,
        load_p95_24h=0.82,
        winding_temp_c=108.4,
        temp_rise_rate_c_per_hour=14.2,
        thermal_headroom_c=1.6,
        voltage_variance=0.08,
        current_variance=0.13,
        power_factor=0.82,
        asset_age_years=18.5,
        maintenance_overdue_days=45,
        weather_severity_index=0.65,
        historical_outage_count=3,
    )


@pytest.fixture
def healthy_quality():
    return DataQualityReport(
        freshness_seconds=12.0,
        missing_features=[],
        range_violations=[],
        sensor_health=0.97,
        status="healthy",
    )


def test_stub_provider(sample_asset, sample_features, healthy_quality):
    provider = StubModelProvider()
    pred = provider.predict(sample_features, sample_asset, healthy_quality)

    assert pred.asset_id == "TX-MUM-1042"
    assert pred.runtime_mode == "stub"
    assert pred.route == "stub-model"
    assert pred.severity == "critical"
    assert pred.risk_score >= 0.70
    assert len(pred.contributing_factors) >= 2
    assert pred.confidence >= 0.80


def test_artifact_provider_loads_valid_registered_bundle(sample_asset, sample_features, healthy_quality):
    registered_dir = "model_artifacts/registered/gridguard-risk-0.1.0"
    provider = ArtifactModelProvider(model_dir=registered_dir)

    pred = provider.predict(sample_features, sample_asset, healthy_quality)

    assert pred.asset_id == "TX-MUM-1042"
    assert pred.runtime_mode == "artifact"
    assert pred.route == "champion-model"
    assert pred.model_version == "0.1.0"
    assert pred.severity == "critical"
    assert pred.risk_score >= 0.70
    assert provider.health_check() is True


def test_artifact_validator_rejects_missing_directory():
    validator = ModelArtifactValidator()
    with pytest.raises(ArtifactValidationError, match="Model directory does not exist"):
        validator.validate_directory("model_artifacts/nonexistent_model")


def test_artifact_validator_rejects_missing_required_file(tmp_path):
    # Create empty directory
    validator = ModelArtifactValidator()
    with pytest.raises(ArtifactValidationError, match="Required artifact file missing"):
        validator.validate_directory(str(tmp_path))


def test_artifact_validator_approval_status_enforcement(tmp_path):
    # Copy files but change approval_status to candidate
    import shutil
    import json

    shutil.copytree("model_artifacts/registered/gridguard-risk-0.1.0", str(tmp_path / "model"))
    manifest_file = tmp_path / "model" / "manifest.json"
    with open(manifest_file, "r") as f:
        data = json.load(f)
    data["approval_status"] = "candidate"
    with open(manifest_file, "w") as f:
        json.dump(data, f)

    validator = ModelArtifactValidator(require_approved=True)
    with pytest.raises(ArtifactValidationError, match="not 'approved' as required"):
        validator.validate_directory(str(tmp_path / "model"))


def test_safety_fallback_provider(sample_asset, sample_features):
    degraded_quality = DataQualityReport(
        freshness_seconds=450.0,
        missing_features=["oil_temperature_c"],
        sensor_health=0.45,
        status="degraded",
    )
    fallback_provider = SafetyFallbackProvider(reason="Sensor health degraded to 0.45")
    pred = fallback_provider.predict(sample_features, sample_asset, degraded_quality)

    assert pred.runtime_mode == "fallback"
    assert pred.route == "safety-fallback"
    assert pred.confidence <= 0.65  # Degraded confidence
    assert "SAFETY FALLBACK" in pred.recommended_action
    assert any(cf.feature == "fallback_safety_gate" for cf in pred.contributing_factors)


def test_model_provider_resolver_modes():
    # 1. Stub mode
    settings_stub = Settings(GRIDGUARD_MODEL_MODE="stub")
    p_stub = ModelProviderResolver.resolve(settings_stub)
    assert isinstance(p_stub, StubModelProvider)

    # 2. Artifact mode with valid dir
    settings_art = Settings(
        GRIDGUARD_MODEL_MODE="artifact",
        GRIDGUARD_MODEL_DIR="model_artifacts/registered/gridguard-risk-0.1.0",
    )
    p_art = ModelProviderResolver.resolve(settings_art)
    assert isinstance(p_art, ArtifactModelProvider)

    # 3. Artifact mode with invalid dir falls back to SafetyFallbackProvider gracefully
    settings_bad_art = Settings(
        GRIDGUARD_MODEL_MODE="artifact",
        GRIDGUARD_MODEL_DIR="model_artifacts/registered/invalid_nonexistent",
    )
    p_fallback = ModelProviderResolver.resolve(settings_bad_art)
    assert isinstance(p_fallback, SafetyFallbackProvider)


def test_inference_timeout(sample_asset, sample_features, healthy_quality):
    # Set timeout extremely small to test timeout threshold enforcement
    provider = ArtifactModelProvider(
        model_dir="model_artifacts/registered/gridguard-risk-0.1.0",
        timeout_seconds=0.0000001,
    )
    with pytest.raises(ModelInferenceTimeoutError):
        # Simulate slight delay
        import time
        time.sleep(0.001)
        provider.predict(sample_features, sample_asset, healthy_quality)
