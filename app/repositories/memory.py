import threading
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
from app.repositories.base import (
    BaseAssetRepository,
    BaseFeederRepository,
    BaseTelemetryRepository,
    BaseAlertRepository,
    BaseAuditRepository,
    BasePredictionRepository,
    BaseSimulationRepository,
)


class InMemoryAssetRepository(BaseAssetRepository):
    def __init__(self):
        self._assets: Dict[str, Asset] = {}
        self._lock = threading.RLock()

    def get(self, asset_id: str) -> Optional[Asset]:
        with self._lock:
            return self._assets.get(asset_id)

    def list(self, feeder_id: Optional[str] = None, criticality_class: Optional[str] = None) -> List[Asset]:
        with self._lock:
            result = list(self._assets.values())
            if feeder_id:
                result = [a for a in result if a.feeder_id == feeder_id]
            if criticality_class:
                result = [a for a in result if a.criticality_class == criticality_class]
            return result

    def save(self, asset: Asset) -> None:
        with self._lock:
            self._assets[asset.asset_id] = asset


class InMemoryFeederRepository(BaseFeederRepository):
    def __init__(self):
        self._feeders: Dict[str, Feeder] = {}
        self._lock = threading.RLock()

    def get(self, feeder_id: str) -> Optional[Feeder]:
        with self._lock:
            return self._feeders.get(feeder_id)

    def list(self) -> List[Feeder]:
        with self._lock:
            return list(self._feeders.values())

    def save(self, feeder: Feeder) -> None:
        with self._lock:
            self._feeders[feeder.feeder_id] = feeder


class InMemoryTelemetryRepository(BaseTelemetryRepository):
    def __init__(self):
        self._history: Dict[str, List[TelemetryIngestPayload]] = {}
        self._quality: Dict[str, DataQualityReport] = {}
        self._seen_hashes: set = set()
        self._lock = threading.RLock()

    def save(self, payload: TelemetryIngestPayload, quality: DataQualityReport) -> bool:
        with self._lock:
            # Deduplication key based on asset_id + observed_at
            event_key = f"{payload.asset_id}:{payload.observed_at.isoformat()}"
            if event_key in self._seen_hashes:
                return False

            self._seen_hashes.add(event_key)
            if payload.asset_id not in self._history:
                self._history[payload.asset_id] = []
            self._history[payload.asset_id].append(payload)
            self._quality[payload.asset_id] = quality
            return True

    def get_latest(self, asset_id: str) -> Optional[TelemetryIngestPayload]:
        with self._lock:
            records = self._history.get(asset_id, [])
            if not records:
                return None
            return sorted(records, key=lambda x: x.observed_at, reverse=True)[0]

    def get_latest_quality(self, asset_id: str) -> Optional[DataQualityReport]:
        with self._lock:
            return self._quality.get(asset_id)

    def get_history(self, asset_id: str, limit: int = 50) -> List[TelemetryIngestPayload]:
        with self._lock:
            records = self._history.get(asset_id, [])
            sorted_records = sorted(records, key=lambda x: x.observed_at, reverse=True)
            return sorted_records[:limit]


class InMemoryAlertRepository(BaseAlertRepository):
    def __init__(self):
        self._alerts: Dict[str, Alert] = {}
        self._lock = threading.RLock()

    def save(self, alert: Alert) -> None:
        with self._lock:
            self._alerts[alert.alert_id] = alert

    def get(self, alert_id: str) -> Optional[Alert]:
        with self._lock:
            return self._alerts.get(alert_id)

    def list(self, unacknowledged_only: bool = False) -> List[Alert]:
        with self._lock:
            alerts = list(self._alerts.values())
            if unacknowledged_only:
                alerts = [a for a in alerts if not a.acknowledged]
            return sorted(alerts, key=lambda a: a.created_at, reverse=True)

    def update(self, alert: Alert) -> None:
        with self._lock:
            self._alerts[alert.alert_id] = alert


class InMemoryAuditRepository(BaseAuditRepository):
    def __init__(self):
        self._events: List[AuditEvent] = []
        self._lock = threading.RLock()

    def save(self, event: AuditEvent) -> None:
        with self._lock:
            self._events.append(event)

    def list(self, limit: int = 100, event_type: Optional[str] = None) -> List[AuditEvent]:
        with self._lock:
            result = self._events
            if event_type:
                result = [e for e in result if e.event_type == event_type]
            return sorted(result, key=lambda e: e.timestamp, reverse=True)[:limit]


class InMemoryPredictionRepository(BasePredictionRepository):
    def __init__(self):
        self._predictions: Dict[str, List[RiskPrediction]] = {}
        self._all_predictions: List[RiskPrediction] = []
        self._lock = threading.RLock()

    def save(self, prediction: RiskPrediction) -> None:
        with self._lock:
            if prediction.asset_id not in self._predictions:
                self._predictions[prediction.asset_id] = []
            self._predictions[prediction.asset_id].append(prediction)
            self._all_predictions.append(prediction)

    def get_latest(self, asset_id: str) -> Optional[RiskPrediction]:
        with self._lock:
            history = self._predictions.get(asset_id, [])
            if not history:
                return None
            return sorted(history, key=lambda p: p.created_at, reverse=True)[0]

    def list(self, limit: int = 100) -> List[RiskPrediction]:
        with self._lock:
            return sorted(self._all_predictions, key=lambda p: p.created_at, reverse=True)[:limit]


class InMemorySimulationRepository(BaseSimulationRepository):
    def __init__(self):
        self._simulations: Dict[str, SimulationResult] = {}
        self._lock = threading.RLock()

    def save(self, simulation: SimulationResult) -> None:
        with self._lock:
            self._simulations[simulation.simulation_id] = simulation

    def get(self, simulation_id: str) -> Optional[SimulationResult]:
        with self._lock:
            return self._simulations.get(simulation_id)

    def list(self, limit: int = 50) -> List[SimulationResult]:
        with self._lock:
            return sorted(
                list(self._simulations.values()),
                key=lambda s: s.request_id,
                reverse=True,
            )[:limit]
