import pytest
from starlette.testclient import TestClient
from app.main import app


def test_api_v2_metadata():
    """Tests GET /api/v1/anomalies/v2/metadata returns model metadata."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/anomalies/v2/metadata")
        assert resp.status_code == 200
        data = resp.json()
        assert data["model_version"] == "2.0.0"
        assert data["model_type"] == "IsolationForest"
        assert data["feature_count"] == 45
        assert len(data["feature_columns"]) == 45
        assert data["reference_threshold"] == pytest.approx(0.020245, rel=1e-3)
        assert data["training_rows"] == 12994
        assert data["future_evaluation_rows"] == 5569
        assert data["evaluation_flagged_alerts"] == 696
        assert data["evaluation_alert_rate_pct"] == 12.50
        assert data["total_episodes_count"] == 156
        assert "not yet validated predictions of transformer failure" in data["product_claim"]


def test_api_v2_score_endpoint():
    """Tests POST /api/v1/anomalies/v2/score for normal vs anomalous telemetry."""
    with TestClient(app) as client:
        # Get sample telemetry
        sample_resp = client.get("/api/v1/anomalies/v2/sample")
        assert sample_resp.status_code == 200
        samples = sample_resp.json()

        # Score normal baseline
        normal_payload = {"features": samples["normal_baseline"]["features"]}
        resp_norm = client.post("/api/v1/anomalies/v2/score", json=normal_payload)
        assert resp_norm.status_code == 200
        data_norm = resp_norm.json()
        assert data_norm["is_anomaly_alert"] is False
        assert data_norm["severity_tier"] == "normal"
        assert data_norm["anomaly_score"] < data_norm["reference_threshold"]

        # Score March 1 imbalance episode
        m1_payload = {"features": samples["march_1_imbalance"]["features"]}
        resp_m1 = client.post("/api/v1/anomalies/v2/score", json=m1_payload)
        assert resp_m1.status_code == 200
        data_m1 = resp_m1.json()
        assert data_m1["is_anomaly_alert"] is True
        assert data_m1["anomaly_score"] > data_m1["reference_threshold"]
        assert len(data_m1["descriptive_contributors"]) > 0


def test_api_v2_episodes_endpoint():
    """Tests GET /api/v1/anomalies/v2/episodes returns grouped episodes."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/anomalies/v2/episodes?limit=10")
        assert resp.status_code == 200
        episodes = resp.json()
        assert len(episodes) == 10
        top = episodes[0]
        assert top["alert_count"] == 63
        assert "2020-03-01" in top["start_time"]
        assert top["max_score"] > 0.08


def test_api_v2_drift_endpoint():
    """Tests GET /api/v1/anomalies/v2/drift returns distribution and monthly drift."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/anomalies/v2/drift")
        assert resp.status_code == 200
        data = resp.json()
        assert "distribution_metrics" in data
        assert "monthly_alert_rates" in data
        assert len(data["monthly_alert_rates"]) == 4


def test_api_v2_data_quality_endpoint():
    """Tests GET /api/v1/anomalies/v2/data-quality returns zero check and cleaning report."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/anomalies/v2/data-quality")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_records"] == 20024
        assert data["suspicious_zero_line_records"] == 1295
        assert data["controlled_validation_evaluation_records"] == 5569
        assert data["controlled_validation_score_changes"] == 0
        assert data["controlled_validation_alert_decision_changes"] == 0


def test_api_v2_reproduction_endpoint():
    """Tests GET /api/v1/anomalies/v2/reproduction verifies evaluation exact reproduction."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/anomalies/v2/reproduction")
        assert resp.status_code == 200
        data = resp.json()
        assert data["evaluation_records"] == 5569
        assert data["flagged_alerts"] == 696
        assert data["alert_rate_pct"] == 12.50
        assert data["reproduction_exact"] is True


def test_api_v2_validation_error_on_poor_coverage():
    """Tests POST /api/v1/anomalies/v2/score returns 400 when feature coverage < 80%."""
    with TestClient(app) as client:
        resp = client.post("/api/v1/anomalies/v2/score", json={"features": {"VL1": 240.0}})
        assert resp.status_code == 400
        err = resp.json()
        assert "below the required minimum threshold" in err["error"]["message"]
