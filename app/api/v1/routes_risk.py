import time
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from datetime import datetime, timezone

from app.domain.models import (
    RiskPrediction,
    TelemetryObservation,
    AuditEvent,
    ErrorResponse,
)
from app.security.auth import get_current_user, UserContext, compute_input_hash
from app.monitoring.metrics import metrics

router = APIRouter(tags=["Risk Prediction"])


class AssetRiskRequestPayload(BaseModel):
    observations: Optional[TelemetryObservation] = None
    sensor_health: Optional[float] = None
    observed_at: Optional[datetime] = None
    force_fallback: bool = False


@router.post(
    "/assets/{asset_id}/risk",
    response_model=RiskPrediction,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Compute failure risk prediction with explainability and safety fallback",
)
def compute_asset_risk(
    asset_id: str,
    payload: Optional[AssetRiskRequestPayload] = None,
    x_request_id: Optional[str] = Header(None),
    user: UserContext = Depends(get_current_user),
) -> RiskPrediction:
    from app.main import app_state

    req_id = x_request_id or f"req_{uuid.uuid4().hex[:8]}"
    start_time = time.perf_counter()

    asset = app_state.asset_repo.get(asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found in registry",
        )

    # 1. Prepare features
    obs = payload.observations if payload else None
    s_health = payload.sensor_health if payload else None
    obs_time = payload.observed_at if payload else None
    force_fallback = payload.force_fallback if payload else False

    try:
        features, quality = app_state.feature_service.build_features(
            asset_id=asset_id,
            override_obs=obs,
            sensor_health=s_health,
            observed_at=obs_time,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )

    # 2. Route and predict via Safety Router
    prediction, route_reason = app_state.safety_router.route_and_predict(
        features=features,
        asset=asset,
        data_quality=quality,
        request_id=req_id,
        force_fallback=force_fallback,
    )

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # 3. Store prediction record
    app_state.prediction_repo.save(prediction)

    # 4. Record audit event (immutable compliance requirement)
    input_str = f"{features.model_dump_json()}:{quality.model_dump_json()}"
    input_hash = compute_input_hash(input_str)

    app_state.audit_repo.save(
        AuditEvent(
            audit_id=f"aud-pred-{req_id}",
            event_type="prediction",
            user_id=user.user_id,
            user_role=user.role,  # type: ignore
            request_id=req_id,
            asset_id=asset_id,
            input_hash=input_hash,
            model_version=prediction.model_version,
            route=prediction.route,
            payload_summary={
                "risk_score": prediction.risk_score,
                "severity": prediction.severity,
                "confidence": prediction.confidence,
                "runtime_mode": prediction.runtime_mode,
                "route": prediction.route,
                "route_reason": route_reason,
            },
        )
    )

    # 5. Record operational & ML metrics
    metrics.record_prediction(
        route=prediction.route,
        inference_latency_ms=elapsed_ms,
        freshness_violation=(quality.freshness_seconds > 300.0),
        missing_features=len(quality.missing_features),
        drift_score=0.08 if prediction.route != "safety-fallback" else 0.42,
    )

    return prediction
