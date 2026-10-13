import time
import logging
from typing import Optional, Tuple
from app.config import get_settings
from app.domain.models import (
    Asset,
    FeatureVector,
    DataQualityReport,
    RiskPrediction,
    Alert,
)
from app.inference.base import ModelProvider
from app.inference.fallback import SafetyFallbackProvider
from app.repositories.base import BaseAlertRepository

logger = logging.getLogger("gridguard.safety_router")


class SafetyRouter:
    """Policy engine routing requests between primary model and safety fallback."""

    def __init__(
        self,
        primary_provider: ModelProvider,
        fallback_provider: Optional[SafetyFallbackProvider] = None,
        alert_repo: Optional[BaseAlertRepository] = None,
    ):
        self.primary_provider = primary_provider
        self.fallback_provider = fallback_provider or SafetyFallbackProvider()
        self.alert_repo = alert_repo
        self.settings = get_settings()

    def route_and_predict(
        self,
        features: FeatureVector,
        asset: Asset,
        data_quality: DataQualityReport,
        request_id: Optional[str] = None,
        force_fallback: bool = False,
    ) -> Tuple[RiskPrediction, str]:
        """
        Evaluates safety gates.
        Returns (RiskPrediction, route_decision_reason).
        """
        # Manual or test injection override
        if force_fallback:
            return self._execute_fallback(
                features, asset, data_quality, request_id, "Failure injection forced fallback"
            )

        # Gate 1: Sensor health threshold (< 0.75)
        if data_quality.sensor_health < self.settings.min_sensor_health:
            reason = (
                f"Sensor health ({data_quality.sensor_health:.2f}) is below "
                f"safe policy threshold ({self.settings.min_sensor_health})"
            )
            return self._execute_fallback(features, asset, data_quality, request_id, reason)

        # Gate 2: Feature freshness threshold (> 300s)
        if data_quality.freshness_seconds > self.settings.feature_freshness_max_seconds:
            reason = (
                f"Telemetry freshness ({data_quality.freshness_seconds:.1f}s) exceeded "
                f"staleness limit ({self.settings.feature_freshness_max_seconds}s)"
            )
            return self._execute_fallback(features, asset, data_quality, request_id, reason)

        # Gate 3: Primary model health check
        if not self.primary_provider.health_check():
            reason = "Primary model provider failed health check"
            return self._execute_fallback(features, asset, data_quality, request_id, reason)

        # Attempt primary prediction with latency monitoring
        start_time = time.perf_counter()
        try:
            prediction = self.primary_provider.predict(
                features=features,
                asset=asset,
                data_quality=data_quality,
                request_id=request_id,
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            # Gate 4: Latency SLA breach (> 900ms)
            if elapsed_ms > self.settings.max_inference_latency_ms:
                reason = (
                    f"Inference latency ({elapsed_ms:.1f}ms) breached "
                    f"SLA threshold ({self.settings.max_inference_latency_ms}ms)"
                )
                logger.warning(f"SLA breached for request {request_id}: {reason}")
                # Log alert for SLO breach
                self._record_slo_alert(asset.asset_id, elapsed_ms)
                # Fallback on severe breach if required
                return self._execute_fallback(features, asset, data_quality, request_id, reason)

            # Gate 5: Confidence threshold
            if prediction.confidence < self.settings.min_confidence_threshold:
                reason = (
                    f"Primary prediction confidence ({prediction.confidence:.2f}) is below "
                    f"minimum threshold ({self.settings.min_confidence_threshold})"
                )
                return self._execute_fallback(features, asset, data_quality, request_id, reason)

            return prediction, "primary-route"

        except Exception as exc:
            reason = f"Primary model exception during inference: {str(exc)}"
            logger.error(f"Routing to fallback due to exception: {exc}")
            return self._execute_fallback(features, asset, data_quality, request_id, reason)

    def _execute_fallback(
        self,
        features: FeatureVector,
        asset: Asset,
        data_quality: DataQualityReport,
        request_id: Optional[str],
        reason: str,
    ) -> Tuple[RiskPrediction, str]:
        logger.warning(f"SAFETY ROUTER ACTIVATED: {reason} for asset {asset.asset_id}")
        fallback_engine = SafetyFallbackProvider(reason=reason)
        prediction = fallback_engine.predict(
            features=features,
            asset=asset,
            data_quality=data_quality,
            request_id=request_id,
        )
        return prediction, reason

    def _record_slo_alert(self, asset_id: str, latency_ms: float) -> None:
        if self.alert_repo:
            alert = Alert(
                alert_id=f"alt-slo-{int(time.time())}",
                asset_id=asset_id,
                severity="watch",
                alert_type="api_slo_breach",
                title="Inference Latency SLA Breach",
                description=f"Inference took {latency_ms:.1f}ms exceeding threshold {self.settings.max_inference_latency_ms}ms.",
            )
            self.alert_repo.save(alert)
