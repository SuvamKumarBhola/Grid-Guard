# GridGuard — Architecture Blueprint

## 1. System Vision & Problem Statement

GridGuard is an autonomous reliability control plane for power distribution networks. Electrical utilities face escalating pressures from distributed renewable generation, electric vehicle (EV) charging peaks, aging substation assets, and climate-induced heatwaves.

GridGuard bridges the gap between high-frequency raw telemetry (SCADA, smart meters, IoT thermal probes) and safe, prioritized operator interventions.

## 2. Core Architectural Principles

1. **Separation of Control Authority (Advisory Only):** GridGuard calculates risks and simulates interventions, but **never commands circuit breakers or automatic switching**. Human operators retain final decision authority.
2. **Zero In-Band Local Training:** ML models are trained externally (e.g. on Kaggle) and registered via signed, checksum-verified artifact bundles.
3. **Tri-Modal Serving Architecture:**
   - `stub`: Deterministic local development and CI execution.
   - `artifact`: Production champion model execution.
   - `fallback`: Conservative rule-based thermal physics fallback.
4. **Risk-Budgeted Safety Routing:** Telemetry freshness (<300s), sensor health (>=0.75), and inference latency (<900ms) are guarded by a hard safety policy engine.

## 3. High-Level Service Architecture

```
                    +------------------------------------+
                    |  SCADA / IoT Telemetry Streams     |
                    +------------------------------------+
                                      |
                                      v
                    +------------------------------------+
                    |  FastAPI Ingestion Gateway         |
                    |  (Dedupe, Range Validation, Quality)|
                    +------------------------------------+
                                      |
                                      v
                    +------------------------------------+
                    |  Feature Preparation Service       |
                    |  (Rolling p95, Thermal Headroom)   |
                    +------------------------------------+
                                      |
                                      v
                    +------------------------------------+
                    |        Safety Policy Router        |
                    +------------------------------------+
                     /               |                  \
                    /                |                   \
      [Healthy & Valid]       [Degraded / Breached]   [Dev Mode]
                  v                  v                    v
         +-----------------+  +-----------------+  +-----------------+
         | Artifact Model  |  | Safety Fallback |  | Stub Provider   |
         | (XGBoost / ONNX)|  | (Thermal Rules) |  | (Heuristics)    |
         +-----------------+  +-----------------+  +-----------------+
                  \                  |                    /
                   \                 |                   /
                    v                v                  v
                    +------------------------------------+
                    |  Normalized Risk Prediction Schema |
                    +------------------------------------+
                                      |
                   +------------------+------------------+
                   |                                     |
                   v                                     v
    +------------------------------+     +-------------------------------+
    | Immutable Audit Trail (SHA256)|     | Prometheus & Cost Metrics     |
    +------------------------------+     +-------------------------------+
```

## 4. Subsystem Components

- **Domain Models (`app/domain/models.py`):** Pydantic v2 schemas for Assets, Feeders, Telemetry, Features, Risk Predictions, and Simulations.
- **Repository Abstraction (`app/repositories/`):** Pluggable storage architecture.
- **Inference Layer (`app/inference/`):** Unified `ModelProvider` contract with validator and resolver.
- **Safety Router (`app/services/safety_router.py`):** Multi-gate circuit breaker protecting operators from corrupted or stale telemetry.
- **Counterfactual Simulator (`app/services/simulation_service.py`):** Physics-guided load redistribution analysis.
- **Operations Console (`frontend/`):** HTML5/CSS3 glassmorphism dashboard.
