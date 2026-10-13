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
    DispatchWorkOrder,
    FieldCrew,
)
from app.repositories.base import (
    BaseAssetRepository,
    BaseFeederRepository,
    BaseTelemetryRepository,
    BaseAlertRepository,
    BaseAuditRepository,
    BasePredictionRepository,
    BaseSimulationRepository,
    BaseWorkOrderRepository,
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


class InMemoryWorkOrderRepository(BaseWorkOrderRepository):
    def __init__(self):
        self._work_orders: Dict[str, DispatchWorkOrder] = {}
        self._crews: Dict[str, FieldCrew] = {}
        self._lock = threading.RLock()
        self._seed_initial_data()

    def _seed_initial_data(self) -> None:
        initial_crews = [
            FieldCrew(
                crew_id="CREW-03-THERMAL",
                name="North Substation Crew 3",
                specialty="Thermal & Radiator Forced Cooling",
                lead_technician="Dave Miller (Master Tech)",
                status="dispatched",
                eta_minutes=24,
                radio_channel="CH-9 DIRECT",
                home_substation="Feeder F-03 Yard",
                contact_number="+1-800-GRID-CR3",
            ),
            FieldCrew(
                crew_id="CREW-01-RELAY",
                name="Metro Emergency Relay Unit 1",
                specialty="Relay Coordination & Protection Coordination",
                lead_technician="Kenji Tanaka (Relay Eng)",
                status="available",
                eta_minutes=18,
                radio_channel="CH-4 DISPATCH",
                home_substation="Central Metro Depot",
                contact_number="+1-800-GRID-CR1",
            ),
            FieldCrew(
                crew_id="CREW-02-HV",
                name="West Substation Maintenance Crew 2",
                specialty="High-Voltage Transformer & Bushings",
                lead_technician="Roberto Alvarez (Senior Electrician)",
                status="dispatched",
                eta_minutes=35,
                radio_channel="CH-12 OPS",
                home_substation="West Grid Terminal",
                contact_number="+1-800-GRID-CR2",
            ),
            FieldCrew(
                crew_id="CREW-04-DGA",
                name="Mobile Diagnostic & DGA Sampling Unit 4",
                specialty="Dissolved Gas & Oil Quality Analysis",
                lead_technician="Dr. Maya Zhao (Insulation Specialist)",
                status="available",
                eta_minutes=45,
                radio_channel="CH-7 DIAG",
                home_substation="Regional Diagnostic Lab",
                contact_number="+1-800-GRID-CR4",
            ),
            FieldCrew(
                crew_id="CREW-05-SCADA",
                name="RTU & Telecommunications Fast Response",
                specialty="Antenna, RTU & DNP3 Telemetry Protocol",
                lead_technician="Sarah Jenkins (Telemetry Tech)",
                status="available",
                eta_minutes=30,
                radio_channel="CH-2 SCADA",
                home_substation="Substation Comms Tower",
                contact_number="+1-800-GRID-CR5",
            ),
        ]
        for c in initial_crews:
            self._crews[c.crew_id] = c

        initial_orders = [
            DispatchWorkOrder(
                work_order_id="WO-2024-9941",
                asset_id="TX-04",
                crew_id="CREW-03-THERMAL",
                crew_name="North Substation Crew 3",
                lead_technician="Dave Miller (Master Tech)",
                priority="P1-EMERGENCY",
                status="en_route",
                failure_mode="Auxiliary Cooling Fan Bank #2 Complete Trip (Thermal 94.2°C)",
                sop_reference="SOP-TX-10 (Transformer Hotspot & Forced Cooling Mitigation)",
                notes="Relay and substation cooling technicians dispatched to site. Emergency thermal fan bank #2 replacement and RTU telemetry validation in progress.",
                eta_minutes=24,
                radio_channel="CH-9 DIRECT",
                dispatched_by="S. Vance, P.E. (Lead Dispatcher)",
            ),
            DispatchWorkOrder(
                work_order_id="WO-2024-9952",
                asset_id="TX-Pine-02",
                crew_id="CREW-02-HV",
                crew_name="West Substation Maintenance Crew 2",
                lead_technician="Roberto Alvarez (Senior Electrician)",
                priority="P2-URGENT",
                status="en_route",
                failure_mode="Standby tie feeder preparation & radiator inspect",
                sop_reference="SOP-TX-04 (Feeder Tie Synchronization)",
                notes="Inspect tie feeder bus alignment and radiator valve positions prior to load transfer.",
                eta_minutes=48,
                radio_channel="CH-12 OPS",
                dispatched_by="K. Tanaka (Relay Eng)",
            ),
        ]
        for wo in initial_orders:
            self._work_orders[wo.work_order_id] = wo

    def save(self, work_order: DispatchWorkOrder) -> None:
        with self._lock:
            self._work_orders[work_order.work_order_id] = work_order
            if work_order.crew_id in self._crews:
                self._crews[work_order.crew_id].status = "dispatched"

    def get(self, work_order_id: str) -> Optional[DispatchWorkOrder]:
        with self._lock:
            return self._work_orders.get(work_order_id)

    def list(
        self,
        asset_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[DispatchWorkOrder]:
        with self._lock:
            results = list(self._work_orders.values())
            if asset_id:
                results = [wo for wo in results if wo.asset_id == asset_id or (asset_id in ["TX-04", "TX-Oak-04"] and wo.asset_id in ["TX-04", "TX-Oak-04"])]
            if status:
                results = [wo for wo in results if wo.status == status]
            return sorted(results, key=lambda w: w.created_at, reverse=True)[:limit]

    def update(self, work_order: DispatchWorkOrder) -> None:
        with self._lock:
            self._work_orders[work_order.work_order_id] = work_order
            if work_order.status in ["resolved", "cancelled"]:
                if work_order.crew_id in self._crews:
                    self._crews[work_order.crew_id].status = "available"

    def list_crews(self) -> List[FieldCrew]:
        with self._lock:
            return list(self._crews.values())

    def get_crew(self, crew_id: str) -> Optional[FieldCrew]:
        with self._lock:
            return self._crews.get(crew_id)
