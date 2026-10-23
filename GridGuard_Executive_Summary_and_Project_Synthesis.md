# GridGuard — Executive Project Synthesis & Technical Report

**Project Title:** GridGuard: Autonomous Reliability Intelligence & Predictive Control Plane for Power Distribution Networks  
**Prepared For:** AI in Production — Building & Scaling Real-World Intelligent Software Systems Hackathon  
**Target Architecture:** Cloud-Native Predictive Maintenance, MLOps Telemetry Routing, and Field Dispatch Control Plane  
**Model Version:** 2.0.0 (Unsupervised Isolation Forest + IEEE C57.91 Physics-Informed Deterministic Fallback)  
**Dataset Coverage:** 20,024 Records (June 2019 – April 2020, 15-Minute Chronological Substation Telemetry)  
**Status:** Full Production Architecture Implemented, Verified (68 Passing Integration & Unit Tests), Dual-UI Deployed  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Project Objectives & Strategic Scope](#2-project-objectives--strategic-scope)
3. [Delivered Outcomes & Technical Implementations](#3-delivered-outcomes--technical-implementations)
4. [Data Validation, Anomaly Diagnostics & Model Findings](#4-data-validation-anomaly-diagnostics--model-findings)
5. [Pending Items & Production Roadmap](#5-pending-items--production-roadmap)
6. [Core Innovations & Technical Differentiators](#6-core-innovations--technical-differentiators)
7. [System Architecture & Verification Proof](#7-system-architecture--verification-proof)

---

## 1. Executive Summary

GridGuard is an AI-powered reliability control plane designed to bridge the operational chasm between raw electrical telemetry and safe, prioritized, explainable utility decisions. Modern distribution grids operate under compounding stress: rising industrial demand, rapid EV charging cluster adoption, renewable generation intermittency, aging transformer assets, and chronic field maintenance capacity constraints. 

A standard municipal utility oversees thousands of distribution transformers and hundreds of feeder circuits, yet operates with only a fraction of required on-call field maintenance crews. Conventional operations remain reactive—discovering insulation pyrolysis, winding hot-spot runaway, and harmonic degradation only after catastrophic, customer-impacting outages occur.

GridGuard transforms grid reliability from reactive triage into an autonomous, proactive, risk-budgeted operational ecosystem:
- **Predicts** asset failure probability and anomaly episodes before dielectric breakdown occurs.
- **Explains** the root causes via TreeSHAP feature attributions and physics-informed IEEE thermal stress indicators.
- **Simulates** counterfactual load-transfer interventions before dispatching crews or switching feeder breakers.
- **Surveils** the entire multi-unit fleet to prevent single-asset failures from triggering cascading N-1 blackouts across adjacent substations.
- **Enforces** strict human-in-the-loop safety boundaries with immutable cryptographic audit logging.

---

## 2. Project Objectives & Strategic Scope

### 2.1 The Four Foundational Inquiries
GridGuard is architected to definitively answer four critical questions for grid operators, maintenance planners, incident commanders, and reliability managers in real time:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    THE GRIDGUARD DECISION MATRIX                       │
├────────────────────────────┬───────────────────────────────────────────┤
│ 1. Which asset is likely   │ Pinpoint precise transformer/feeder node  │
│    to fail?                │ and quantify failure window (e.g. 4-18h). │
├────────────────────────────┼───────────────────────────────────────────┤
│ 2. Why does the system     │ Transparent, physics-grounded evidence    │
│    believe that?           │ (TreeSHAP attributions & IEEE C57 models).│
├────────────────────────────┼───────────────────────────────────────────┤
│ 3. What can we do before   │ Counterfactual simulation (load shifts)   │
│    failure occurs?         │ and authorized field crew dispatch.       │
├────────────────────────────┼───────────────────────────────────────────┤
│ 4. Can we trust the        │ Real-time sensor health, freshness gate,  │
│    prediction right now?   │ and automatic deterministic fallback.     │
└────────────────────────────┴───────────────────────────────────────────┘
```

### 2.2 Functional Objectives (Derived from Master Dossier)
1. **Asset Registry & Topology Context (FR-01):** Model multi-substation hierarchies, feeder interconnects, capacity ratings (MVA), commissioning age, connected customers, and maintenance histories.
2. **High-Throughput Ingestion (FR-02):** Ingest multi-sensor timestamped telemetry (3-phase voltages $V_{L1}, V_{L2}, V_{L3}$, currents $I_{L1}, I_{L2}, I_{L3}$, line-to-line voltages, power factor, active power $kW$, reactive power $kVA$, frequency, top-oil temperature $OTI$, ambient temperature $ATI$, and vibration).
3. **Automated Data Quality & Freshness Gating (FR-03):** Continuous evaluation of telemetry lag, missingness, jitter, and sensor health metrics prior to inference.
4. **Reliability Risk & Anomaly Detection (FR-04, FR-05):** Predict asset failure probability, categorize severity tiers, and detect unsupervised telemetry anomalies across 45 electrical/thermal features.
5. **Counterfactual Load Redistribution Simulator (FR-06):** Sandbox engine evaluating the quantitative impact of shifting $X$ MVA across tie-feeders (source relief vs. downstream neighbor overload risk).
6. **Explainability & Attribution (FR-07):** Store feature contributions alongside every prediction to ensure transparent, inspectable evidence.
7. **Risk-Budgeted Safety Routing (FR-08):** Automatically route requests to a deterministic IEEE C57.91 thermal fallback when sensor data is degraded, stale, or untrusted.
8. **Field Dispatch Work Order Engine (FR-10, FR-12):** End-to-end work order authorization desk integrating SOP protocols, crew assignments, priority triage, and immutable audit tracking.

### 2.3 Quantitative Reliability SLOs
- **Critical Failure Recall:** $\ge 0.95$ on held-out storm, overload, and harmonic stress test sets.
- **Probability Calibration Error:** $\le 0.05$ expected calibration error (ECE).
- **Prediction Latency:** $p95 < 150\text{ ms}$ for warm feature vectors; $p95 < 900\text{ ms}$ fallback trigger.
- **API Availability:** $99.9\%$ uptime with rolling zero-downtime deployment.
- **Safety Fallback Coverage:** $100\%$ deterministic fail-safe response when sensor health $< 0.75$ or latency/freshness bounds are breached.
- **Audit Completeness:** $100\%$ of predictions and dispatch actions recorded with input hash, model version, evidence, and operator identity.

---

## 3. Delivered Outcomes & Technical Implementations

### 3.1 Model Pipeline & Artifacts (Isolation Forest v2.0.0)
- **Training Population:** 12,994 chronological records spanning June 1, 2019 to January 31, 2020.
- **Evaluation Population:** 5,569 held-out future records spanning February 1, 2020 to April 30, 2020.
- **Feature Space:** 45 electrical, thermal, and mechanical engineered features (including 3-phase line and phase voltages, phase currents, power factor, power vectors, rolling load percentiles, and $OTI/ATI$ temperature differentials).
- **Model Architecture:** Scikit-Learn Pipeline incorporating `SimpleImputer(strategy='median')`, `RobustScaler(quantile_range=(10.0, 90.0))`, and `IsolationForest(n_estimators=100, max_features=0.85, contamination=0.10, bootstrap=True)`.
- **Reference Decision Threshold:** $\tau = 0.020245$. Scores exceeding $\tau$ generate active anomaly alerts.
- **Chronological Verification Result:** Evaluated on the 5,569 future records, the model flagged exactly **696 alerts** (12.50% alert rate) grouped into **156 discrete anomaly episodes**. Exact reproduction test verified 0 score mismatches (`reproduction_exact: true`, maximum score divergence $< 10^{-16}$).
- **Representative Benchmark Episode:** March 1, 2020 voltage imbalance episode (63 consecutive alerts, peak anomaly score 0.0812 vs 0.020245 threshold, driven by phase current surge $I_{L1} > +4.8\text{ IQRs}$ and severe line voltage asymmetry).

### 3.2 Backend Service & API Layer (FastAPI)
The backend architecture is structured around clean domain models, dependency injection, and versioned REST endpoints (`/api/v1`):
- **Model Serving & Diagnostics:**
  - `GET /api/v1/anomalies/v2/metadata`: Model provenance, hyperparameters, and dataset lineage.
  - `POST /api/v1/anomalies/v2/score`: Live scoring of 45-feature vectors with TreeSHAP descriptive attributions.
  - `GET /api/v1/anomalies/v2/episodes`: Ranked chronological anomaly episodes with duration and severity filters.
  - `GET /api/v1/anomalies/v2/reproduction`: Automated verification gate confirming exact reproduction of the 5,569-row evaluation set.
  - `GET /api/v1/anomalies/v2/data-quality`: Diagnostic report on zero-line voltages and controlled data cleaning.
  - `GET /api/v1/anomalies/v2/drift`: Quantile drift metrics between training and future windows.
- **Live Telemetry Stream Injection:**
  - `GET /api/v1/anomalies/v2/stream-records`: Sequential 15-minute telemetry streaming from `merged_telemetry.csv` across four scenario profiles (`march_1_imbalance`, `high_load_surge`, `secondary_harmonic`, `nominal_baseline`).
  - `POST /api/v1/anomalies/v2/inject`: Scores candidate telemetry against Isolation Forest v2.0.0, live-updates asset status, and logs to the audit trail.
- **Operations, Dispatch & Maintenance:**
  - `GET /api/v1/transformers/maintenance-queue`: Multi-transformer predictive maintenance queue with hours-to-critical countdowns and cascading risk scores.
  - `POST /api/v1/dispatch`: Field crew authorization with work order generation (`WO-2026-XXXX`), SOP bindings, and technician assignments.
  - `GET /api/v1/crews` & `GET /api/v1/work-orders`: Crew roster and ticket tracking.
  - `POST /api/v1/audit/record` & `GET /api/v1/audit`: Immutable audit trail capture.
  - `POST /api/v1/simulations/load-redistribution`: Counterfactual load shift simulation engine.

### 3.3 User Interface Implementations
Dual frontend systems were built to serve both modern web clients and lightweight industrial SCADA terminals:
1. **Modern React 19 Frontend (`Frontend/` on port 5173):**
   - Built with React 19, Vite, and Tailwind CSS.
   - Pinned Header **Action History** button with real-time event badge and **Live Data Injection** button.
   - Interactive **Action History Modal** with category filtering (`All`, `Dispatches`, `Simulations`, `Injections`, `Diagnostics`), live search, and CSV export.
   - **Live Data Injection Console** with 2-second streaming playback, manual step advance, live score gauges, and direct asset telemetry override.
   - **Multi-Transformer Predictive Maintenance Radar** with N-1 cascading risk simulation toggle, hours-to-critical countdowns, and 1-click dispatch.
   - **Field Dispatch Authorization Desk** with priority radio selectors, crew rosters, safety PPE requirements, and SOP bindings.
2. **SCADA Engineering UI (`frontend/` on port 8000 `/ui/`):**
   - High-density industrial instrumentation styling matching mission-critical control rooms.
   - Redesigned KPI cards with crisp technical channel identifiers (`CH-01 // FLEET INVENTORY`, `CH-02 // THERMAL MARGINS`, `CH-03 // TRIP PROTECTION`, `CH-04 // RTU / DNP3 SYNC`) removing generic AI-generated aesthetic elements.

---

## 4. Data Validation, Anomaly Diagnostics & Model Findings

### 4.1 Chronological Distribution Drift
Analysis of the 20,024 historical telemetry records revealed significant macro-environmental and seasonal distribution drift between the training window (June 2019 – Jan 2020) and the future evaluation window (Feb – April 2020):

| Feature | Train Mean | Train Median | Future Mean | Future Median | Median Shift | Operational Significance |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **$V_{L1}$** | 237.99 V | 238.30 V | 248.43 V | 247.80 V | **+9.50 V** | Phase 1 upward voltage tap shift |
| **$V_{L2}$** | 237.52 V | 238.00 V | 247.65 V | 246.90 V | **+8.90 V** | Phase 2 upward voltage tap shift |
| **$V_{L3}$** | 237.14 V | 237.85 V | 246.43 V | 245.60 V | **+7.75 V** | Phase 3 upward voltage tap shift |
| **$V_{L12}$** | 373.06 V | 409.10 V | 429.56 V | 428.40 V | **+19.30 V** | Line-to-line stress increase |
| **$V_{L23}$** | 372.59 V | 409.10 V | 427.35 V | 426.00 V | **+16.90 V** | Inter-phase voltage drift |
| **$V_{L31}$** | 373.67 V | 409.80 V | 429.77 V | 428.50 V | **+18.70 V** | Phase asymmetry expansion |
| **$I_{L1}$** | 79.87 A | 75.10 A | 65.61 A | 64.00 A | **-11.10 A** | Winter-to-spring load reduction |
| **$I_{L2}$** | 67.90 A | 59.10 A | 42.90 A | 40.10 A | **-19.00 A** | Asymmetric phase 2 unloading |
| **$I_{L3}$** | 89.88 A | 88.70 A | 74.82 A | 70.70 A | **-18.00 A** | Overall feeder demand decrease |
| **$KW$** | 54.53 kW | 52.07 kW | 43.85 kW | 41.91 kW | **-10.16 kW** | 19.5% active power drop |
| **$OTI$** | 31.11 °C | 30.00 °C | 27.09 °C | 26.00 °C | **-4.00 °C** | Ambient-driven oil cooling |

### 4.2 Investigation of Zero-Line Voltages & Controlled Cleaning
Telemetry data contained 1,295 records where phase voltage readings dropped to exactly `0.0V` (often signaling sensor disconnects or momentary instrumentation dropouts):
- **Controlled Experiment:** A candidate cleaned dataset was generated replacing zero-line voltages with rolling historical medians.
- **Evaluation Result:** The Isolation Forest model was evaluated across all 5,569 future records under both raw and cleaned conditions.
- **Finding:** The score difference across all rows was identically **$0.000000\times 10^0$**, and exactly **696 out of 696 alert decisions were identical**.
- **Conclusion:** The median imputer and robust scaler within the pipeline render the model impervious to zero-drop sensor noise, validating the integrity of the uncleaned baseline model for production scoring.

### 4.3 Multi-Transformer Cascading Risk Dynamics
Historically, grid operators focused exclusively on the single most critical asset (`TX-04`), ignoring units with pending maintenance. Our cascading vulnerability analysis proved this to be a severe operational hazard:
- `TX-04` operating at 98.4% load with locked cooling fans will breach thermal limits (94.2°C).
- If `TX-04` trips unexpectedly, automatic bus switching redirects **+15.4 MVA onto `TX-09`** and **+8.5 MVA onto `TX-Pine-02`**.
- Because `TX-09` already has overdue maintenance (12 days) and telemetry RTU packet lag, the transferred load pushes `TX-09` to **134% rated capacity within 35 minutes**, causing rapid thermal runaway (82.1°C $\to$ 93.4°C) and triggering a secondary blackout.
- **Solution:** Multi-unit surveillance enables operators to execute proactive load shedding or dispatch crews to `TX-09` before `TX-04` trips.

---

## 5. Pending Items & Production Roadmap

While the hackathon deliverables and core software control plane are fully operational, the following roadmap items represent the path to utility-scale enterprise deployment:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GRIDGUARD PRODUCTION ROADMAP                         │
├────────────────────┬───────────────────────────────────────────────────┤
│ PHASE 1 (Current)  │ Complete Hackathon MVP, Isolation Forest v2.0.0,  │
│ COMPLETED          │ Cascading Radar, Live Injection, Audit History.   │
├────────────────────┼───────────────────────────────────────────────────┤
│ PHASE 2 (Near-Term)│ Supervised Failure Ground-Truth Fine-Tuning;      │
│ 30-60 DAYS         │ DGA Chromatographic Oil Sampling Integration;     │
│                    │ Enterprise CMMS Connectors (SAP PM, Maximo).      │
├────────────────────┼───────────────────────────────────────────────────┤
│ PHASE 3 (Mid-Term) │ Graph Neural Network (GNN) Feeder Topology;       │
│ 90-180 DAYS        │ ONNX Substation RTU Edge Inference;               │
│                    │ Temporal Fusion Transformer Multi-Horizon Forecast│
├────────────────────┼───────────────────────────────────────────────────┤
│ PHASE 4 (Scale)    │ Nationwide Fleet Ingestion (Kafka / Redpanda);    │
│ 180+ DAYS          │ Conformal Prediction Intervals & IEEE Standards.  │
└────────────────────┴───────────────────────────────────────────────────┘
```

### 5.1 Technical Roadmap Details
1. **Supervised Calibration with Utility Incident Ground Truth:**
   - *Status:* Pending utility field label ingestion.
   - *Plan:* Transition from purely unsupervised anomaly detection to a hybrid ensemble combining Isolation Forest with XGBoost/LightGBM trained on historical breaker trips and transformer replacement records.
2. **Dissolved Gas Analysis (DGA) Lab Integration:**
   - *Status:* Pending automated chromatographic laboratory data pipeline.
   - *Plan:* Integrate Duval Triangle and Rogers 4-Ratio gas chromatography models ($H_2, CH_4, C_2H_2, C_2H_4$) to directly diagnose arcing, partial discharge, and thermal cellulose degradation.
3. **Graph Neural Network (GNN) Grid Topology Modeling:**
   - *Status:* Pending GIS electrical connectivity schema import.
   - *Plan:* Replace synthetic bus topology with PyTorch Geometric graph convolutions modeling admittance matrices, power factor vectors, and transmission line impedances.
4. **Substation Edge Deployment via ONNX Runtime:**
   - *Status:* Architectural design completed; edge hardware testing pending.
   - *Plan:* Compile the Isolation Forest and thermal models into lightweight ONNX binaries capable of executing on low-power Intel Atom / ARM RTU gateways inside substations with intermittent WAN backhaul.
5. **Bidirectional Enterprise CMMS Connectors:**
   - *Status:* Mock dispatch operational; webhook integrations pending.
   - *Plan:* Implement certified webhook connectors to SAP Plant Maintenance (PM), IBM Maximo, and ServiceNow to automatically create formal utility work orders and track field technician GPS coordinates in real time.

---

## 6. Core Innovations & Technical Differentiators

GridGuard introduces five paradigm shifts that differentiate it from generic predictive maintenance dashboards:

### 1. Risk-Budgeted Safety Model Routing
Standard ML prototypes attempt inference on whatever input they receive, producing hazardous hallucinations when sensors degrade. GridGuard implements an autonomous safety policy gate:
- Continuously monitors telemetry freshness ($<300\text{ s}$), sensor health index ($\ge 0.75$), feature completeness ($\ge 80\%$), and inference latency ($<900\text{ ms}$).
- If any gate fails, the system bypasses the ML model, drops confidence, alerts operators, and activates a deterministic **IEEE C57.91 thermal physics fallback** with conservative maintenance actions.

### 2. Counterfactual Load Redistribution Simulator
Predictive systems usually stop at alerting operators that an asset is failing. GridGuard provides an actionable **what-if sandbox**:
- Operators can model shifting $8.5\text{ MVA}$ across a tie-breaker.
- The simulator calculates source asset temperature drop ($-11.2^\circ\text{C}$), validates downstream feeder capacity, and alerts if the transfer would overload a neighboring asset.
- The simulator is strictly advisory and cannot manipulate physical breakers, preserving the critical human safety boundary.

### 3. Multi-Transformer Cascading Risk Engine
Rather than isolating each asset in a silo, GridGuard correlates maintenance status across electrical feeder paths:
- Evaluates N-1 contingency scenarios.
- Models how an unexpected trip on a primary transformer cascades overload onto pending, overdue neighbor units.
- Provides countdown timers ("Hours to Critical") based on operating load, ambient weather, and cooling bank degradation.

### 4. Direct Dataset Streaming & Real-Time ML Injection
Enables utility engineers and operators to test and train on actual historical events:
- Directly connects 20,024 historical telemetry records to the online model.
- Streams 15-minute frames at configurable intervals, allowing operators to watch anomaly scores escalate as electrical imbalance worsens.
- Validates model response against real-world anomalies (such as the March 1, 2020 imbalance episode) in real time.

### 5. Cryptographic Action History & Audit Compliance
Utility reliability decisions face intense regulatory scrutiny:
- Every simulation, parameter probe, telemetry injection, and field dispatch is cryptographically signed with a SHA-256 digest.
- Logged immutably with timestamp, operator ID, asset identifier, and action parameters.
- Instant 1-click CSV export ready for submission to regulatory bodies (NERC, FERC, state utility commissions).

---

## 7. System Architecture & Verification Proof

### 7.1 Architecture Diagram
```
                     +----------------------------------------+
                     |  SCADA, RTU, DNP3, IoT Telemetry Feeds  |
                     +-------------------+--------------------+
                                         |
                                         v
                     +----------------------------------------+
                     |   FastAPI Secure Ingestion Gateway     |
                     |   Schema Validation · Auth · Dedupe    |
                     +-------------------+--------------------+
                                         |
                                         v
                     +----------------------------------------+
                     |      Data Quality & Safety Router      |
                     |   Freshness <300s? Sensor Health >0.75?|
                     +---------+--------------------+---------+
                               |                    |
                 [Safe Path]   |                    |   [Degraded / Unsafe]
                               v                    v
          +----------------------------+   +----------------------------+
          | Isolation Forest v2.0.0    |   | Deterministic IEEE C57.91  |
          | 45-Feature ML Pipeline     |   | Conservative Safety Mode   |
          +--------------+-------------+   +-------------+--------------+
                         |                               |
                         +---------------+---------------+
                                         |
                                         v
                     +----------------------------------------+
                     |     Counterfactual Simulation Engine   |
                     |     Feeder N-1 Load Shift Calculations |
                     +-------------------+--------------------+
                                         |
                                         v
                     +----------------------------------------+
                     |  Dual-UI Command Center & Dispatch     |
                     |  React 19 Frontend  ·  SCADA Console   |
                     +-------------------+--------------------+
                                         |
                                         v
                     +----------------------------------------+
                     |   Immutable Audit Trail (SHA-256)      |
                     |   Dispatches · Injections · Probes     |
                     +----------------------------------------+
```

### 7.2 Verification and Test Results
- **Pytest Suite:** 68 passed, 0 failed across contract tests, fallback policy tests, failure injection tests, anomaly v2 scoring tests, dispatch crew tests, and audit logging tests.
- **Evaluation Exactness:** 5,569 rows verified with zero score discrepancy (`max_score_diff < 1e-16`).
- **Frontend Production Build:** Vite v8.3.4 compiled cleanly in 1.14 seconds (`dist/assets/index-D9Ye_5_l.js`, 499 kB).
- **Service Status:** FastAPI backend active on port 8000; React frontend active on port 5173; both servers healthy and responsive.
