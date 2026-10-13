from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.domain.models import (
    Alert,
    AuditEvent,
    ErrorResponse,
    FieldCrew,
    DispatchWorkOrderRequest,
    DispatchWorkOrder,
    WorkOrderStatusUpdateRequest,
)
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


@router.get("/crews", response_model=List[FieldCrew], summary="List available field technician crews")
def list_field_crews(
    user: UserContext = Depends(get_current_user),
) -> List[FieldCrew]:
    from app.main import app_state
    return app_state.work_order_repo.list_crews()


@router.post("/dispatch", response_model=DispatchWorkOrder, status_code=status.HTTP_201_CREATED, summary="Authorize and dispatch field crew work order")
def dispatch_field_crew(
    payload: DispatchWorkOrderRequest,
    user: UserContext = Depends(require_role(["operator", "administrator", "reliability_manager"])),
) -> DispatchWorkOrder:
    from app.main import app_state

    crew = app_state.work_order_repo.get_crew(payload.crew_id)
    crew_name = crew.name if crew else payload.crew_id
    lead_tech = payload.lead_technician or (crew.lead_technician if crew else "On-Call Tech")
    eta = payload.eta_minutes or (crew.eta_minutes if crew else 30)
    radio_channel = crew.radio_channel if crew else "CH-9 DIRECT"

    ticket_number = f"WO-2026-{uuid.uuid4().hex[:4].upper()}"

    work_order = DispatchWorkOrder(
        work_order_id=ticket_number,
        asset_id=payload.asset_id,
        crew_id=payload.crew_id,
        crew_name=crew_name,
        lead_technician=lead_tech,
        priority=payload.priority,
        status="dispatched",
        failure_mode=payload.failure_mode,
        sop_reference=payload.sop_reference,
        notes=payload.notes or "",
        eta_minutes=eta,
        radio_channel=radio_channel,
        dispatched_by=f"{user.user_id} ({user.role})",
    )

    app_state.work_order_repo.save(work_order)

    # Record immutable audit event
    app_state.audit_repo.save(
        AuditEvent(
            audit_id=f"aud-disp-{ticket_number}",
            event_type="work_order_dispatch",
            user_id=user.user_id,
            user_role=user.role,  # type: ignore
            asset_id=payload.asset_id,
            payload_summary={
                "work_order_id": ticket_number,
                "crew_id": payload.crew_id,
                "crew_name": crew_name,
                "priority": payload.priority,
                "eta_minutes": eta,
                "sop_reference": payload.sop_reference,
            },
        )
    )

    return work_order


@router.get("/work-orders", response_model=List[DispatchWorkOrder], summary="List active and historical field dispatch work orders")
def list_work_orders(
    asset_id: Optional[str] = Query(None, description="Filter by asset identifier"),
    status: Optional[str] = Query(None, description="Filter by work order status"),
    limit: int = Query(50, ge=1, le=100),
    user: UserContext = Depends(get_current_user),
) -> List[DispatchWorkOrder]:
    from app.main import app_state
    return app_state.work_order_repo.list(asset_id=asset_id, status=status, limit=limit)


@router.get("/work-orders/{work_order_id}", response_model=DispatchWorkOrder, summary="Get single field dispatch work order by ticket number")
def get_work_order(
    work_order_id: str,
    user: UserContext = Depends(get_current_user),
) -> DispatchWorkOrder:
    from app.main import app_state
    wo = app_state.work_order_repo.get(work_order_id)
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_order_id}' not found",
        )
    return wo


@router.patch("/work-orders/{work_order_id}/status", response_model=DispatchWorkOrder, summary="Update field crew work order status (e.g. en_route, on_site, resolved)")
def update_work_order_status(
    work_order_id: str,
    payload: WorkOrderStatusUpdateRequest,
    user: UserContext = Depends(require_role(["operator", "administrator", "reliability_manager"])),
) -> DispatchWorkOrder:
    from app.main import app_state
    wo = app_state.work_order_repo.get(work_order_id)
    if not wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_order_id}' not found",
        )

    wo.status = payload.status
    wo.updated_at = datetime.now(timezone.utc)
    if payload.notes:
        wo.notes = f"{wo.notes} | [{datetime.now(timezone.utc).strftime('%H:%M:%S UTC')}] {payload.notes}".strip(" | ")

    app_state.work_order_repo.update(wo)

    # Record immutable audit event
    app_state.audit_repo.save(
        AuditEvent(
            audit_id=f"aud-status-{work_order_id}-{payload.status}",
            event_type="work_order_status_update",
            user_id=user.user_id,
            user_role=user.role,  # type: ignore
            asset_id=wo.asset_id,
            payload_summary={
                "work_order_id": work_order_id,
                "new_status": payload.status,
                "notes": payload.notes,
            },
        )
    )

    return wo
