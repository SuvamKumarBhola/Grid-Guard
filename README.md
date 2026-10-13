# GridGuard — Autonomous Reliability Intelligence for Power Distribution Networks

[![CI Pipeline](https://github.com/gridguard/gridguard/actions/workflows/ci.yml/badge.svg)](https://github.com/gridguard/gridguard/actions)
[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **AI in Production — Building & Scaling Real-World Intelligent Software Systems**  
> *GridGuard is an AI-powered reliability control plane that predicts transformer and feeder failure risk, explains multi-sensor evidence with TreeSHAP, and simulates safer load-redistribution actions before an outage occurs.*

---

## ⚡ Key Highlights & Production Innovations

1. **Tri-Modal Serving Architecture (Zero Local Training):**
   - `stub`: Fast, deterministic heuristic scoring for local development and CI testing.
   - `artifact`: Production champion ML inference consuming verified Kaggle-trained bundles (`model.bin`/`model.onnx`).
   - `fallback`: Conservative deterministic physics rule engine automatically activated under sensor degradation.
2. **Risk-Budgeted Safety Policy Router:**
   - Evaluates sensor health (< 0.75), telemetry staleness (> 300s), and latency SLA breaches (> 900ms).
   - Degraded states route seamlessly to safety fallback without dropping client traffic.
3. **Counterfactual Load Redistribution Simulator:**
   - Advisory intervention planner evaluating dynamic load transfer across distribution feeders before an outage.
   - Enforces strict safety boundaries: **GridGuard never commands breakers directly; human operator approval is mandatory**.
4. **Immutable Compliance Audit Trail:**
   - Every risk prediction and simulation records input SHA-256 hashes, feature versions, model versions, and operator actions.
5. **High-Polish Operations Console:**
   - Pure HTML5/CSS3 glassmorphism dashboard consuming real `/api/v1` APIs with zero build-tool dependency.

---

## 🏗️ System Architecture

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

---

## 🚀 Quickstart & Demo Commands

### 1. Installation
Clone repository and initialize virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### 2. Run the Application
Start the GridGuard server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open your browser to:
- **Operations Console:** [http://localhost:8000/ui/](http://localhost:8000/ui/) (or [http://localhost:8000/](http://localhost:8000/))
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Run the Automated Test Suite (60 Tests)
```bash
pytest tests/ -v
```

### 4. Verify Telemetry Anomaly Detector v2 (All 14 Acceptance Criteria)
```bash
python scripts/verify_anomaly_v2_model.py
# or via Makefile
make verify-model-v2
```

### 5. Run Concurrent Load & Resilience Benchmark
```bash
python scripts/run_load_test.py --requests 300 --concurrency 10
```

### 6. Validate Registered Model Bundle
```bash
python scripts/validate_model_artifact.py \
  --dir model_artifacts/registered/gridguard-risk-0.1.0 \
  --require-approved \
  --verify-checksum
```

---

## 📊 Measured Benchmark Results

Concurrently evaluated on an x86_64 Linux host with 10% injected degraded sensor faults:

| Metric | Target SLA | Measured Value |
| :--- | :--- | :--- |
| **Throughput** | $\ge 100$ req/s | **132.7 req/s** |
| **Error Rate** | $\le 0.1\%$ | **0.00% (0 / 300 errors)** |
| **p50 Latency** | $< 100$ ms | **69.59 ms** |
| **p95 Latency** | $< 150$ ms | **113.47 ms** |
| **p99 Latency** | $< 250$ ms | **148.46 ms** |
| **Fallback Gate Interception** | $> 0\%$ | **31.0% (Graceful degraded handling)** |

---

## 📦 Model Artifact Handoff (Kaggle Contract)

GridGuard adheres to a strict zero-training boundary on the runtime host. Models trained on Kaggle are handed off as directory bundles into `model_artifacts/registered/<model_name>-<version>/`:

```text
model_artifacts/registered/gridguard-risk-0.1.0/
├── model.bin or model.onnx
├── manifest.json
├── feature_schema.json
├── threshold_config.json
├── metrics.json
├── explainability.json
└── checksums.sha256
```

To register a new externally trained artifact:
```bash
python scripts/register_model.py \
  --source-dir /path/to/kaggle_export \
  --version 0.2.0 \
  --approve
```

See [docs/kaggle-training-handoff.md](docs/kaggle-training-handoff.md) and [docs/model-artifact-contract.md](docs/model-artifact-contract.md) for full instructions.

---

## 🗺️ Project Structure

```text
mine-Grid-Guard/
├── app/
│   ├── api/v1/             # Versioned REST APIs (telemetry, assets, risk, anomalies, simulations)
│   ├── domain/             # Strict Pydantic domain models
│   ├── inference/          # Provider abstraction (stub, artifact, fallback, validator)
│   ├── monitoring/         # Thread-safe metrics collector
│   ├── repositories/       # Pluggable storage abstraction (InMemory/SQLite)
│   ├── security/           # RBAC permissions and OIDC authentication
│   ├── services/           # Telemetry, feature engineering, safety router, simulations
│   ├── config.py           # Environment-driven configuration
│   └── main.py             # FastAPI entrypoint, lifespan, and middleware
├── deployment/
│   ├── docker/             # Docker configurations
│   └── kubernetes/         # Production manifests (Deployment, Service, HPA, PDB, ConfigMap)
├── docs/                   # Comprehensive documentation suite & ADRs
├── frontend/               # Polished operator dashboard (HTML/CSS/JS)
├── model_artifacts/        # Registered bundles, schemas, and checksums
├── models-trained/         # Trained v2 Isolation Forest model, metadata, episodes, and datasets
├── scripts/                # Load testing, artifact validation, model registration, acceptance verification
└── tests/                  # 60 automated unit, integration, contract, and model v2 acceptance tests
```

---

## 🔒 Operational & Safety Boundaries

- **Operator Assistance Only:** GridGuard recommends and explains. It does not operate the electrical grid.
- **Human Approval:** All counterfactual intervention outputs enforce `requires_human_approval: true`.
- **Zero Local Training:** Training is isolated to cloud/Kaggle environments.
- **Model v2 Product Claim & Boundary:** *GridGuard uses unsupervised machine learning to flag unusual transformer telemetry and help operators investigate operating patterns. Its alerts are not yet validated predictions of transformer failure.* Explanations represent descriptive telemetry deviations, not causal physical fault diagnoses.
