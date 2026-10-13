# GridGuard — API Reference Specification (v1)

Base Path: `/api/v1`  
OpenAPI Documentation: `http://localhost:8000/docs`  
Interactive ReDoc: `http://localhost:8000/redoc`  

---

## 1. Authentication & Security Headers

In production mode, all endpoints require:
```http
Authorization: Bearer <OIDC_TOKEN>
```
In development mode, authentication defaults to `operator` or uses the `X-User-Role` header.

All API responses include:
- `X-Request-ID`: Traceability UUID
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 2. Core Endpoints

### `POST /api/v1/assets/{asset_id}/risk`
Evaluates failure risk for a transformer.
**Response (200 OK):**
```json
{
  "request_id": "req_01J9X",
  "asset_id": "TX-MUM-1042",
  "risk_score": 0.87,
  "severity": "critical",
  "failure_window_hours": {"low": 4, "high": 18},
  "confidence": 0.91,
  "model_version": "0.1.0",
  "runtime_mode": "artifact",
  "route": "champion-model",
  "contributing_factors": [
    {"feature": "winding_temperature_c", "direction": "up", "impact": 0.42},
    {"feature": "load_factor", "direction": "up", "impact": 0.28}
  ],
  "recommended_action": "Dispatch emergency inspection crew and review feeder load transfer",
  "data_quality": {
    "freshness_seconds": 12.0,
    "missing_features": [],
    "sensor_health": 0.97,
    "status": "healthy"
  },
  "created_at": "2026-10-13T10:30:00Z"
}
```

### `POST /api/v1/simulations/load-redistribution`
Evaluates counterfactual load transfer between network assets.
**Request:**
```json
{
  "source_asset_id": "TX-MUM-1042",
  "target_feeder_id": "FDR-MUM-11",
  "redistribution_percent": 15.0,
  "duration_hours": 6.0
}
```
**Response (200 OK):**
```json
{
  "request_id": "req_e12fa4",
  "simulation_id": "sim_3a9b1c",
  "scenario": {"redistribution_percent": 15.0, "duration_hours": 6.0},
  "result": {
    "status": "advisable_with_review",
    "source_failure_risk_before": 0.87,
    "source_failure_risk_after": 0.56,
    "target_overload_risk": 0.18,
    "customers_protected_estimate": 1840,
    "estimated_energy_loss_kwh": 42.0,
    "confidence": 0.88,
    "constraints": ["Human operator approval is strictly required before physical action"],
    "requires_human_approval": true,
    "advisory_disclaimer": "GridGuard advisory simulator only. Human operator approval is mandatory before any physical switching."
  }
}
```

### `POST /api/v1/anomalies/detect`
Multivariate electrical and thermal anomaly isolation.

### `GET /api/v1/assets`
Lists registered transformers and feeders with operational ranking.

### `GET /api/v1/health` & `GET /api/v1/ready`
Liveness and dependency readiness probes.

### `GET /api/v1/metrics`
Operational, ML route distribution, and cost metrics.
