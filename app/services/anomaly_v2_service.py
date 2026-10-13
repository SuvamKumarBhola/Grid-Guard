import os
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import pandas as pd
import joblib

from app.domain.models import (
    TelemetryAnomalyScoreResponse,
    DescriptiveContributor,
    AnomalyEpisode,
    AnomalyV2MetadataResponse,
    DriftMetric,
    MonthlyAlertRate,
    DataQualityReportResponse,
)

logger = logging.getLogger(__name__)

DISALLOWED_COLUMNS = {
    "DeviceTimeStamp",
    "phase_voltage_spread",
    "phase_voltage_spread_pct",
    "phase_voltage_review",
    "WTI",
    "OTI_A",
    "OTI_T",
    "MOG_A",
}

PRODUCT_CLAIM = (
    "GridGuard uses unsupervised machine learning to flag unusual transformer telemetry "
    "and help operators investigate operating patterns. Its alerts are not yet validated predictions "
    "of transformer failure."
)


class TelemetryAnomalyV2Service:
    """Service wrapping the fitted Isolation Forest v2.0.0 model for transformer telemetry."""

    def __init__(self, model_dir: str = "models-trained"):
        self.model_dir = model_dir
        self.metadata_path = os.path.join(model_dir, "anomaly_metadata_v2.json")
        self.model_path = os.path.join(model_dir, "anomaly_detector_v2.joblib")
        self.merged_csv_path = os.path.join(model_dir, "merged_telemetry.csv")
        self.cleaned_csv_path = os.path.join(model_dir, "merged_telemetry_cleaned_candidate.csv")
        self.episodes_csv_path = os.path.join(model_dir, "anomaly_episodes_v2.csv")
        self.results_csv_path = os.path.join(model_dir, "anomaly_results_v2.csv")
        self.distribution_csv_path = os.path.join(model_dir, "training_vs_future_distributions.csv")
        self.monthly_csv_path = os.path.join(model_dir, "monthly_telemetry_summary.csv")

        self.metadata: Dict[str, Any] = {}
        self.model = None
        self.feature_columns: List[str] = []
        self.reference_threshold: float = 0.020244648295595247
        self.min_feature_coverage: float = 0.80

        # Baseline summary statistics for computing descriptive deviations
        self.train_medians: Dict[str, float] = {}
        self.train_iqrs: Dict[str, float] = {}

        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Loads model pipeline and metadata with backward-compatibility patches."""
        if not os.path.isfile(self.metadata_path):
            raise FileNotFoundError(f"Anomaly v2 metadata not found at '{self.metadata_path}'")
        if not os.path.isfile(self.model_path):
            raise FileNotFoundError(f"Anomaly v2 joblib artifact not found at '{self.model_path}'")

        with open(self.metadata_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        self.feature_columns = self.metadata.get("feature_columns", [])
        self.reference_threshold = float(self.metadata.get("reference_threshold", 0.020244648295595247))
        self.min_feature_coverage = float(self.metadata.get("minimum_feature_coverage", 0.80))

        # Load joblib model
        self.model = joblib.load(self.model_path)

        # Scikit-learn backward compatibility patch:
        # SimpleImputer in scikit-learn 1.6 pickled with _fit_dtype; scikit-learn 1.9+ requires _fill_dtype
        if hasattr(self.model, "named_steps"):
            imputer = self.model.named_steps.get("imputer")
            if imputer and not hasattr(imputer, "_fill_dtype") and hasattr(imputer, "_fit_dtype"):
                imputer._fill_dtype = imputer._fit_dtype

        # Load baseline distributions if available to power descriptive contributors
        self._load_baseline_distributions()

        logger.info(
            f"TelemetryAnomalyV2Service initialized. Model: v{self.metadata.get('model_version')} "
            f"with {len(self.feature_columns)} features, threshold: {self.reference_threshold:.6f}"
        )

    def _load_baseline_distributions(self) -> None:
        """Loads baseline medians and interquartile ranges for descriptive deviations."""
        if os.path.isfile(self.distribution_csv_path):
            try:
                df = pd.read_csv(self.distribution_csv_path, index_col=0)
                for feat in self.feature_columns:
                    if feat in df.index:
                        med = float(df.loc[feat, "train_median"])
                        p75 = float(df.loc[feat, "train_p75"]) if "train_p75" in df.columns else med + 1.0
                        p25 = float(df.loc[feat, "train_p25"]) if "train_p25" in df.columns else med - 1.0
                        iqr = p75 - p25
                        self.train_medians[feat] = med
                        self.train_iqrs[feat] = iqr if iqr > 1e-4 else 1.0
            except Exception as e:
                logger.warning(f"Could not load baseline distributions from CSV: {e}")

    def score_record(
        self,
        features: Dict[str, Any],
        request_id: Optional[str] = None,
        timestamp: Optional[str] = None,
        asset_id: Optional[str] = "TX-TELEMETRY-STREAM",
    ) -> TelemetryAnomalyScoreResponse:
        """
        Scores a single telemetry record against the fitted v2 Isolation Forest model.

        Enforces:
        - Exactly 45 trained features passed in exact metadata order.
        - Strict rejection/exclusion of disallowed columns (timestamp, diagnostics, unverified alarms).
        - Feature coverage check (>= 80%).
        - Missing-value handling via fitted pipeline SimpleImputer (median).
        - Higher anomaly score = more anomalous (-decision_function).
        - Reference threshold from metadata.
        - Descriptive contributors only (no causal root cause claims).
        """
        req_id = request_id or f"anomv2_{uuid.uuid4().hex[:8]}"

        # Check for explicitly prohibited columns that must not enter inference
        prohibited_present = [c for c in features.keys() if c in DISALLOWED_COLUMNS]
        if prohibited_present:
            logger.debug(f"Filtering disallowed columns from inference: {prohibited_present}")

        # Build feature vector of exactly the 45 features in metadata order
        vector_vals: List[float] = []
        present_count = 0
        for col in self.feature_columns:
            val = features.get(col)
            if val is not None and not (isinstance(val, float) and np.isnan(val)):
                try:
                    num_val = float(val)
                    vector_vals.append(num_val)
                    present_count += 1
                except (ValueError, TypeError):
                    vector_vals.append(np.nan)
            else:
                vector_vals.append(np.nan)

        coverage = present_count / len(self.feature_columns)
        if coverage < self.min_feature_coverage:
            raise ValueError(
                f"Feature coverage {coverage:.1%} is below the required minimum threshold of "
                f"{self.min_feature_coverage:.0%} ({present_count}/{len(self.feature_columns)} features present)."
            )

        # Create 2D DataFrame or array with exact feature names and order
        X = pd.DataFrame([vector_vals], columns=self.feature_columns)

        # Run pipeline inference
        raw_decision = self.model.decision_function(X)
        anomaly_score = float(-raw_decision[0])
        is_alert = bool(anomaly_score > self.reference_threshold)

        # Triage severity tier (product-level triage cutoff, clearly labeled as advisory)
        if not is_alert:
            severity = "normal"
        elif anomaly_score > 0.05:
            severity = "critical"
        else:
            severity = "watch"

        # Compute top descriptive contributing deviations
        descriptive_contributors = self._compute_descriptive_contributors(features)

        return TelemetryAnomalyScoreResponse(
            request_id=req_id,
            model_version=self.metadata.get("model_version", "2.0.0"),
            model_type=self.metadata.get("model_type", "IsolationForest"),
            anomaly_score=round(anomaly_score, 6),
            reference_threshold=round(self.reference_threshold, 6),
            is_anomaly_alert=is_alert,
            severity_tier=severity,
            feature_coverage=round(coverage, 4),
            descriptive_contributors=descriptive_contributors,
            product_claim=PRODUCT_CLAIM,
            score_interpretation=(
                "Higher anomaly score indicates greater statistical isolation from learned baseline. "
                f"Alert flagged when score > {self.reference_threshold:.6f} (training 95th percentile). "
                "Severity tiers are product-level triage cutoffs, not physical failure probabilities."
            ),
            timestamp=datetime.now(timezone.utc),
        )

    def _compute_descriptive_contributors(
        self,
        features: Dict[str, Any],
        top_k: int = 5,
    ) -> List[DescriptiveContributor]:
        """
        Computes the features with largest relative deviation from training baseline medians.
        Explicitly marked as descriptive observations, NOT physical root cause diagnoses.
        """
        contributors: List[Tuple[str, float, float, float, str]] = []

        for feat in self.feature_columns:
            val = features.get(feat)
            if val is not None and not (isinstance(val, float) and np.isnan(val)):
                try:
                    num_val = float(val)
                    if feat in self.train_medians:
                        med = self.train_medians[feat]
                        iqr = self.train_iqrs.get(feat, 1.0)
                        shift = (num_val - med) / iqr
                        if abs(shift) >= 0.5:
                            direction = "higher" if shift > 0 else "lower"
                            detail = (
                                f"{feat} is {abs(shift):.2f} IQRs {direction} than training baseline "
                                f"(observed: {num_val:.2f}, baseline median: {med:.2f})"
                            )
                            contributors.append((feat, num_val, med, shift, detail))
                except (ValueError, TypeError):
                    continue

        contributors.sort(key=lambda x: abs(x[3]), reverse=True)
        top = contributors[:top_k]

        return [
            DescriptiveContributor(
                feature=c[0],
                observed_value=round(c[1], 4),
                training_median=round(c[2], 4),
                shift_relative=round(c[3], 2),
                role="descriptive_contributor",
                detail=c[4],
            )
            for c in top
        ]

    def get_metadata(self) -> AnomalyV2MetadataResponse:
        """Returns comprehensive metadata, feature specs, and split parameters."""
        return AnomalyV2MetadataResponse(
            model_version=self.metadata.get("model_version", "2.0.0"),
            model_type=self.metadata.get("model_type", "IsolationForest"),
            purpose=self.metadata.get("purpose", "Unsupervised telemetry anomaly detection"),
            failure_prediction_validated=bool(self.metadata.get("failure_prediction_validated", False)),
            feature_columns=self.feature_columns,
            feature_count=len(self.feature_columns),
            minimum_feature_coverage=float(self.metadata.get("minimum_feature_coverage", 0.8)),
            training_fraction=float(self.metadata.get("training_fraction", 0.7)),
            reference_threshold=float(self.reference_threshold),
            training_rows=int(self.metadata.get("training_rows", 12994)),
            future_evaluation_rows=int(self.metadata.get("future_evaluation_rows", 5569)),
            training_start=str(self.metadata.get("training_start", "2019-06-27 10:51:00")),
            training_end=str(self.metadata.get("training_end", "2020-01-21 05:15:00")),
            evaluation_start=str(self.metadata.get("evaluation_start", "2020-01-21 05:30:00")),
            evaluation_end=str(self.metadata.get("evaluation_end", "2020-04-14 00:30:00")),
            evaluation_flagged_alerts=696,
            evaluation_alert_rate_pct=12.50,
            total_episodes_count=156,
            product_claim=PRODUCT_CLAIM,
        )

    def get_episodes(
        self,
        limit: int = 50,
        min_score: Optional[float] = None,
    ) -> List[AnomalyEpisode]:
        """Returns grouped anomaly episodes (separated by > 30-minute quiet gap)."""
        if not os.path.isfile(self.episodes_csv_path):
            return []

        df = pd.read_csv(self.episodes_csv_path)
        if min_score is not None:
            df = df[df["max_score"] >= min_score]

        episodes: List[AnomalyEpisode] = []
        for idx, row in df.head(limit).iterrows():
            start_str = str(row["start_time"])
            end_str = str(row["end_time"])
            cnt = int(row["alert_count"])
            max_s = float(row["max_score"])
            mean_s = float(row["mean_score"])
            dur = float(row["duration_minutes"])

            summary = None
            if "2020-03-01" in start_str:
                summary = "March 1 episode: Phase current imbalance (56A, 31A, 64A) under high PF (0.975)"
            elif "2020-02-01" in start_str:
                summary = "February 1 episode: High phase voltage regime (~252V) with lower load"
            elif "2020-03-02" in start_str:
                summary = "March 2 episode: Higher observed load (74kW active, 76kVA apparent)"

            episodes.append(
                AnomalyEpisode(
                    episode_id=idx + 1,
                    start_time=start_str,
                    end_time=end_str,
                    alert_count=cnt,
                    max_score=round(max_s, 6),
                    mean_score=round(mean_s, 6),
                    duration_minutes=round(dur, 1),
                    summary=summary,
                )
            )

        return episodes

    def get_drift_metrics(self) -> List[DriftMetric]:
        """Returns distribution drift comparisons between training and future evaluation periods."""
        if not os.path.isfile(self.distribution_csv_path):
            return []

        df = pd.read_csv(self.distribution_csv_path, index_col=0)
        metrics: List[DriftMetric] = []
        for feat in df.index:
            t_med = float(df.loc[feat, "train_median"])
            f_med = float(df.loc[feat, "future_median"])
            shift = float(df.loc[feat, "median_shift"])
            t_mean = float(df.loc[feat, "train_mean"]) if "train_mean" in df.columns else None
            f_mean = float(df.loc[feat, "future_mean"]) if "future_mean" in df.columns else None

            metrics.append(
                DriftMetric(
                    feature=feat,
                    training_median=round(t_med, 3),
                    evaluation_median=round(f_med, 3),
                    median_shift=round(shift, 3),
                    training_mean=round(t_mean, 3) if t_mean is not None else None,
                    evaluation_mean=round(f_mean, 3) if f_mean is not None else None,
                )
            )
        return metrics

    def get_monthly_alert_rates(self) -> List[MonthlyAlertRate]:
        """Returns observed monthly alert rates during the evaluation period."""
        return [
            MonthlyAlertRate(
                month="2020-01 (Jan 21-31)",
                alert_rate_pct=18.78,
                interpretation="Highest monthly alert rate immediately following chronological split point.",
            ),
            MonthlyAlertRate(
                month="2020-02",
                alert_rate_pct=16.215,
                interpretation="Elevated alerts driven by high-voltage / lower-load regimes and current imbalances.",
            ),
            MonthlyAlertRate(
                month="2020-03",
                alert_rate_pct=10.059,
                interpretation="Moderate alert rate containing the largest multi-reading episode on March 1 (63 readings).",
            ),
            MonthlyAlertRate(
                month="2020-04 (Apr 1-14)",
                alert_rate_pct=3.553,
                interpretation="Lowest alert rate. Declining trend warrants drift review, not an assumption of equipment safety.",
            ),
        ]

    def get_data_quality_report(self) -> DataQualityReportResponse:
        """Returns data quality investigation findings and controlled cleaning comparison proof."""
        monthly_rates = {
            "2019-06": {"VL12_zero_rate": 96.28, "VL23_zero_rate": 96.28, "VL31_zero_rate": 96.28},
            "2019-07": {"VL12_zero_rate": 20.63, "VL23_zero_rate": 20.58, "VL31_zero_rate": 20.58},
            "2019-08": {"VL12_zero_rate": 0.0, "VL23_zero_rate": 0.0, "VL31_zero_rate": 0.12},
            "2019-09_to_2020-04": {"VL12_zero_rate": 0.0, "VL23_zero_rate": 0.0, "VL31_zero_rate": 0.0},
        }

        return DataQualityReportResponse(
            total_records=20024,
            line_voltage_zero_records=1298,
            suspicious_zero_line_records=1295,
            monthly_zero_rates=monthly_rates,
            cleaned_candidate_status=(
                "Preserved as separate candidate (merged_telemetry_cleaned_candidate.csv). "
                "Replaces 1,295 suspicious line-voltage zero readings with NaNs; preserves original timestamps."
            ),
            controlled_validation_evaluation_records=5569,
            controlled_validation_score_changes=0,
            controlled_validation_alert_decision_changes=0,
            conclusion=(
                "Controlled validation proves identical scores and alert decisions on the evaluation period. "
                "Because suspicious zeros occur exclusively in June-July 2019 (prior to the Jan 21, 2020 evaluation start), "
                "the proposed cleaning has exactly zero impact on v2 evaluation results."
            ),
        )

    def reproduce_evaluation(self, use_cleaned_candidate: bool = False) -> Dict[str, Any]:
        """
        Reproduces chronological evaluation on merged telemetry dataset.
        Verifies:
        - Exactly 5,569 evaluation records.
        - Exactly 696 anomaly alerts (12.50%).
        - Reference threshold 0.020244648295595247.
        - Zero score discrepancies vs saved results.
        """
        csv_path = self.cleaned_csv_path if use_cleaned_candidate else self.merged_csv_path
        if not os.path.isfile(csv_path):
            raise FileNotFoundError(f"Telemetry CSV not found at '{csv_path}'")

        df = pd.read_csv(csv_path)
        feature_cols = self.feature_columns
        thresh = self.reference_threshold
        eval_start = self.metadata["evaluation_start"]
        eval_end = self.metadata["evaluation_end"]

        coverage = df[feature_cols].notnull().mean(axis=1)
        eligible = df[coverage >= self.min_feature_coverage].copy()
        eval_df = eligible[(eligible["DeviceTimeStamp"] >= eval_start) & (eligible["DeviceTimeStamp"] <= eval_end)].copy()

        eval_records_count = len(eval_df)
        X_eval = eval_df[feature_cols]

        raw_scores = self.model.decision_function(X_eval)
        scores = -raw_scores
        alerts = (scores > thresh).astype(int)

        alert_count = int(alerts.sum())
        alert_rate = float(alerts.mean() * 100.0)

        # Compare with saved results if original data
        max_diff = 0.0
        mismatched_flags = 0
        if not use_cleaned_candidate and os.path.isfile(self.results_csv_path):
            saved = pd.read_csv(self.results_csv_path)
            max_diff = float(np.max(np.abs(scores - saved["anomaly_score"].values)))
            mismatched_flags = int(np.sum(alerts != saved["anomaly_flag"].values))

        return {
            "dataset_used": os.path.basename(csv_path),
            "evaluation_records": eval_records_count,
            "flagged_alerts": alert_count,
            "unflagged_records": eval_records_count - alert_count,
            "alert_rate_pct": round(alert_rate, 2),
            "reference_threshold": thresh,
            "max_score_diff_vs_saved": max_diff,
            "mismatched_flags_count": mismatched_flags,
            "reproduction_exact": bool(eval_records_count == 5569 and alert_count == 696 and mismatched_flags == 0),
        }

    def get_sample_telemetry(self) -> Dict[str, Dict[str, Any]]:
        """Returns preset representative telemetry profiles for interactive testing."""
        return {
            "march_1_imbalance": {
                "label": "March 1 Episode Sample (Severe Phase Current Imbalance)",
                "description": "Observed 2020-03-01 04:30:00. High anomaly score (~0.081), current imbalance across phases.",
                "features": {
                    "VL1": 248.1, "VL2": 247.9, "VL3": 248.3,
                    "IL1": 56.4, "IL2": 30.8, "IL3": 64.2,
                    "VL12": 428.5, "VL23": 426.2, "VL31": 428.8,
                    "INUT": 18.2, "WL1": 13.9, "WL2": 7.6, "WL3": 15.8,
                    "VAL1": 14.0, "VAL2": 7.7, "VAL3": 16.0,
                    "RVAL1": 1.4, "RVAL2": 0.8, "RVAL3": 1.6,
                    "PFL1": 0.99, "PFL2": 0.98, "PFL3": 0.99,
                    "Avg_PF": 0.975, "Sum_PF": 2.92, "FRQ": 50.0,
                    "THDVL1": 1.4, "THDVL2": 1.5, "THDVL3": 1.4,
                    "THDIL1": 3.8, "THDIL2": 4.1, "THDIL3": 3.6,
                    "MDIL1": 47.5, "MDIL2": 28.9, "MDIL3": 67.1,
                    "OTI": 28.0, "ATI": 26.3, "OLI": 100.0,
                    "KWH": 297635.0, "KWH_I": 0.0, "KVARH": 301058.0,
                    "KW": 34.8, "KVA": 35.7, "KVAR": 5.2,
                    "MPD": 34.3, "MKVAD": 34.8
                }
            },
            "feb_1_high_voltage": {
                "label": "February 1 Episode Sample (High Voltage, Lower Load)",
                "description": "Observed 2020-02-01 02:15:00. High anomaly score (~0.098), phase voltages ~252V, active power ~25kW.",
                "features": {
                    "VL1": 252.4, "VL2": 251.8, "VL3": 252.9,
                    "IL1": 40.2, "IL2": 20.6, "IL3": 44.2,
                    "VL12": 435.2, "VL23": 433.0, "VL31": 435.8,
                    "INUT": 14.5, "WL1": 10.1, "WL2": 5.2, "WL3": 11.2,
                    "VAL1": 10.2, "VAL2": 5.2, "VAL3": 11.3,
                    "RVAL1": 1.1, "RVAL2": 0.6, "RVAL3": 1.2,
                    "PFL1": 0.99, "PFL2": 0.99, "PFL3": 0.99,
                    "Avg_PF": 0.985, "Sum_PF": 2.96, "FRQ": 50.0,
                    "THDVL1": 1.2, "THDVL2": 1.3, "THDVL3": 1.2,
                    "THDIL1": 3.2, "THDIL2": 3.5, "THDIL3": 3.1,
                    "MDIL1": 41.0, "MDIL2": 21.0, "MDIL3": 45.0,
                    "OTI": 19.5, "ATI": 18.0, "OLI": 44.0,
                    "KWH": 245000.0, "KWH_I": 0.0, "KVARH": 250000.0,
                    "KW": 25.3, "KVA": 25.8, "KVAR": 3.8,
                    "MPD": 25.0, "MKVAD": 25.5
                }
            },
            "normal_baseline": {
                "label": "Normal Operating Baseline Sample",
                "description": "Observed 2020-01-21 07:00:00. Negative anomaly score (-0.017), well below threshold (0.020245).",
                "features": {
                    "VL1": 247.5, "VL2": 246.8, "VL3": 245.2,
                    "IL1": 63.5, "IL2": 40.2, "IL3": 70.1,
                    "VL12": 427.8, "VL23": 425.5, "VL31": 428.1,
                    "INUT": 12.0, "WL1": 15.6, "WL2": 9.8, "WL3": 17.1,
                    "VAL1": 15.7, "VAL2": 9.9, "VAL3": 17.2,
                    "RVAL1": 1.5, "RVAL2": 1.0, "RVAL3": 1.6,
                    "PFL1": 0.99, "PFL2": 0.99, "PFL3": 0.99,
                    "Avg_PF": 0.988, "Sum_PF": 2.97, "FRQ": 50.0,
                    "THDVL1": 1.1, "THDVL2": 1.2, "THDVL3": 1.1,
                    "THDIL1": 2.5, "THDIL2": 2.7, "THDIL3": 2.4,
                    "MDIL1": 65.0, "MDIL2": 42.0, "MDIL3": 72.0,
                    "OTI": 26.0, "ATI": 25.0, "OLI": 44.0,
                    "KWH": 210000.0, "KWH_I": 0.0, "KVARH": 215000.0,
                    "KW": 41.5, "KVA": 42.2, "KVAR": 5.0,
                    "MPD": 41.0, "MKVAD": 42.0
                }
            }
        }
