from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.domain.models import Alert, AuditEvent, ErrorResponse
from app.security.auth import get_current_user, UserContext, require_role
from app.monitoring.metrics import metrics

router = APIRouter(tags=["Operations & Observability"])


@router.get("/health", summary="Basic service and process health status")
def health_check() -> Dict[str, Any]:
    from app.main import app_state
    return {
        "status": "healthy",
        "service": "gridguard-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "storage": "connected",
        "model_provider_mode": app_state.model_provider.get_model_metadata().get("runtime_mode", "unknown"),
    }


@router.get("/ready", summary="Readiness probe for Kubernetes & traffic routing")
def readiness_check() -> Dict[str, Any]:
    from app.main import app_state
    is_ready = app_state.model_provider.health_check()
    if not is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model provider not ready",
        )
    return {
        "status": "ready",
        "model_loaded": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/metrics", summary="Export operational, ML, and cost metrics")
def get_metrics() -> Dict[str, Any]:
    return metrics.get_summary()


@router.get("/model", summary="Get active champion model metadata and promotion status")
def get_model_metadata(
    user: UserContext = Depends(get_current_user),
) -> Dict[str, Any]:
    from app.main import app_state
    return app_state.model_provider.get_model_metadata()


@router.get("/alerts", response_model=List[Alert], summary="List operational alerts")
def list_alerts(
    unacknowledged_only: bool = Query(False),
    user: UserContext = Depends(get_current_user),
) -> List[Alert]:
    from app.main import app_state
    return app_state.alert_repo.list(unacknowledged_only=unacknowledged_only)


@router.post("/alerts/{alert_id}/acknowledge", response_model=Alert, summary="Acknowledge an operational alert")
def acknowledge_alert(
    alert_id: str,
    user: UserContext = Depends(require_role(["operator", "administrator", "reliability_manager"])),
) -> Alert:
    from app.main import app_state
    alert = app_state.alert_repo.get(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found",
        )
    alert.acknowledged = True
    alert.acknowledged_by = user.user_id
    alert.acknowledged_at = datetime.now(timezone.utc)
    app_state.alert_repo.update(alert)

    # Record audit event
    app_state.audit_repo.save(
        AuditEvent(
            audit_id=f"aud-ack-{alert_id}",
            event_type="alert_acknowledgement",
            user_id=user.user_id,
            user_role=user.role,  # type: ignore
            asset_id=alert.asset_id,
            payload_summary={"alert_id": alert_id, "action": "acknowledged"},
        )
    )
    return alert


@router.get("/audit", response_model=List[AuditEvent], summary="List immutable audit trail events")
def list_audit_events(
    limit: int = Query(50, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    user: UserContext = Depends(require_role(["auditor", "administrator", "operator", "reliability_manager"])),
) -> List[AuditEvent]:
    from app.main import app_state
    return app_state.audit_repo.list(limit=limit, event_type=event_type)
