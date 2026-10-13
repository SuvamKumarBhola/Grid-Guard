import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from app.domain.models import AnomalyDetectRequest, AnomalyResult, ErrorResponse
from app.security.auth import get_current_user, UserContext

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])


@router.post(
    "/detect",
    response_model=AnomalyResult,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    summary="Detect multivariate anomalies in telemetry patterns",
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
