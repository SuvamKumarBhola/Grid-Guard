import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.domain.models import (
    RiskPrediction,
    FailureWindow,
    ContributingFactor,
    DataQualityReport,
    TransformerMaintenanceQueueItem,
)


def test_risk_prediction_probability_to_percentage_scaling():
    """Verify RiskPrediction with 0.0-1.0 risk_score computes 0-100 risk_percentage."""
    pred = RiskPrediction(
        request_id="req_test_01",
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
        ],
        recommended_action="Dispatch inspection crew",
        data_quality=DataQualityReport(
            freshness_seconds=12.0,
            missing_features=[],
            sensor_health=0.97,
            status="healthy",
        ),
    )
    assert pred.risk_score == 0.87
    assert pred.risk_percentage == 87.0


def test_risk_prediction_percentage_to_probability_normalization():
    """Verify RiskPrediction with 0-100 risk_score normalizes to 0.0-1.0 and populates risk_percentage."""
    pred = RiskPrediction(
        request_id="req_test_02",
        asset_id="TX-MUM-1042",
        risk_score=92.5,
        severity="critical",
        failure_window_hours=FailureWindow(low=4, high=10),
        confidence=0.95,
        model_version="gridguard-risk-0.4.1",
        runtime_mode="artifact",
        route="champion-model",
        recommended_action="Emergency forced cooling",
        data_quality=DataQualityReport(
            freshness_seconds=5.0,
            missing_features=[],
            sensor_health=0.98,
            status="healthy",
        ),
    )
    assert pred.risk_score == 0.925
    assert pred.risk_percentage == 92.5


def test_transformer_maintenance_queue_item_risk_scaling():
    """Verify TransformerMaintenanceQueueItem handles 0-100 scale and populates current_risk_probability."""
    item = TransformerMaintenanceQueueItem(
        asset_id="TX-04",
        name="TX-04 (TX-Oak-04)",
        substation="Feeder F-03 • 45 MVA Substation",
        maintenance_status="CRITICAL_INTERVENTION",
        days_overdue=24,
        hours_to_critical=0.8,
        current_temperature_c=94.2,
        projected_temperature_4h=106.8,
        current_risk_score=92.0,
        projected_risk_4h=98.5,
        cascading_vulnerability_score=96.0,
        cascading_impact_summary="Primary feeder backbone trip risk.",
        pending_task="Cooling fan bank #2 replacement",
        recommended_sop="SOP-TX-10",
    )
    assert item.current_risk_score == 92.0
    assert item.current_risk_percentage == 92.0
    assert item.current_risk_probability == 0.92

    # Also test passing 0.0-1.0 probability input
    item_prob = TransformerMaintenanceQueueItem(
        asset_id="TX-09",
        name="TX-09",
        substation="Feeder F-04",
        maintenance_status="PENDING_OVERDUE",
        days_overdue=12,
        hours_to_critical=4.5,
        current_temperature_c=82.1,
        projected_temperature_4h=93.4,
        current_risk_score=0.78,
        projected_risk_4h=89.2,
        cascading_vulnerability_score=88.5,
        cascading_impact_summary="RTU stale",
        pending_task="RTU sync",
        recommended_sop="SOP-DGA-01",
    )
    assert item_prob.current_risk_score == 78.0
    assert item_prob.current_risk_percentage == 78.0
    assert item_prob.current_risk_probability == 0.78


def test_api_assets_list_returns_consistent_risk_scaling():
    """GET /api/v1/assets returns normalized 0-100 risk_score, risk_percentage, and risk_probability."""
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/assets")
        assert resp.status_code == 200
        assets = resp.json()
        assert len(assets) > 0

        tx1042 = next(a for a in assets if a["asset"]["asset_id"] == "TX-MUM-1042")
        # Ensure risk_score on 0-100 scale for UI consistency
        assert tx1042["risk_score"] >= 70.0
        assert tx1042["risk_percentage"] >= 70.0
        assert 0.0 <= tx1042["risk_probability"] <= 1.0


def test_api_risk_prediction_returns_both_probability_and_percentage():
    """POST /api/v1/assets/{id}/risk returns probability risk_score and 0-100 risk_percentage."""
    with TestClient(app) as tc:
        resp = tc.post("/api/v1/assets/TX-04/risk")
        assert resp.status_code == 200
        pred = resp.json()
        assert 0.0 <= pred["risk_score"] <= 1.0
        assert 0.0 <= pred["risk_percentage"] <= 100.0
        assert round(pred["risk_score"] * 100.0, 1) == pred["risk_percentage"]


def test_api_maintenance_queue_returns_both_risk_representations():
    """GET /api/v1/transformers/maintenance-queue returns current_risk_score, percentage, and probability."""
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/transformers/maintenance-queue")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["queue"]) > 0
        tx04 = next(item for item in data["queue"] if item["asset_id"] == "TX-04")
        assert tx04["current_risk_score"] == 92.0
        assert tx04["current_risk_percentage"] == 92.0
        assert tx04["current_risk_probability"] == 0.92
