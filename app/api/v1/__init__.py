from fastapi import APIRouter
from app.api.v1.routes_telemetry import router as telemetry_router
from app.api.v1.routes_assets import router as assets_router
from app.api.v1.routes_risk import router as risk_router
from app.api.v1.routes_anomalies import router as anomalies_router
from app.api.v1.routes_simulations import router as simulations_router
from app.api.v1.routes_operations import router as operations_router

api_v1_router = APIRouter()
api_v1_router.include_router(telemetry_router)
api_v1_router.include_router(assets_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(anomalies_router)
api_v1_router.include_router(simulations_router)
api_v1_router.include_router(operations_router)

__all__ = ["api_v1_router"]
