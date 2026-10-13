# GridGuard — System Limitations & Boundary Disclosures

In accordance with strict hackathon transparency requirements, this document honestly records the operational boundaries, simulated aspects, and future integration milestones for GridGuard.

---

## 1. Safety & Physical Grid Execution Boundary
- **Advisory System Only:** GridGuard calculates failure probabilities and simulates load redistribution impacts. It **does not and must never issue direct SCADA/breaker trip commands**.
- **Human Approval Mandatory:** All counterfactual interventions explicitly flag `requires_human_approval: true`.

---

## 2. Model Training Boundary (Rule 1.1 Adherence)
- **Zero Local Training:** In accordance with non-negotiable instructions, no model training scripts or local fine-tuning jobs are executed on this deployment host.
- **Model Modes:**
  - `stub`: Implemented heuristic scoring for local development and CI testing.
  - `artifact`: Ready to load Kaggle-trained ONNX/XGBoost bundles adhering to `docs/model-artifact-contract.md`.
  - `fallback`: Conservative deterministic thermal/load rule engine.

---

## 3. Storage Layer
- **Default Storage Backend:** Thread-safe in-memory repository with synthetic baseline distribution network (50 transformers, 5 feeders) for immediate reproducibility without external database dependencies.
- **Production Integration Path:** The abstract repository interfaces (`app/repositories/base.py`) are designed for drop-in TimescaleDB/PostgreSQL adapters in enterprise deployments.

---

## 4. Hardware Interfaces
- Telemetry ingestion accepts standard HTTP/JSON payloads. Direct DNP3 and IEC 61850 substation protocol gateways are simulated at the API boundary.
