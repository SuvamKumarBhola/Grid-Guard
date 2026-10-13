from datetime import datetime, timezone
from typing import List, Optional, Tuple
from app.config import get_settings
from app.domain.models import (
    TelemetryIngestPayload,
    TelemetryObservation,
    DataQualityReport,
    Alert,
)
from app.repositories.base import (
    BaseTelemetryRepository,
    BaseAssetRepository,
    BaseAlertRepository,
)


class TelemetryService:
    def __init__(
        self,
        telemetry_repo: BaseTelemetryRepository,
        asset_repo: BaseAssetRepository,
        alert_repo: Optional[BaseAlertRepository] = None,
    ):
        self.telemetry_repo = telemetry_repo
        self.asset_repo = asset_repo
        self.alert_repo = alert_repo
        self.settings = get_settings()

    def evaluate_quality(
        self, payload: TelemetryIngestPayload, duplicate_detected: bool = False
    ) -> DataQualityReport:
        now = datetime.now(timezone.utc)
        observed_time = payload.observed_at
        if observed_time.tzinfo is None:
            observed_time = observed_time.replace(tzinfo=timezone.utc)

        freshness_seconds = max(0.0, (now - observed_time).total_seconds())

        range_violations: List[str] = []
        obs = payload.observations

        # Physical range checks
        if obs.load_factor < 0.0 or obs.load_factor > 2.5:
            range_violations.append(f"load_factor {obs.load_factor} out of expected range [0.0, 2.5]")
        if obs.winding_temperature_c < -20.0 or obs.winding_temperature_c > 160.0:
            range_violations.append(
                f"winding_temperature_c {obs.winding_temperature_c} out of expected range [-20.0, 160.0]"
            )
        if obs.ambient_temperature_c < -40.0 or obs.ambient_temperature_c > 55.0:
            range_violations.append(
                f"ambient_temperature_c {obs.ambient_temperature_c} out of expected range [-40.0, 55.0]"
            )
        if obs.power_factor < 0.3 or obs.power_factor > 1.0:
            range_violations.append(f"power_factor {obs.power_factor} out of expected range [0.3, 1.0]")
        if obs.voltage_variance < 0.0 or obs.voltage_variance > 0.5:
            range_violations.append(f"voltage_variance {obs.voltage_variance} out of expected range [0.0, 0.5]")

        missing_features: List[str] = []
        if obs.oil_temperature_c is None:
            missing_features.append("oil_temperature_c")
        if obs.vibration_g is None:
            missing_features.append("vibration_g")

        # Determine overall quality status
        sensor_health = payload.sensor_health
        is_stale = freshness_seconds > self.settings.feature_freshness_max_seconds
        is_sensor_unhealthy = sensor_health < self.settings.min_sensor_health

        if sensor_health < 0.40 or len(range_violations) >= 3 or freshness_seconds > (self.settings.feature_freshness_max_seconds * 3):
            status = "critical"
        elif is_sensor_unhealthy or is_stale or len(range_violations) > 0:
            status = "degraded"
        else:
            status = "healthy"

        return DataQualityReport(
            freshness_seconds=round(freshness_seconds, 2),
            missing_features=missing_features,
            range_violations=range_violations,
            duplicate_detected=duplicate_detected,
            sensor_health=round(sensor_health, 3),
            status=status,
        )

    def ingest(self, payload: TelemetryIngestPayload) -> Tuple[bool, DataQualityReport]:
        """Ingests a telemetry record, checks quality, deduplicates, and stores."""
        quality = self.evaluate_quality(payload)
        saved = self.telemetry_repo.save(payload, quality)

        if not saved:
            # Duplicate event detected
            duplicate_quality = self.evaluate_quality(payload, duplicate_detected=True)
            return False, duplicate_quality

        # Trigger alert if sensor health breached threshold
        if (
            payload.sensor_health < self.settings.min_sensor_health
            and self.alert_repo is not None
        ):
            alert = Alert(
                alert_id=f"alt-sensor-{payload.asset_id}-{int(datetime.now(timezone.utc).timestamp())}",
                asset_id=payload.asset_id,
                severity="watch" if payload.sensor_health >= 0.5 else "critical",
                alert_type="sensor_failure",
                title=f"Degraded Sensor Health on {payload.asset_id}",
                description=(
                    f"Sensor health dropped to {payload.sensor_health:.2f} (threshold: "
                    f"{self.settings.min_sensor_health}). Data quality marked degraded."
                ),
            )
            self.alert_repo.save(alert)

        return True, quality

    def get_latest_quality(self, asset_id: str) -> Optional[DataQualityReport]:
        return self.telemetry_repo.get_latest_quality(asset_id)
