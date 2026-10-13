from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from datetime import datetime
from app.domain.models import (
    Asset,
    Feeder,
    TelemetryIngestPayload,
    DataQualityReport,
    Alert,
    AuditEvent,
    RiskPrediction,
    SimulationResult,
)


class BaseAssetRepository(ABC):
    @abstractmethod
    def get(self, asset_id: str) -> Optional[Asset]:
        pass

    @abstractmethod
    def list(self, feeder_id: Optional[str] = None, criticality_class: Optional[str] = None) -> List[Asset]:
        pass

    @abstractmethod
    def save(self, asset: Asset) -> None:
        pass


class BaseFeederRepository(ABC):
    @abstractmethod
    def get(self, feeder_id: str) -> Optional[Feeder]:
        pass

    @abstractmethod
    def list(self) -> List[Feeder]:
        pass

    @abstractmethod
    def save(self, feeder: Feeder) -> None:
        pass


class BaseTelemetryRepository(ABC):
    @abstractmethod
    def save(self, payload: TelemetryIngestPayload, quality: DataQualityReport) -> bool:
        """Saves telemetry payload and quality report. Returns False if duplicate."""
        pass

    @abstractmethod
    def get_latest(self, asset_id: str) -> Optional[TelemetryIngestPayload]:
        pass

    @abstractmethod
    def get_latest_quality(self, asset_id: str) -> Optional[DataQualityReport]:
        pass

    @abstractmethod
    def get_history(self, asset_id: str, limit: int = 50) -> List[TelemetryIngestPayload]:
        pass


class BaseAlertRepository(ABC):
    @abstractmethod
    def save(self, alert: Alert) -> None:
        pass

    @abstractmethod
    def get(self, alert_id: str) -> Optional[Alert]:
        pass

    @abstractmethod
    def list(self, unacknowledged_only: bool = False) -> List[Alert]:
        pass

    @abstractmethod
    def update(self, alert: Alert) -> None:
        pass


class BaseAuditRepository(ABC):
    @abstractmethod
    def save(self, event: AuditEvent) -> None:
        pass

    @abstractmethod
    def list(self, limit: int = 100, event_type: Optional[str] = None) -> List[AuditEvent]:
        pass


class BasePredictionRepository(ABC):
    @abstractmethod
    def save(self, prediction: RiskPrediction) -> None:
        pass

    @abstractmethod
    def get_latest(self, asset_id: str) -> Optional[RiskPrediction]:
        pass

    @abstractmethod
    def list(self, limit: int = 100) -> List[RiskPrediction]:
        pass


class BaseSimulationRepository(ABC):
    @abstractmethod
    def save(self, simulation: SimulationResult) -> None:
        pass

    @abstractmethod
    def get(self, simulation_id: str) -> Optional[SimulationResult]:
        pass

    @abstractmethod
    def list(self, limit: int = 50) -> List[SimulationResult]:
        pass
