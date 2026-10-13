import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.domain.models import (
    Asset,
    FeatureVector,
    DataQualityReport,
    RiskPrediction,
    FailureWindow,
    ContributingFactor,
)
from app.inference.base import ModelProvider


class StubModelProvider(ModelProvider):
    """Deterministic development stub provider for local testing and CI."""

    def __init__(self, version: str = "gridguard-risk-stub-dev"):
        self.version = version

    def predict(
        self,
        features: FeatureVector,
        asset: Asset,
        data_quality: DataQualityReport,
        request_id: Optional[str] = None,
    ) -> RiskPrediction:
        req_id = request_id or f"req_{uuid.uuid4().hex[:8]}"

        # Physical heuristic risk score calculation
        # Normalized weights:
        # 1. Thermal stress (winding temperature >= 90C starts penalty)
        temp_factor = max(0.0, min(1.0, (features.winding_temp_c - 60.0) / 55.0))
        # 2. Load stress
        load_factor = max(0.0, min(1.0, (features.load_factor_current - 0.50) / 0.60))
        # 3. Maintenance lateness
        maint_factor = max(0.0, min(1.0, features.maintenance_overdue_days / 60.0))
        # 4. Voltage variance
        volt_factor = max(0.0, min(1.0, features.voltage_variance / 0.15))

        # Combined risk score
        raw_risk = (0.40 * temp_factor) + (0.30 * load_factor) + (0.20 * maint_factor) + (0.10 * volt_factor)
        risk_score = round(max(0.02, min(0.98, raw_risk)), 2)

        # Severity determination
        if risk_score >= 0.70:
            severity = "critical"
            failure_window = FailureWindow(low=4, high=18)
            action = "Dispatch emergency inspection crew and review feeder load transfer"
        elif risk_score >= 0.40:
            severity = "watch"
            failure_window = FailureWindow(low=18, high=72)
            action = "Schedule thermographic scan and monitor winding temperature rise trend"
        else:
            severity = "normal"
            failure_window = FailureWindow(low=72, high=720)
            action = "Continue routine supervisory monitoring"

        # Contributing factors
        contributing_factors: List[ContributingFactor] = []
        if features.winding_temp_c >= 75.0:
            contributing_factors.append(
                ContributingFactor(
                    feature="winding_temperature_c",
                    direction="up",
                    impact=round(0.40 * temp_factor, 2),
                )
            )
        if features.load_factor_current >= 0.75:
            contributing_factors.append(
                ContributingFactor(
                    feature="load_factor",
                    direction="up",
                    impact=round(0.30 * load_factor, 2),
                )
            )
        if features.maintenance_overdue_days > 15:
            contributing_factors.append(
                ContributingFactor(
                    feature="maintenance_overdue_days",
                    direction="up",
                    impact=round(0.20 * maint_factor, 2),
                )
            )
        if features.voltage_variance > 0.04:
            contributing_factors.append(
                ContributingFactor(
                    feature="voltage_variance",
                    direction="up",
                    impact=round(0.10 * volt_factor, 2),
                )
            )

        if not contributing_factors:
            contributing_factors.append(
                ContributingFactor(
                    feature="load_factor",
                    direction="down",
                    impact=0.10,
                )
            )

        # Confidence based on sensor health
        confidence = round(max(0.70, min(0.96, data_quality.sensor_health * 0.95)), 2)

        return RiskPrediction(
            request_id=req_id,
            asset_id=asset.asset_id,
            risk_score=risk_score,
            severity=severity,
            failure_window_hours=failure_window,
            confidence=confidence,
            model_version=self.version,
            runtime_mode="stub",
            route="stub-model",
            contributing_factors=contributing_factors,
            recommended_action=action,
            data_quality=data_quality,
            created_at=datetime.now(timezone.utc),
        )

    def get_model_metadata(self) -> Dict[str, Any]:
        return {
            "model_name": "gridguard-risk-stub",
            "model_version": self.version,
            "runtime_mode": "stub",
            "framework": "stub",
            "approval_status": "approved",
            "metrics": {
                "critical_recall": 0.95,
                "calibration_error": 0.05,
                "validation_samples": 1000,
            },
        }

    def health_check(self) -> bool:
        return True
