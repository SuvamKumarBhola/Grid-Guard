from datetime import datetime, timezone
from typing import Optional, Tuple
import numpy as np
from app.domain.models import (
    Asset,
    TelemetryObservation,
    TelemetryIngestPayload,
    FeatureVector,
    DataQualityReport,
)
from app.repositories.base import BaseTelemetryRepository, BaseAssetRepository
from app.services.telemetry_service import TelemetryService


class FeaturePreparationService:
    """Prepares enriched ML feature vectors from asset context and telemetry streams."""

    def __init__(
        self,
        telemetry_repo: BaseTelemetryRepository,
        asset_repo: BaseAssetRepository,
        telemetry_service: TelemetryService,
    ):
        self.telemetry_repo = telemetry_repo
        self.asset_repo = asset_repo
        self.telemetry_service = telemetry_service

    def build_features(
        self,
        asset_id: str,
        override_obs: Optional[TelemetryObservation] = None,
        sensor_health: Optional[float] = None,
        observed_at: Optional[datetime] = None,
    ) -> Tuple[FeatureVector, DataQualityReport]:
        asset = self.asset_repo.get(asset_id)
        if not asset:
            raise ValueError(f"Asset '{asset_id}' not found in asset registry")

        now = observed_at or datetime.now(timezone.utc)
        latest_telemetry: Optional[TelemetryIngestPayload] = None

        if override_obs:
            obs = override_obs
            s_health = sensor_health if sensor_health is not None else 0.95
            latest_telemetry = TelemetryIngestPayload(
                asset_id=asset_id,
                observations=obs,
                sensor_health=s_health,
                observed_at=now,
            )
            # Ingest to update repo
            _, quality = self.telemetry_service.ingest(latest_telemetry)
        else:
            latest_telemetry = self.telemetry_repo.get_latest(asset_id)
            if not latest_telemetry:
                raise ValueError(f"No telemetry observations available for asset '{asset_id}'")
            obs = latest_telemetry.observations
            quality = (
                self.telemetry_repo.get_latest_quality(asset_id)
                or self.telemetry_service.evaluate_quality(latest_telemetry)
            )

        # History aggregation
        history = self.telemetry_repo.get_history(asset_id, limit=20)
        load_factors = [h.observations.load_factor for h in history] or [obs.load_factor]
        load_p95_1h = float(np.percentile(load_factors, 95)) if len(load_factors) > 1 else obs.load_factor
        load_p95_24h = load_p95_1h * 0.95

        # Temperature gradient
        temp_rise_rate = 0.0
        if len(history) >= 2:
            dt_hours = max(0.01, (history[0].observed_at - history[1].observed_at).total_seconds() / 3600.0)
            temp_rise_rate = round(
                (history[0].observations.winding_temperature_c - history[1].observations.winding_temperature_c)
                / dt_hours,
                2,
            )

        thermal_headroom = round(110.0 - obs.winding_temperature_c, 2)

        features = FeatureVector(
            asset_id=asset_id,
            timestamp=now,
            load_factor_current=obs.load_factor,
            load_p95_1h=round(load_p95_1h, 3),
            load_p95_24h=round(load_p95_24h, 3),
            winding_temp_c=obs.winding_temperature_c,
            temp_rise_rate_c_per_hour=temp_rise_rate,
            thermal_headroom_c=thermal_headroom,
            voltage_variance=obs.voltage_variance,
            current_variance=obs.current_variance,
            power_factor=obs.power_factor,
            asset_age_years=asset.age_years,
            maintenance_overdue_days=asset.maintenance_overdue_days,
            weather_severity_index=0.25 if obs.ambient_temperature_c < 32 else 0.65,
            historical_outage_count=1 if asset.age_years > 10 else 0,
        )

        return features, quality
