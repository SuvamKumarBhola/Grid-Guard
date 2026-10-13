from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.domain.models import Asset, Feeder, ErrorResponse
from app.security.auth import get_current_user, UserContext

router = APIRouter(tags=["Assets"])


@router.get(
    "/assets",
    summary="List distribution network assets with operational context",
)
def list_assets(
    feeder_id: Optional[str] = Query(None, description="Filter by feeder identifier"),
    criticality_class: Optional[str] = Query(None, description="Filter by criticality tier (tier_1, tier_2, tier_3)"),
    severity: Optional[str] = Query(None, description="Filter by current risk severity (normal, watch, critical)"),
    limit: int = Query(50, ge=1, le=100),
    user: UserContext = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    from app.main import app_state

    assets = app_state.asset_repo.list(feeder_id=feeder_id, criticality_class=criticality_class)
    results = []

    for a in assets:
        latest_pred = app_state.prediction_repo.get_latest(a.asset_id)
        latest_obs = app_state.telemetry_repo.get_latest(a.asset_id)
        latest_q = app_state.telemetry_repo.get_latest_quality(a.asset_id)

        current_sev = latest_pred.severity if latest_pred else "normal"
        if severity and current_sev != severity:
            continue

        results.append({
            "asset": a,
            "risk_score": latest_pred.risk_score if latest_pred else 0.0,
            "severity": current_sev,
            "model_route": latest_pred.route if latest_pred else "unscored",
            "model_version": latest_pred.model_version if latest_pred else "none",
            "last_observation": latest_obs.observations if latest_obs else None,
            "data_quality_status": latest_q.status if latest_q else "unknown",
            "sensor_health": latest_obs.sensor_health if latest_obs else 1.0,
        })

    # Sort critical risk first, then watch, then normal
    severity_order = {"critical": 0, "watch": 1, "normal": 2}
    results.sort(key=lambda r: (severity_order.get(r["severity"], 3), -r["risk_score"]))

    return results[:limit]


@router.get(
    "/assets/{asset_id}",
    summary="Get single asset detail, latest telemetry, and risk state",
)
def get_asset(
    asset_id: str,
    user: UserContext = Depends(get_current_user),
) -> Dict[str, Any]:
    from app.main import app_state

    asset = app_state.asset_repo.get(asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found in registry",
        )

    latest_pred = app_state.prediction_repo.get_latest(asset_id)
    latest_telemetry = app_state.telemetry_repo.get_latest(asset_id)
    latest_quality = app_state.telemetry_repo.get_latest_quality(asset_id)

    return {
        "asset": asset,
        "latest_prediction": latest_pred,
        "latest_telemetry": latest_telemetry,
        "data_quality": latest_quality,
    }


@router.get(
    "/feeders",
    response_model=List[Feeder],
    summary="List distribution network feeders and load headroom",
)
def list_feeders(
    user: UserContext = Depends(get_current_user),
) -> List[Feeder]:
    from app.main import app_state
    return app_state.feeder_repo.list()
