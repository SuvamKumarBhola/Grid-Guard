# ADR-002: Safety Router and Operator Advisory Boundary

## Status
Accepted

## Context
Power distribution networks are mission-critical. ML models can suffer from stale sensors, covariate shift, or latency spikes. Autonomous execution of breaker trips by an AI system poses catastrophic blackout risks.

## Decision
1. **Safety Router:** Requests with degraded sensor health (< 0.75), stale telemetry (> 300s), or latency SLA breaches (> 900ms) are dynamically intercepted and routed to a deterministic thermal physics fallback engine.
2. **Advisory Boundary:** The counterfactual load simulator strictly calculates potential impacts and enforces `requires_human_approval: true`. Zero physical switching commands are implemented.

## Consequences
- Guaranteed system availability even during complete primary model outages.
- Compliance with utility engineering standards and electrical safety codes.
