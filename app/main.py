import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.logging_config import setup_logging
from app.repositories.memory import (
    InMemoryAssetRepository,
    InMemoryFeederRepository,
    InMemoryTelemetryRepository,
    InMemoryAlertRepository,
    InMemoryAuditRepository,
    InMemoryPredictionRepository,
    InMemorySimulationRepository,
)
from app.services.telemetry_service import TelemetryService
from app.services.feature_service import FeaturePreparationService
from app.services.synthetic_generator import populate_synthetic_grid
from app.inference.resolver import ModelProviderResolver
from app.services.safety_router import SafetyRouter
from app.services.anomaly_service import AnomalyDetectionService
from app.services.simulation_service import SimulationService
from app.monitoring.metrics import metrics
from app.domain.models import ErrorResponse, ErrorDetail
from app.api.v1 import api_v1_router


class AppState:
    def __init__(self):
        self.settings = get_settings()
        self.logger = setup_logging(
            log_level=self.settings.log_level,
            log_format=self.settings.log_format,
        )

        # Repositories
        self.asset_repo = InMemoryAssetRepository()
        self.feeder_repo = InMemoryFeederRepository()
        self.telemetry_repo = InMemoryTelemetryRepository()
        self.alert_repo = InMemoryAlertRepository()
        self.audit_repo = InMemoryAuditRepository()
        self.prediction_repo = InMemoryPredictionRepository()
        self.simulation_repo = InMemorySimulationRepository()

        # Services & Model Integration
        self.telemetry_service = TelemetryService(
            telemetry_repo=self.telemetry_repo,
            asset_repo=self.asset_repo,
            alert_repo=self.alert_repo,
        )
        self.feature_service = FeaturePreparationService(
            telemetry_repo=self.telemetry_repo,
            asset_repo=self.asset_repo,
            telemetry_service=self.telemetry_service,
        )
        self.model_provider = ModelProviderResolver.resolve(self.settings)
        self.safety_router = SafetyRouter(
            primary_provider=self.model_provider,
            alert_repo=self.alert_repo,
        )
        self.anomaly_service = AnomalyDetectionService(
            telemetry_repo=self.telemetry_repo
        )
        self.simulation_service = SimulationService(
            asset_repo=self.asset_repo,
            feeder_repo=self.feeder_repo,
            simulation_repo=self.simulation_repo,
            prediction_repo=self.prediction_repo,
            audit_repo=self.audit_repo,
        )


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Populate synthetic distribution grid (50 transformers, 5 feeders)
    app_state.logger.info("Initializing GridGuard synthetic distribution network...")
    populate_synthetic_grid(
        asset_repo=app_state.asset_repo,
        feeder_repo=app_state.feeder_repo,
        telemetry_service=app_state.telemetry_service,
        seed=42,
    )
    app_state.logger.info(
        f"Distribution network initialized: 5 feeders, 50 transformers loaded."
    )

    # Pre-score initial assets so API & Dashboard have live predictions
    all_assets = app_state.asset_repo.list()
    for asset in all_assets:
        try:
            features, quality = app_state.feature_service.build_features(asset.asset_id)
            pred, _ = app_state.safety_router.route_and_predict(
                features=features,
                asset=asset,
                data_quality=quality,
                request_id=f"init_{asset.asset_id}",
            )
            app_state.prediction_repo.save(pred)
        except Exception as e:
            app_state.logger.error(f"Error pre-scoring asset {asset.asset_id}: {e}")

    app_state.logger.info("GridGuard initial risk baseline established successfully.")
    yield
    app_state.logger.info("GridGuard shutting down cleanly.")


app = FastAPI(
    title="GridGuard API",
    description="Autonomous Reliability Intelligence for Power Distribution Networks",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID, Latency, and Security Headers Middleware
@app.middleware("http")
async def security_and_metrics_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:8]}"
    start_time = time.perf_counter()

    # Pass request_id via request.state
    request.state.request_id = req_id

    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # Inject Security and Tracking Headers
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        metrics.record_request(latency_ms=elapsed_ms, is_error=response.status_code >= 500)
        return response

    except Exception as exc:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        metrics.record_request(latency_ms=elapsed_ms, is_error=True)
        app_state.logger.exception(f"Unhandled exception on request {req_id}: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal error occurred. Please contact system support.",
                    "retryable": True,
                    "request_id": req_id,
                }
            },
        )


# Custom structured error handler for HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:8]}")
    code = "RESOURCE_NOT_FOUND" if exc.status_code == 404 else "CLIENT_ERROR"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": exc.detail,
                "retryable": False,
                "request_id": req_id,
            }
        },
    )


# Include API v1 Routes
app.include_router(api_v1_router, prefix=app_state.settings.api_v1_prefix)

# Mount Frontend directory if present
frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
if os.path.isdir(frontend_dir):
    app.mount("/ui", StaticFiles(directory=frontend_dir, html=True), name="frontend")
