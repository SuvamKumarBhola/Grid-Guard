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

