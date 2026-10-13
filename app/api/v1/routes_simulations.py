from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.domain.models import SimulationRequest, SimulationResult, ErrorResponse
from app.security.auth import get_current_user, UserContext

router = APIRouter(prefix="/simulations", tags=["Counterfactual Simulation"])


@router.post(
    "/load-redistribution",
    response_model=SimulationResult,
    responses={400: {"model": ErrorResponse}},
    summary="Simulate advisory counterfactual load redistribution before an outage",
)
def run_load_redistribution_simulation(
    payload: SimulationRequest,
    user: UserContext = Depends(get_current_user),
) -> SimulationResult:
    """
    Evaluates candidate load transfer from high-risk transformer to a target feeder.
    Checks target headroom, computes relieved risk, energy loss, and protected customers.
    STRICTLY ADVISORY: Never commands physical grid equipment.
    """
    from app.main import app_state
    result = app_state.simulation_service.simulate_load_redistribution(
        request=payload,
        user_id=user.user_id,
    )
    return result


@router.get(
    "",
    response_model=List[SimulationResult],
    summary="List past advisory simulations",
)
def list_simulations(
    user: UserContext = Depends(get_current_user),
) -> List[SimulationResult]:
    from app.main import app_state
    return app_state.simulation_repo.list()
