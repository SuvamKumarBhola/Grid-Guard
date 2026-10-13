import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.domain.models import TelemetryIngestPayload, DataQualityReport, ErrorResponse
from app.services.telemetry_service import TelemetryService
from app.security.auth import get_current_user, UserContext

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


def get_telemetry_service() -> TelemetryService:
    from app.main import app_state
    return app_state.telemetry_service


@router.post(
    "/ingest",
    response_model=DataQualityReport,
    responses={400: {"model": ErrorResponse}},
    summary="Ingest raw telemetry observation",
)
def ingest_telemetry(
    payload: TelemetryIngestPayload,
    user: UserContext = Depends(get_current_user),
    service: TelemetryService = Depends(get_telemetry_service),
):
    """
    Ingests sensor telemetry, performs deduplication, range checks,
    freshness tracking, and computes real-time data quality.
    """
    success, quality = service.ingest(payload)
    return quality
