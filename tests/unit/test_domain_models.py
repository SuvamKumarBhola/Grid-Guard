import pytest
from pydantic import ValidationError
from datetime import datetime, timezone

from app.domain.models import (
    Asset,
    AssetLocation,
    Feeder,
    TelemetryObservation,
    TelemetryIngestPayload,
    DataQualityReport,
    FeatureVector,
    RiskPrediction,
    FailureWindow,
    ContributingFactor,
    AnomalyResult,
    SimulationRequest,
    SimulationResult,
    SimulationResultDetail,
    Alert,
    AuditEvent,
    ModelManifest,
    ModelManifestMetrics,
    ErrorResponse,
)


def test_asset_model_valid():
    asset = Asset(
        asset_id="TX-MUM-1042",
        asset_type="transformer",
        feeder_id="FDR-MUM-22",
        location=AssetLocation(substation="Bandra North", lat=19.0596, lng=72.8295),
        rated_capacity_kva=1000.0,
        age_years=14.5,
        criticality_class="tier_1",
        connected_customers=1840,
        last_maintenance_date="2025-11-10",
        maintenance_overdue_days=45,
    )
    assert asset.asset_id == "TX-MUM-1042"
    assert asset.rated_capacity_kva == 1000.0


def test_asset_model_invalid_negative_capacity():
    with pytest.raises(ValidationError):
        Asset(
            asset_id="TX-INVALID",
            asset_type="transformer",
            feeder_id="FDR-MUM-22",
            location=AssetLocation(substation="Bandra North", lat=19.0596, lng=72.8295),
            rated_capacity_kva=-500.0,  # Invalid negative
            age_years=5.0,
            criticality_class="tier_1",
            connected_customers=100,
            last_maintenance_date="2026-01-01",
        )


def test_telemetry_observation_valid_and_bounds():
    obs = TelemetryObservation(
        load_factor=0.91,
        winding_temperature_c=108.4,
        ambient_temperature_c=34.2,
        voltage_variance=0.08,
        current_variance=0.13,
        power_factor=0.82,
        oil_temperature_c=92.1,
    )
    assert obs.winding_temperature_c == 108.4

    # Out of bounds load_factor
    with pytest.raises(ValidationError):
        TelemetryObservation(
            load_factor=4.5,  # > 3.0
            winding_temperature_c=108.4,
            ambient_temperature_c=34.2,
            voltage_variance=0.08,
            current_variance=0.13,
            power_factor=0.82,
        )


def test_risk_prediction_schema():
    pred = RiskPrediction(
        request_id="req_01J9X",
        asset_id="TX-MUM-1042",
        risk_score=0.87,
        severity="critical",
        failure_window_hours=FailureWindow(low=8, high=14),
        confidence=0.91,
        model_version="gridguard-risk-0.4.1",
        runtime_mode="artifact",
        route="champion-model",
        contributing_factors=[
            ContributingFactor(feature="winding_temperature_c", direction="up", impact=0.45),
            ContributingFactor(feature="load_factor", direction="up", impact=0.24),
        ],
        recommended_action="Dispatch inspection crew and review feeder load",
        data_quality=DataQualityReport(
            freshness_seconds=12.0,
            missing_features=[],
            sensor_health=0.97,
            status="healthy",
        ),
    )
    assert pred.severity == "critical"
    assert pred.risk_score == 0.87
    assert len(pred.contributing_factors) == 2


def test_simulation_request_and_result():
    req = SimulationRequest(
        source_asset_id="TX-MUM-1042",
        target_feeder_id="FDR-MUM-22",
        redistribution_percent=15.0,
        duration_hours=6.0,
    )
    assert req.redistribution_percent == 15.0

    res = SimulationResult(
        request_id="sim_01J9Y",
        simulation_id="sim_01J9Y",
        scenario={"redistribution_percent": 15, "duration_hours": 6},
        result=SimulationResultDetail(
            status="advisable_with_review",
            source_failure_risk_before=0.87,
            source_failure_risk_after=0.56,
            target_overload_risk=0.18,
            customers_protected_estimate=1840,
            estimated_energy_loss_kwh=42.0,
            confidence=0.78,
            constraints=["requires operator approval", "do not exceed target feeder cap"],
            requires_human_approval=True,
        ),
    )
    assert res.result.requires_human_approval is True
    assert "advisory" in res.result.advisory_disclaimer.lower()


def test_model_manifest_validation():
    manifest = ModelManifest(
        model_name="gridguard-risk",
        model_version="0.1.0",
        artifact_format="onnx",
        created_at="2026-10-13T00:00:00Z",
        framework="onnxruntime",
        input_schema_version="features-v1",
        output_schema_version="risk-v1",
        training_dataset_reference="kaggle://owner/dataset/version",
        metrics=ModelManifestMetrics(
            critical_recall=0.96,
            calibration_error=0.04,
            validation_samples=5000,
        ),
        approval_status="approved",
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    assert manifest.approval_status == "approved"
    assert manifest.metrics.critical_recall == 0.96
