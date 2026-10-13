# Kaggle Training Handoff Guide

**Target Audience:** Model Developers / Data Scientists executing training on Kaggle or cloud compute.  
**System:** GridGuard Autonomous Reliability Intelligence  

---

## 1. Problem Framing & Objective

The GridGuard prediction engine estimates **distribution transformer failure probability** over the subsequent operational window based on streaming sensor telemetry and asset CMMS context.

- **Primary Target:** `failure_within_72h` (Binary Classification: `0` = safe/normal operation, `1` = imminent thermal breakdown, insulation breakdown, or dielectric fault).
- **Secondary Target:** `time_to_failure_hours` (Continuous regression / survival analysis).

---

## 2. Feature Specification

When preparing the training dataset on Kaggle, ensure the input columns strictly match this format:

| Column | Type | Unit | Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `load_factor_current` | float | ratio | 0.0 – 3.0 | Instantaneous apparent power / rated kVA |
| `load_p95_1h` | float | ratio | 0.0 – 3.0 | 95th percentile load factor in trailing 1-hour |
| `load_p95_24h` | float | ratio | 0.0 – 3.0 | 95th percentile load factor in trailing 24-hours |
| `winding_temp_c` | float | °C | -40.0 – 200.0 | Measured transformer hot-spot winding temperature |
| `temp_rise_rate_c_per_hour` | float | °C/hr | -50.0 – 100.0 | Differential temperature gradient over last 60 minutes |
| `thermal_headroom_c` | float | °C | -50.0 – 150.0 | Distance to IEEE maximum rated limit (typically 110°C - winding_temp) |
| `voltage_variance` | float | p.u. | 0.0 – 1.0 | Normalized variance of phase voltage signals |
| `current_variance` | float | p.u. | 0.0 – 1.0 | Normalized variance of phase currents |
| `power_factor` | float | ratio | 0.0 – 1.0 | Active power / apparent power (cos phi) |
| `asset_age_years` | float | years | 0.0 – 60.0 | Transformer age since commissioning |
| `maintenance_overdue_days` | int | days | 0 – 1000 | Days past scheduled periodic inspection |
| `weather_severity_index` | float | score | 0.0 – 1.0 | External ambient heat, humidity, and storm risk score |
| `historical_outage_count` | int | count | 0 – 50 | Total previous trips or outages on this asset |

---

## 3. Data Split & Evaluation Criteria

1. **Temporal Splitting Only:** Do NOT use random k-fold cross-validation, as telemetry has temporal auto-correlation. Use chronological train/val/test splits (e.g., Months 1–8 Train, Months 9–10 Validation, Months 11–12 Test).
2. **Evaluation Gates:**
   - **Critical-Failure Recall:** $\ge 0.95$ (Missing an imminent blowout is unacceptable in electrical distribution).
   - **Expected Calibration Error (ECE):** $\le 0.05$ (Probabilities must be true calibrated risks).
   - **Inference Latency:** $< 50$ ms single-record evaluation on CPU.

---

## 4. Exporting Artifacts from Kaggle

Export your trained champion model (e.g. LightGBM, XGBoost, or PyTorch exported to ONNX):
```python
# Kaggle notebook export snippet
import json
import hashlib
import shutil

# 1. Save model in ONNX or Joblib format
# onnx_model.SerializeToString() -> model.onnx

# 2. Write manifest.json
manifest = {
    "model_name": "gridguard-risk",
    "model_version": "0.1.0",
    "artifact_format": "onnx",
    "created_at": "2026-10-13T00:00:00Z",
    "framework": "onnxruntime",
    "input_schema_version": "features-v1",
    "output_schema_version": "risk-v1",
    "training_dataset_reference": "kaggle://owner/grid-telemetry/v1",
    "metrics": {
        "critical_recall": 0.965,
        "calibration_error": 0.038,
        "validation_samples": 8500,
        "f1_score": 0.912,
        "auc_roc": 0.954
    },
    "approval_status": "approved",
    "sha256": "replace-with-sha256-of-model.onnx"
}

with open("manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
```

---

## 5. Registering Artifact with GridGuard Application

1. Download the exported directory from Kaggle to your local machine:
   ```bash
   kaggle kernels output owner/gridguard-training -p ./incoming_model
   ```
2. Validate and register into GridGuard:
   ```bash
   python scripts/validate_model_artifact.py --dir ./incoming_model
   python scripts/register_model.py --source-dir ./incoming_model --version 0.1.0 --approve
   ```
3. Set runtime environment variable:
   ```bash
   export GRIDGUARD_MODEL_MODE=artifact
   export GRIDGUARD_MODEL_DIR=model_artifacts/registered/gridguard-risk-0.1.0
   ```
4. Start GridGuard:
   ```bash
   uvicorn app.main:app --port 8000
   ```
GridGuard will inspect the manifest, verify schemas and checksums, and transition from `stub` to `champion-model` production mode.
