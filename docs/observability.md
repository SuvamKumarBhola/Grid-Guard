# GridGuard — Observability & Monitoring Guide

## 1. Metric Taxonomy

GridGuard exports structured metrics via `GET /api/v1/metrics`:

### Operational / System Metrics
- `request_count`: Total requests processed.
- `error_count`: HTTP 5xx responses.
- `availability_pct`: Operational availability percentage.
- `latency_ms`: p50, p95, and p99 end-to-end request latency.
- `queue_depth`: In-flight request backlog.

### ML & Routing Metrics
- `prediction_count`: Cumulative risk predictions evaluated.
- `route_distribution`: Breakdown between `champion-model`, `stub-model`, and `safety-fallback`.
- `fallback_rate`: Proportion of inferences routed to safety fallback due to data or model degradation.
- `inference_latency_ms`: Pure ML model evaluation latency percentiles.
- `data_freshness_violations`: Count of stale sensor telemetry events (> 300s).
- `missing_feature_events`: Count of payloads with missing auxiliary sensors.
- `feature_drift_index`: Kolmogorov-Smirnov / PSI feature drift metric against baseline.

### Cost Tracking
- `predictions_served`: Total count.
- `cost_per_1000_predictions_usd`: Standardized cloud serving cost ($0.045 / 1,000 requests).
- `estimated_total_cost_usd`: Running compute expenditure.

---

## 2. Health & Readiness Probes

- **Liveness Probe (`/api/v1/health`):** Verifies the process is alive, storage is responsive, and returns runtime mode. Does not expose secrets.
- **Readiness Probe (`/api/v1/ready`):** Verifies the model provider is initialized and able to serve predictions.
