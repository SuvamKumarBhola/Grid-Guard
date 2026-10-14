import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from app.domain.models import (
    AnomalyDetectRequest,
    AnomalyResult,
    ErrorResponse,
    TelemetryAnomalyScoreRequest,
    TelemetryAnomalyScoreResponse,
    AnomalyEpisode,
    AnomalyV2MetadataResponse,
    DataQualityReportResponse,
    TelemetryStreamResponse,
    TelemetryInjectionRequest,
    TelemetryInjectionResponse,
    AuditEvent,
)
from app.security.auth import get_current_user, UserContext

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])


@router.post(
    "/detect",
    response_model=AnomalyResult,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    summary="Detect multivariate anomalies in telemetry patterns (Legacy Asset Observation)",
)
def detect_anomalies(
    payload: AnomalyDetectRequest,
    x_request_id: Optional[str] = Header(None),
    user: UserContext = Depends(get_current_user),
) -> AnomalyResult:
    from app.main import app_state

    req_id = x_request_id or f"anom_{uuid.uuid4().hex[:8]}"

    # Verify asset exists
    asset = app_state.asset_repo.get(payload.asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{payload.asset_id}' not found in registry",
        )

    try:
        result = app_state.anomaly_service.detect(
            asset_id=payload.asset_id,
            observations=payload.observations,
            request_id=req_id,
        )
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


# =========================================================================
# Anomaly Detection v2 — Unsupervised Isolation Forest Telemetry Pipeline
# =========================================================================

@router.post(
    "/v2/score",
    response_model=TelemetryAnomalyScoreResponse,
    responses={400: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    summary="Score 45-feature transformer telemetry with fitted Isolation Forest v2 model",
)
def score_telemetry_v2(
    payload: TelemetryAnomalyScoreRequest,
    x_request_id: Optional[str] = Header(None),
    user: UserContext = Depends(get_current_user),
) -> TelemetryAnomalyScoreResponse:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently unavailable or model artifacts are uninitialized.",
        )

    req_id = x_request_id or payload.request_id or f"anomv2_{uuid.uuid4().hex[:8]}"

    try:
        return app_state.anomaly_v2_service.score_record(
            features=payload.features,
            request_id=req_id,
            timestamp=payload.timestamp,
            asset_id=payload.asset_id,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


@router.get(
    "/v2/metadata",
    response_model=AnomalyV2MetadataResponse,
    summary="Get Anomaly Detector v2 model specifications, feature columns, and threshold metadata",
)
def get_anomaly_v2_metadata(
    user: UserContext = Depends(get_current_user),
) -> AnomalyV2MetadataResponse:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    return app_state.anomaly_v2_service.get_metadata()


@router.get(
    "/v2/episodes",
    response_model=List[AnomalyEpisode],
    summary="Get chronological anomaly episodes grouped by 30-minute quiet gap rule",
)
def get_anomaly_v2_episodes(
    limit: int = Query(50, ge=1, le=200),
    min_score: Optional[float] = Query(None),
    user: UserContext = Depends(get_current_user),
) -> List[AnomalyEpisode]:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    return app_state.anomaly_v2_service.get_episodes(limit=limit, min_score=min_score)


@router.get(
    "/v2/drift",
    summary="Get feature distribution shift and monthly alert rate drift comparisons",
)
def get_anomaly_v2_drift(
    user: UserContext = Depends(get_current_user),
) -> Dict[str, Any]:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    return {
        "distribution_metrics": app_state.anomaly_v2_service.get_drift_metrics(),
        "monthly_alert_rates": app_state.anomaly_v2_service.get_monthly_alert_rates(),
        "notes": (
            "Feature distributions shifted noticeably between training and evaluation: "
            "VL1-3 phase voltages shifted +7.8 to +9.5V higher, VL12-31 line voltages shifted +16.9 to +19.3V higher, "
            "IL1-3 phase currents decreased -11.1 to -19.0A, active power decreased -10.2kW. "
            "Declining monthly alert rates warrant engineering review rather than assuming equipment safety."
        ),
    }


@router.get(
    "/v2/data-quality",
    response_model=DataQualityReportResponse,
    summary="Get line-voltage zero check investigation and cleaning validation report",
)
def get_anomaly_v2_data_quality(
    user: UserContext = Depends(get_current_user),
) -> DataQualityReportResponse:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    return app_state.anomaly_v2_service.get_data_quality_report()


@router.get(
    "/v2/reproduction",
    summary="Reproduce chronological evaluation and verify 5,569 rows and 696 alerts with zero discrepancy",
)
def get_anomaly_v2_reproduction(
    use_cleaned_candidate: bool = Query(False),
    user: UserContext = Depends(get_current_user),
) -> Dict[str, Any]:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    return app_state.anomaly_v2_service.reproduce_evaluation(use_cleaned_candidate=use_cleaned_candidate)


@router.get(
    "/v2/sample",
    summary="Get preset representative telemetry cases for live inspection",
)
def get_anomaly_v2_sample_telemetry(
    user: UserContext = Depends(get_current_user),
) -> Dict[str, Any]:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    return app_state.anomaly_v2_service.get_sample_telemetry()


@router.get(
    "/v2/stream-records",
    response_model=TelemetryStreamResponse,
    summary="Get sequential historical telemetry frames for live data injection and model streaming",
)
def get_anomaly_v2_stream_records(
    scenario: str = Query("march_1_imbalance", description="Dataset scenario profile"),
    limit: int = Query(15, ge=1, le=50, description="Max frame count to return"),
    user: UserContext = Depends(get_current_user),
) -> TelemetryStreamResponse:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    return app_state.anomaly_v2_service.get_stream_records(scenario=scenario, limit=limit)


@router.post(
    "/v2/inject",
    response_model=TelemetryInjectionResponse,
    summary="Inject live telemetry scenario into a transformer, evaluate with Isolation Forest v2, and record in audit trail",
)
def inject_telemetry_v2(
    payload: TelemetryInjectionRequest,
    user: UserContext = Depends(get_current_user),
) -> TelemetryInjectionResponse:
    from app.main import app_state

    if not app_state.anomaly_v2_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Anomaly Detection v2 service is currently uninitialized.",
        )

    # If features not provided directly, pull from preset samples
    features = payload.features
    if not features:
        samples = app_state.anomaly_v2_service.get_sample_telemetry()
        if payload.scenario_name in samples:
            features = samples[payload.scenario_name]["features"]
        else:
            # Fallback to march 1 sample
            features = samples["march_1_imbalance"]["features"]

    # Score with Isolation Forest v2
    score_res = app_state.anomaly_v2_service.score_record(
        features=features,
        asset_id=payload.asset_id,
    )

    event_id = f"inj-{uuid.uuid4().hex[:8]}"

    # Extract electrical/thermal readings for updated asset telemetry
    v_avg = float(features.get("VL1", 245.0) + features.get("VL2", 245.0) + features.get("VL3", 245.0)) / 3.0
    i_avg = float(features.get("IL1", 40.0) + features.get("IL2", 40.0) + features.get("IL3", 40.0)) / 3.0
    oti_temp = float(features.get("OTI", 75.0))
    kw = float(features.get("KW", 38.0))

    updated_telemetry = {
        "temperatureC": oti_temp,
        "activeLoadMva": round(kw / 1000.0 * 100.0, 1) if kw < 100 else round(kw, 1),
        "voltageAvg": round(v_avg, 1),
        "currentAvg": round(i_avg, 1),
        "powerKw": round(kw, 1),
        "anomalyScore": score_res.anomaly_score,
        "isAlert": score_res.is_anomaly_alert,
        "severityTier": score_res.severity_tier,
    }

    # Record in immutable audit trail
    app_state.audit_repo.save(
        AuditEvent(
            audit_id=f"aud-{event_id}",
            event_type="telemetry_injection",
            user_id=user.user_id,
            user_role=user.role,  # type: ignore
            asset_id=payload.asset_id,
            payload_summary={
                "injection_id": event_id,
                "scenario": payload.scenario_name,
                "anomaly_score": score_res.anomaly_score,
                "is_alert": score_res.is_anomaly_alert,
                "severity_tier": score_res.severity_tier,
                "temperature_c": oti_temp,
                "notes": payload.notes or "Interactive operator telemetry injection",
            },
        )
    )

    return TelemetryInjectionResponse(
        event_id=event_id,
        asset_id=payload.asset_id,
        scenario_name=payload.scenario_name,
        anomaly_score=score_res.anomaly_score,
        reference_threshold=score_res.reference_threshold,
        is_alert=score_res.is_anomaly_alert,
        severity_tier=score_res.severity_tier,
        updated_telemetry=updated_telemetry,
        descriptive_contributors=score_res.descriptive_contributors,
    )

