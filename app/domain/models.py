from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Any
from pydantic import BaseModel, Field, field_validator


# -------------------------------------------------------------------------
# Asset and Feeder Domains
# -------------------------------------------------------------------------

class AssetLocation(BaseModel):
    substation: str
    lat: float = Field(ge=-90.0, le=90.0)
    lng: float = Field(ge=-180.0, le=180.0)


class Asset(BaseModel):
    asset_id: str = Field(..., description="Unique asset identifier (e.g. TX-MUM-1042)")
    asset_type: Literal["transformer", "feeder", "substation"] = "transformer"
    feeder_id: str = Field(..., description="Parent feeder ID (e.g. FDR-MUM-22)")
    location: AssetLocation
    rated_capacity_kva: float = Field(..., gt=0.0)
    age_years: float = Field(..., ge=0.0)
    criticality_class: Literal["tier_1", "tier_2", "tier_3"] = "tier_2"
    connected_customers: int = Field(..., ge=0)
    last_maintenance_date: str
    maintenance_overdue_days: int = Field(default=0, ge=0)


class Feeder(BaseModel):
    feeder_id: str
    feeder_name: str
    substation_id: str
    nominal_capacity_mva: float = Field(..., gt=0.0)
    current_load_mva: float = Field(default=0.0, ge=0.0)
    customer_count: int = Field(..., ge=0)
    criticality_tier: Literal["tier_1", "tier_2", "tier_3"] = "tier_2"


# -------------------------------------------------------------------------
# Telemetry and Data Quality
# -------------------------------------------------------------------------

class TelemetryObservation(BaseModel):
    load_factor: float = Field(..., ge=0.0, le=3.0, description="Ratio of load to rated capacity")
    winding_temperature_c: float = Field(..., ge=-40.0, le=200.0)
    ambient_temperature_c: float = Field(..., ge=-50.0, le=60.0)
    voltage_variance: float = Field(..., ge=0.0, le=1.0)
    current_variance: float = Field(..., ge=0.0, le=1.0)
    power_factor: float = Field(..., ge=0.0, le=1.0)
    oil_temperature_c: Optional[float] = Field(default=None, ge=-40.0, le=160.0)
    vibration_g: Optional[float] = Field(default=None, ge=0.0, le=20.0)


class TelemetryIngestPayload(BaseModel):
    asset_id: str
    observations: TelemetryObservation
    sensor_health: float = Field(..., ge=0.0, le=1.0)
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("observed_at", mode="before")
    @classmethod
    def parse_datetime(cls, v: Any) -> datetime:
        if isinstance(v, str):
            dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return dt
        return v


class DataQualityReport(BaseModel):
    freshness_seconds: float = Field(..., ge=0.0)
    missing_features: List[str] = Field(default_factory=list)
    range_violations: List[str] = Field(default_factory=list)
    duplicate_detected: bool = False
    sensor_health: float = Field(..., ge=0.0, le=1.0)
    status: Literal["healthy", "degraded", "critical"] = "healthy"


# -------------------------------------------------------------------------
# Feature Vector
# -------------------------------------------------------------------------

class FeatureVector(BaseModel):
    asset_id: str
    timestamp: datetime
    load_factor_current: float
    load_p95_1h: float
    load_p95_24h: float
    winding_temp_c: float
    temp_rise_rate_c_per_hour: float
    thermal_headroom_c: float
    voltage_variance: float
    current_variance: float
    power_factor: float
    asset_age_years: float
    maintenance_overdue_days: int
    weather_severity_index: float
    historical_outage_count: int


# -------------------------------------------------------------------------
# Prediction and Explanations
# -------------------------------------------------------------------------

class FailureWindow(BaseModel):
    low: int = Field(..., ge=0)
    high: int = Field(..., ge=0)


class ContributingFactor(BaseModel):
    feature: str
    direction: Literal["up", "down"]
    impact: float = Field(..., ge=0.0, le=1.0)


class RiskPrediction(BaseModel):
    request_id: str
    asset_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    severity: Literal["normal", "watch", "critical"]
    failure_window_hours: FailureWindow
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_version: str
    runtime_mode: Literal["stub", "artifact", "fallback"]
    route: Literal["champion-model", "stub-model", "safety-fallback"]
    contributing_factors: List[ContributingFactor] = Field(default_factory=list)
    recommended_action: str
    data_quality: DataQualityReport
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------------------
# Anomaly Detection
# -------------------------------------------------------------------------

class AnomalyEvidence(BaseModel):
    metric: str
    value: float
    threshold: float
    z_score: Optional[float] = None
    detail: str


class AnomalyDetectRequest(BaseModel):
    asset_id: str
    observations: Optional[TelemetryObservation] = None


class AnomalyResult(BaseModel):
    request_id: str
    asset_id: str
    is_anomaly: bool
    anomaly_score: float = Field(..., ge=0.0, le=1.0)
    anomaly_type: Optional[str] = None
    severity: Literal["normal", "watch", "critical"]
    evidence: List[AnomalyEvidence] = Field(default_factory=list)
    detection_method: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------------------
# Counterfactual Load-Redistribution Simulation
# -------------------------------------------------------------------------

class SimulationRequest(BaseModel):
    source_asset_id: str
    target_feeder_id: str
    redistribution_percent: float = Field(..., ge=1.0, le=100.0)
    duration_hours: float = Field(..., gt=0.0, le=72.0)
    scenario_assumptions: Optional[Dict[str, Any]] = None


class SimulationResultDetail(BaseModel):
    status: Literal["advisable_with_review", "rejected_overload", "rejected_constraint"]
    source_failure_risk_before: float = Field(..., ge=0.0, le=1.0)
    source_failure_risk_after: float = Field(..., ge=0.0, le=1.0)
    target_overload_risk: float = Field(..., ge=0.0, le=1.0)
    customers_protected_estimate: int = Field(..., ge=0)
    estimated_energy_loss_kwh: float = Field(..., ge=0.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    constraints: List[str]
    requires_human_approval: bool = True
    advisory_disclaimer: str = (
        "GridGuard advisory simulator only. Human operator approval is mandatory before any physical switching."
    )


class SimulationResult(BaseModel):
    request_id: str
    simulation_id: str
    scenario: Dict[str, Any]
    result: SimulationResultDetail


# -------------------------------------------------------------------------
# Alerts and Audit
# -------------------------------------------------------------------------

class Alert(BaseModel):
    alert_id: str
    asset_id: Optional[str] = None
    feeder_id: Optional[str] = None
    severity: Literal["watch", "critical"]
    alert_type: Literal[
        "critical_asset_risk",
        "sensor_failure",
        "drift_detected",
        "elevated_fallback_rate",
        "api_slo_breach",
    ]
    title: str
    description: str
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditEvent(BaseModel):
    audit_id: str
    event_type: Literal[
        "prediction",
        "simulation",
        "alert_acknowledgement",
        "model_registration",
        "safety_fallback_triggered",
    ]
    user_id: str
    user_role: Literal["operator", "planner", "reliability_manager", "administrator", "auditor", "system"]
    request_id: Optional[str] = None
    asset_id: Optional[str] = None
    input_hash: Optional[str] = None
    model_version: Optional[str] = None
    route: Optional[str] = None
    payload_summary: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# -------------------------------------------------------------------------
# Model Manifest & Artifact Contract
# -------------------------------------------------------------------------

class ModelManifestMetrics(BaseModel):
    critical_recall: float = Field(..., ge=0.0, le=1.0)
    calibration_error: float = Field(..., ge=0.0, le=1.0)
    validation_samples: int = Field(..., ge=0)
    f1_score: Optional[float] = None
    auc_roc: Optional[float] = None


class ModelManifest(BaseModel):
    model_name: str = "gridguard-risk"
    model_version: str
    artifact_format: Literal["onnx", "bin", "pkl", "stub"]
    created_at: str
    framework: Literal["onnxruntime", "xgboost", "scikit-learn", "stub"]
    input_schema_version: str = "features-v1"
    output_schema_version: str = "risk-v1"
    training_dataset_reference: str
    metrics: ModelManifestMetrics
    approval_status: Literal["candidate", "approved", "deprecated"]
    sha256: str


# -------------------------------------------------------------------------
# Structured Error Responses
# -------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool = False
    request_id: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


# -------------------------------------------------------------------------
# Telemetry Anomaly Detection v2 (Unsupervised Isolation Forest)
# -------------------------------------------------------------------------

class DescriptiveContributor(BaseModel):
    feature: str
    observed_value: float
    training_median: float
    shift_relative: float
    role: str = "descriptive_contributor"
    detail: str


class TelemetryAnomalyScoreRequest(BaseModel):
    features: Dict[str, Optional[float]] = Field(
        ...,
        description="Dictionary of numeric telemetry measurements matching the 45 trained features.",
    )
    timestamp: Optional[str] = None
    asset_id: Optional[str] = "TX-TELEMETRY-STREAM"
    request_id: Optional[str] = None


class TelemetryAnomalyScoreResponse(BaseModel):
    request_id: str
    model_version: str = "2.0.0"
    model_type: str = "IsolationForest"
    anomaly_score: float
    reference_threshold: float
    is_anomaly_alert: bool
    severity_tier: Literal["normal", "watch", "critical"]
    feature_coverage: float
    descriptive_contributors: List[DescriptiveContributor] = Field(default_factory=list)
    product_claim: str = (
        "GridGuard uses unsupervised machine learning to flag unusual transformer telemetry "
        "and help operators investigate operating patterns. Its alerts are not yet validated predictions "
        "of transformer failure."
    )
    score_interpretation: str = (
        "Higher anomaly score indicates greater statistical isolation from learned baseline. "
        "Alert triggered when score exceeds reference threshold (training 95th percentile). "
        "Severity tiers are product-level prioritization cutoffs, not calibrated physical failure probabilities."
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnomalyEpisode(BaseModel):
    episode_id: int
    start_time: str
    end_time: str
    alert_count: int
    max_score: float
    mean_score: float
    duration_minutes: float
    summary: Optional[str] = None


class AnomalyV2MetadataResponse(BaseModel):
    model_version: str
    model_type: str
    purpose: str
    failure_prediction_validated: bool
    feature_columns: List[str]
    feature_count: int
    minimum_feature_coverage: float
    training_fraction: float
    reference_threshold: float
    training_rows: int
    future_evaluation_rows: int
    training_start: str
    training_end: str
    evaluation_start: str
    evaluation_end: str
    evaluation_flagged_alerts: int
    evaluation_alert_rate_pct: float
    total_episodes_count: int
    product_claim: str


class DriftMetric(BaseModel):
    feature: str
    training_median: float
    evaluation_median: float
    median_shift: float
    training_mean: Optional[float] = None
    evaluation_mean: Optional[float] = None


class MonthlyAlertRate(BaseModel):
    month: str
    alert_rate_pct: float
    interpretation: str


class DataQualityReportResponse(BaseModel):
    total_records: int
    line_voltage_zero_records: int
    suspicious_zero_line_records: int
    monthly_zero_rates: Dict[str, Dict[str, float]]
    cleaned_candidate_status: str
    controlled_validation_evaluation_records: int
    controlled_validation_score_changes: int
    controlled_validation_alert_decision_changes: int
    conclusion: str

