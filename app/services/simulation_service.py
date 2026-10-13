import uuid
from typing import Optional
from app.domain.models import (
    SimulationRequest,
    SimulationResult,
    SimulationResultDetail,
    AuditEvent,
)
from app.repositories.base import (
    BaseAssetRepository,
    BaseFeederRepository,
    BaseSimulationRepository,
    BaseAuditRepository,
    BasePredictionRepository,
)


class SimulationService:
    """Advisory counterfactual load-redistribution simulator."""

    def __init__(
        self,
        asset_repo: BaseAssetRepository,
        feeder_repo: BaseFeederRepository,
        simulation_repo: BaseSimulationRepository,
        prediction_repo: BasePredictionRepository,
        audit_repo: Optional[BaseAuditRepository] = None,
    ):
        self.asset_repo = asset_repo
        self.feeder_repo = feeder_repo
        self.simulation_repo = simulation_repo
        self.prediction_repo = prediction_repo
        self.audit_repo = audit_repo

    def simulate_load_redistribution(
        self,
        request: SimulationRequest,
        user_id: str = "operator-console",
    ) -> SimulationResult:
        sim_id = f"sim_{uuid.uuid4().hex[:6]}"
        req_id = f"req_{uuid.uuid4().hex[:6]}"

        source_asset = self.asset_repo.get(request.source_asset_id)
        target_feeder = self.feeder_repo.get(request.target_feeder_id)

        # Topology validation
        if not source_asset:
            return self._build_rejected_result(
                req_id,
                sim_id,
                request,
                f"Source asset '{request.source_asset_id}' not found in registry",
                "rejected_constraint",
            )
        if not target_feeder:
            return self._build_rejected_result(
                req_id,
                sim_id,
                request,
                f"Target feeder '{request.target_feeder_id}' not found in registry",
                "rejected_constraint",
            )

        # Baseline source risk
        latest_pred = self.prediction_repo.get_latest(source_asset.asset_id)
        source_risk_before = latest_pred.risk_score if latest_pred else 0.85

        # Calculate electrical transfer impact
        source_capacity_mva = source_asset.rated_capacity_kva / 1000.0
        # Approximate current load on asset
        source_load_mva = source_capacity_mva * 0.90
        transferred_load_mva = source_load_mva * (request.redistribution_percent / 100.0)

        # Check target feeder capacity
        target_new_load_mva = target_feeder.current_load_mva + transferred_load_mva
        target_headroom_mva = target_feeder.nominal_capacity_mva - target_new_load_mva
        target_utilization = target_new_load_mva / target_feeder.nominal_capacity_mva

        # Constraints check
        constraints = [
            "Human operator approval is strictly required before physical action",
            f"Do not exceed target feeder {target_feeder.feeder_id} continuous rating ({target_feeder.nominal_capacity_mva} MVA)",
        ]

        if target_utilization > 0.95:
            # Overload scenario: reject
            constraints.append(
                f"REJECTED: Transfer of {transferred_load_mva:.2f} MVA would drive target feeder to "
                f"{target_utilization*100:.1f}% capacity (headroom: {target_headroom_mva:.2f} MVA)"
            )
            detail = SimulationResultDetail(
                status="rejected_overload",
                source_failure_risk_before=source_risk_before,
                source_failure_risk_after=source_risk_before,
                target_overload_risk=round(min(1.0, 0.40 + (target_utilization - 0.95) * 4.0), 2),
                customers_protected_estimate=0,
                estimated_energy_loss_kwh=0.0,
                confidence=0.92,
                constraints=constraints,
                requires_human_approval=True,
            )
        else:
            # Feasible scenario: calculates risk relief
            relief_ratio = request.redistribution_percent / 100.0
            source_risk_after = round(max(0.15, source_risk_before * (1.0 - (relief_ratio * 0.85))), 2)
            target_overload_risk = round(max(0.05, (target_utilization - 0.50) * 0.5), 2)
            protected_customers = int(source_asset.connected_customers * (request.redistribution_percent / 100.0))
            # I^2 R transfer loss estimate (approx 0.03 kWh per MVA-hour transferred)
            loss_kwh = round(transferred_load_mva * request.duration_hours * 4.8, 1)

            detail = SimulationResultDetail(
                status="advisable_with_review",
                source_failure_risk_before=source_risk_before,
                source_failure_risk_after=source_risk_after,
                target_overload_risk=target_overload_risk,
                customers_protected_estimate=protected_customers,
                estimated_energy_loss_kwh=loss_kwh,
                confidence=0.88,
                constraints=constraints,
                requires_human_approval=True,
            )

        sim_result = SimulationResult(
            request_id=req_id,
            simulation_id=sim_id,
            scenario=request.model_dump(),
            result=detail,
        )

        # Store simulation
        self.simulation_repo.save(sim_result)

        # Audit event
        if self.audit_repo:
            self.audit_repo.save(
                AuditEvent(
                    audit_id=f"aud-sim-{sim_id}",
                    event_type="simulation",
                    user_id=user_id,
                    user_role="operator",
                    request_id=req_id,
                    asset_id=request.source_asset_id,
                    payload_summary={
                        "simulation_id": sim_id,
                        "status": detail.status,
                        "percent": request.redistribution_percent,
                        "duration_hours": request.duration_hours,
                        "risk_before": detail.source_failure_risk_before,
                        "risk_after": detail.source_failure_risk_after,
                    },
                )
            )

        return sim_result

    def _build_rejected_result(
        self,
        req_id: str,
        sim_id: str,
        request: SimulationRequest,
        reason: str,
        status: str,
    ) -> SimulationResult:
        detail = SimulationResultDetail(
            status="rejected_constraint",  # type: ignore
            source_failure_risk_before=0.0,
            source_failure_risk_after=0.0,
            target_overload_risk=0.0,
            customers_protected_estimate=0,
            estimated_energy_loss_kwh=0.0,
            confidence=0.0,
            constraints=[f"Constraint violation: {reason}"],
            requires_human_approval=True,
        )
        return SimulationResult(
            request_id=req_id,
            simulation_id=sim_id,
            scenario=request.model_dump(),
            result=detail,
        )
