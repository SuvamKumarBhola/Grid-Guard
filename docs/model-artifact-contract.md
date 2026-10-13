# GridGuard — Model Artifact Contract

**Version:** 1.0.0  
**Effective Date:** 2026-10-13  
**Status:** Canonical Interface Specification  

---

## 1. Overview & Handoff Principle

In accordance with GridGuard system non-negotiable guidelines, **no ML model training occurs locally on the deployment host**. Models are trained and evaluated in isolated external environments (e.g., Kaggle GPU/TPU notebooks) and delivered as standardized, versioned artifact bundles into the GridGuard model registry directory.

Every model registered with GridGuard must satisfy this specification. Malformed or unverified bundles are rejected at startup or promotion time, forcing safe runtime degradation or fallback.

---

## 2. Directory Layout Contract

A registered model bundle must reside at:
```text
model_artifacts/registered/{model_name}-{model_version}/
```

For example: `model_artifacts/registered/gridguard-risk-0.1.0/`

Required files:

| File | Type | Description |
| :--- | :--- | :--- |
| `manifest.json` | JSON | Model metadata, schema versions, training lineage, and evaluation metrics |
| `feature_schema.json` | JSON | Input feature specifications (names, datatypes, bounds, units) |
| `threshold_config.json` | JSON | Severity classification cutoffs and operational action mapping |
| `metrics.json` | JSON | Detailed held-out validation and calibration metrics |
| `explainability.json` | JSON | Feature importance weights, SHAP baseline vectors, or surrogate rule weights |
| `checksums.sha256` | Text | SHA-256 digests for all files in the directory |
| `model.bin` / `model.onnx` / `model.pkl` | Binary | The serialized model binary |

---

## 3. Manifest Schema Specification (`manifest.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "model_name": "gridguard-risk",
  "model_version": "0.1.0",
  "artifact_format": "onnx",
  "created_at": "2026-10-13T00:00:00Z",
  "framework": "onnxruntime",
  "input_schema_version": "features-v1",
  "output_schema_version": "risk-v1",
  "training_dataset_reference": "kaggle://owner/dataset/version",
  "metrics": {
    "critical_recall": 0.965,
    "calibration_error": 0.038,
    "validation_samples": 8500,
    "f1_score": 0.912,
    "auc_roc": 0.954
  },
  "approval_status": "candidate",
  "sha256": "3fa85f64-replace-with-real-checksum-of-model-file"
}
```

### Manifest Validation Rules
1. `model_name` must match `^[a-z0-9-]+$` and defaults to `gridguard-risk`.
2. `model_version` must follow Semantic Versioning (`MAJOR.MINOR.PATCH`).
3. `artifact_format` must be one of `["onnx", "bin", "pkl", "stub"]`.
4. `framework` must be one of `["onnxruntime", "xgboost", "scikit-learn", "stub"]`.
5. `approval_status` must be `"approved"` if `GRIDGUARD_REQUIRE_APPROVED_MODEL=true`.
6. If `GRIDGUARD_ENABLE_CHECKSUM_VALIDATION=true`, the SHA-256 of the binary must match `sha256`.

---

## 4. Feature Schema Specification (`feature_schema.json`)

The runtime requires the following input features:
```json
{
  "schema_version": "features-v1",
  "features": [
    {"name": "load_factor_current", "type": "float", "unit": "ratio", "min": 0.0, "max": 3.0},
    {"name": "load_p95_1h", "type": "float", "unit": "ratio", "min": 0.0, "max": 3.0},
    {"name": "load_p95_24h", "type": "float", "unit": "ratio", "min": 0.0, "max": 3.0},
    {"name": "winding_temp_c", "type": "float", "unit": "celsius", "min": -40.0, "max": 200.0},
    {"name": "temp_rise_rate_c_per_hour", "type": "float", "unit": "celsius/hour", "min": -50.0, "max": 100.0},
    {"name": "thermal_headroom_c", "type": "float", "unit": "celsius", "min": -50.0, "max": 150.0},
    {"name": "voltage_variance", "type": "float", "unit": "pu", "min": 0.0, "max": 1.0},
    {"name": "current_variance", "type": "float", "unit": "pu", "min": 0.0, "max": 1.0},
    {"name": "power_factor", "type": "float", "unit": "ratio", "min": 0.0, "max": 1.0},
    {"name": "asset_age_years", "type": "float", "unit": "years", "min": 0.0, "max": 60.0},
    {"name": "maintenance_overdue_days", "type": "int", "unit": "days", "min": 0, "max": 1000},
    {"name": "weather_severity_index", "type": "float", "unit": "index", "min": 0.0, "max": 1.0},
    {"name": "historical_outage_count", "type": "int", "unit": "count", "min": 0, "max": 50}
  ]
}
```

---

## 5. Threshold Configuration (`threshold_config.json`)

```json
{
  "risk_thresholds": {
    "normal_max": 0.40,
    "watch_max": 0.70,
    "critical_min": 0.70
  },
  "failure_windows_hours": {
    "critical": {"low": 4, "high": 18},
    "watch": {"low": 18, "high": 72},
    "normal": {"low": 72, "high": 720}
  },
  "actions": {
    "critical": "Dispatch inspection crew and review feeder load",
    "watch": "Schedule thermographic scan and monitor winding temp trend",
    "normal": "Continue routine supervisory monitoring"
  }
}
```

---

## 6. Registration CLI Utility

A registration tool is provided at `scripts/register_model.py`:
```bash
python scripts/register_model.py \
  --source-dir /path/to/kaggle_downloaded_artifact \
  --version 0.1.0 \
  --approve
```

The script automatically validates schema, computes SHA-256 digests, and generates `checksums.sha256`.
