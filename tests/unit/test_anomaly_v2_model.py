import os
import json
import pytest
import numpy as np
import pandas as pd
from app.services.anomaly_v2_service import TelemetryAnomalyV2Service, DISALLOWED_COLUMNS


@pytest.fixture(scope="module")
def anomaly_service():
    """Initializes the TelemetryAnomalyV2Service with models-trained directory."""
    service = TelemetryAnomalyV2Service(model_dir="models-trained")
    return service


def test_model_and_metadata_loaded_successfully(anomaly_service):
    """Criterion 2: The fitted v2 model and metadata load successfully."""
    assert anomaly_service.model is not None
    assert anomaly_service.metadata is not None
    assert anomaly_service.metadata["model_version"] == "2.0.0"
    assert anomaly_service.metadata["model_type"] == "IsolationForest"
    assert anomaly_service.metadata["failure_prediction_validated"] is False


def test_feature_columns_and_order_integrity(anomaly_service):
    """Criterion 3: Exactly 45 trained features are used in their metadata-defined order."""
    assert len(anomaly_service.feature_columns) == 45
    expected_first_10 = [
        "VL1", "VL2", "VL3", "IL1", "IL2", "IL3", "VL12", "VL23", "VL31", "INUT"
    ]
    assert anomaly_service.feature_columns[:10] == expected_first_10
    expected_last_5 = ["KW", "KVA", "KVAR", "MPD", "MKVAD"]
    assert anomaly_service.feature_columns[-5:] == expected_last_5


def test_disallowed_columns_excluded_from_inference(anomaly_service):
    """Criterion 4 & 5: Timestamp and diagnostic/unverified alarm columns are excluded."""
    sample = anomaly_service.get_sample_telemetry()["march_1_imbalance"]["features"]
    features_with_prohibited = dict(sample)
    # Add all disallowed columns
    features_with_prohibited["DeviceTimeStamp"] = "2020-03-01 04:30:00"
    features_with_prohibited["phase_voltage_spread"] = 0.5
    features_with_prohibited["phase_voltage_spread_pct"] = 0.002
    features_with_prohibited["phase_voltage_review"] = 0
    features_with_prohibited["WTI"] = 45.0
    features_with_prohibited["OTI_A"] = 0
    features_with_prohibited["OTI_T"] = 0
    features_with_prohibited["MOG_A"] = 0

    resp = anomaly_service.score_record(features_with_prohibited)
    assert resp.anomaly_score is not None
    # Verify that the model was passed exactly 45 features, none of the prohibited ones
    for col in DISALLOWED_COLUMNS:
        assert col not in anomaly_service.feature_columns


def test_missing_value_handling_via_pipeline(anomaly_service):
    """Criterion 6: Missing-value handling uses the fitted SimpleImputer pipeline (median)."""
    sample = dict(anomaly_service.get_sample_telemetry()["march_1_imbalance"]["features"])
    # Set 5 features to None/NaN (coverage = 40/45 = 88.9%, above 80% threshold)
    sample["MDIL1"] = None
    sample["MDIL2"] = None
    sample["MDIL3"] = None
    sample["KVAR"] = None
    sample["OLI"] = None

    resp = anomaly_service.score_record(sample)
    assert resp.anomaly_score is not None
    assert resp.feature_coverage >= 0.80

    # Dropping more than 20% of features must fail validation
    poor_sample = {k: v for i, (k, v) in enumerate(sample.items()) if i < 30}  # only 30/45 = 66%
    with pytest.raises(ValueError, match="below the required minimum threshold"):
        anomaly_service.score_record(poor_sample)


def test_anomaly_score_directionality_and_reference_threshold(anomaly_service):
    """Criterion 7 & 8: Higher scores indicate more anomalous records; threshold from metadata."""
    ref_thresh = anomaly_service.metadata["reference_threshold"]
    assert anomaly_service.reference_threshold == pytest.approx(ref_thresh, rel=1e-9)

    samples = anomaly_service.get_sample_telemetry()
    normal_resp = anomaly_service.score_record(samples["normal_baseline"]["features"])
    m1_resp = anomaly_service.score_record(samples["march_1_imbalance"]["features"])
    feb1_resp = anomaly_service.score_record(samples["feb_1_high_voltage"]["features"])

    # Normal baseline should have a negative score or below threshold
    assert normal_resp.anomaly_score < anomaly_service.reference_threshold
    assert normal_resp.is_anomaly_alert is False
    assert normal_resp.severity_tier == "normal"

    # Unusual episodes have higher scores exceeding threshold
    assert m1_resp.anomaly_score > anomaly_service.reference_threshold
    assert m1_resp.is_anomaly_alert is True

    assert feb1_resp.anomaly_score > anomaly_service.reference_threshold
    assert feb1_resp.is_anomaly_alert is True

    # Higher score = more anomalous
    assert feb1_resp.anomaly_score > normal_resp.anomaly_score
    assert m1_resp.anomaly_score > normal_resp.anomaly_score


def test_historical_evaluation_exact_reproduction(anomaly_service):
    """Criterion 9: Historical evaluation reproduces 5,569 evaluation rows and 696 alerts."""
    result = anomaly_service.reproduce_evaluation(use_cleaned_candidate=False)
    assert result["evaluation_records"] == 5569
    assert result["flagged_alerts"] == 696
    assert result["unflagged_records"] == 4873
    assert result["alert_rate_pct"] == 12.50
    assert result["max_score_diff_vs_saved"] < 1e-12
    assert result["mismatched_flags_count"] == 0
    assert result["reproduction_exact"] is True


def test_episode_grouping_and_retained_timestamps(anomaly_service):
    """Criterion 10: Alert and episode records retain timestamps, scores, and 156 episodes."""
    episodes = anomaly_service.get_episodes(limit=200)
    assert len(episodes) == 156

    top_ep = episodes[0]
    # March 1 episode has 63 alerts
    assert top_ep.alert_count == 63
    assert "2020-03-01" in top_ep.start_time
    assert top_ep.max_score == pytest.approx(0.080994, rel=1e-3)
    assert top_ep.duration_minutes == 990.0

    second_ep = episodes[1]
    # February 1 episode has 39 alerts
    assert second_ep.alert_count == 39
    assert "2020-02-01" in second_ep.start_time
    assert second_ep.max_score == pytest.approx(0.097538, rel=1e-3)


def test_explanations_are_descriptive_not_causal(anomaly_service):
    """Criterion 11 & 12: Explanations are descriptive deviations, not physical root causes."""
    samples = anomaly_service.get_sample_telemetry()
    resp = anomaly_service.score_record(samples["march_1_imbalance"]["features"])

    assert len(resp.descriptive_contributors) > 0
    for contributor in resp.descriptive_contributors:
        assert contributor.role == "descriptive_contributor"
        # Must not claim equipment failure or cause
        assert "cause" not in contributor.detail.lower()
        assert "failure" not in contributor.detail.lower()

    # Product claim explicitly states unsupervised pattern exploration, not failure prediction
    assert "not yet validated predictions of transformer failure" in resp.product_claim


def test_cleaned_candidate_separate_and_produces_identical_eval_scores(anomaly_service):
    """Criterion 13: Cleaned candidate remains separate and produces identical eval results."""
    assert os.path.isfile(anomaly_service.merged_csv_path)
    assert os.path.isfile(anomaly_service.cleaned_csv_path)
    assert anomaly_service.merged_csv_path != anomaly_service.cleaned_csv_path

    # Run reproduction on both datasets
    orig_result = anomaly_service.reproduce_evaluation(use_cleaned_candidate=False)
    clean_result = anomaly_service.reproduce_evaluation(use_cleaned_candidate=True)

    assert orig_result["evaluation_records"] == clean_result["evaluation_records"] == 5569
    assert orig_result["flagged_alerts"] == clean_result["flagged_alerts"] == 696
    assert orig_result["alert_rate_pct"] == clean_result["alert_rate_pct"] == 12.50


def test_original_dataset_integrity(anomaly_service):
    """Criterion 1: Original merged dataset remains available and unchanged."""
    df = pd.read_csv(anomaly_service.merged_csv_path)
    assert df.shape == (20024, 50)
    assert "DeviceTimeStamp" in df.columns
    # Check that suspicious line-voltage zeros are preserved in original dataset
    zero_rows = df[(df["VL12"] == 0) & (df["VL23"] == 0) & (df["VL31"] == 0)]
    assert len(zero_rows) == 1298
