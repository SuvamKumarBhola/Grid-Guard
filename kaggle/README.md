# GridGuard Model Training & Telemetry Pipeline

This directory provides the end-to-end training suite, dataset generator, and artifact packager for GridGuard distribution transformer failure risk prediction.

---

## 📂 Directory Contents

- [generate_training_dataset.py](file:///home/suvam/Hackathon/mine-Grid-Guard/kaggle/generate_training_dataset.py): Offline physics-informed generator producing realistic distribution transformer telemetry windows across 200 assets over 12 months.
- [train_model.py](file:///home/suvam/Hackathon/mine-Grid-Guard/kaggle/train_model.py): Production CLI training pipeline implementing chronological splitting, class weighting, probability calibration (Isotonic/Platt), threshold optimization, explainability attribution, and canonical GridGuard artifact bundle export.
- [gridguard_model_training.ipynb](file:///home/suvam/Hackathon/mine-Grid-Guard/kaggle/gridguard_model_training.ipynb): Interactive Jupyter Notebook tailored for Kaggle GPU/CPU notebooks or Google Colab with diagnostics, reliability curves, and one-click ZIP bundle export.

---

## 🔬 1. Physics Model & Dataset Specification

### Problem Formulation
Distribution transformers are prone to catastrophic insulation breakdown, dielectric degradation, and winding thermal runaways. GridGuard estimates **failure probability within a 72-hour operational horizon** ($P(\text{failure} \le 72\text{h})$).

### Physics Principles & Mathematical Foundations
1. **IEEE C57.91-2011 Thermal Loading Model:**
   The hottest-spot winding temperature $\Theta_{\text{winding}}$ is modeled by ambient temperature $\Theta_{\text{amb}}$ coupled with non-linear electrical loading losses:
   $$\Theta_{\text{winding}} = \Theta_{\text{amb}} + \Delta \Theta_{\text{rated}} \cdot (\text{Load Factor})^{1.6}$$
   where $\Delta \Theta_{\text{rated}} \approx 55\text{°C}$ is rated temperature rise. Hot-spot thermal headroom to the $110\text{°C}$ IEEE insulation threshold:
   $$\text{Headroom} = 110\text{°C} - \Theta_{\text{winding}}$$
2. **Weibull Distribution of Asset Aging:**
   Transformer population ages follow a Weibull distribution ($\alpha=2.0$, scale=12.0 years), simulating paper-in-oil tensile degradation (degree of polymerization degradation).
3. **Power Quality Variance:**
   Phase imbalance, current surges, and low power factor ($\cos \phi$) accelerate thermal-electrical stress:
   $$\sigma^2_V \sim \text{Exp}(0.02) + 0.015 \cdot \text{Load Factor}$$
4. **Physics-Informed Latent Hazard Ground Truth:**
   $$H = 0.35 \cdot \left[\frac{\Theta_{\text{winding}} - 95}{30}\right]^+ + 0.25 \cdot \left[\frac{\text{Load} - 1.0}{0.5}\right]^+ + 0.18 \cdot \left[\frac{\text{Overdue Days}}{60}\right]^+ + 0.12 \cdot \left[\frac{\sigma_V - 0.05}{0.15}\right]^+ + 0.10 \cdot \left[\frac{\text{Age} - 20}{20}\right]^+$$
   $$P(\text{failure}) = \frac{1}{1 + e^{-4.5(H - 0.55)}}$$

### Feature Dictionary (`features-v1`)

| Feature | Unit | Range | Domain Description |
| :--- | :--- | :--- | :--- |
| `load_factor_current` | ratio | 0.0 – 3.0 | Instantaneous apparent power / rated kVA |
| `load_p95_1h` | ratio | 0.0 – 3.0 | 95th percentile load factor in trailing 1-hour |
| `load_p95_24h` | ratio | 0.0 – 3.0 | 95th percentile load factor in trailing 24-hours |
| `winding_temp_c` | °C | -40.0 – 200.0 | Measured transformer hot-spot winding temperature |
| `temp_rise_rate_c_per_hour` | °C/hr | -50.0 – 100.0 | Differential temperature gradient over last 60 minutes |
| `thermal_headroom_c` | °C | -50.0 – 150.0 | Distance to IEEE maximum rated limit (110°C - winding_temp) |
| `voltage_variance` | p.u. | 0.0 – 1.0 | Normalized variance of phase voltage signals |
| `current_variance` | p.u. | 0.0 – 1.0 | Normalized variance of phase currents |
| `power_factor` | ratio | 0.0 – 1.0 | Active power / apparent power (cos phi) |
| `asset_age_years` | years | 0.0 – 60.0 | Transformer age since commissioning |
| `maintenance_overdue_days` | days | 0 – 1000 | Days past scheduled periodic inspection |
| `weather_severity_index` | score | 0.0 – 1.0 | External ambient heat, humidity, and storm risk score |
| `historical_outage_count` | count | 0 – 50 | Total previous trips or outages on this asset |

---

## 🚀 2. Model Training & Quality Gates

The training pipeline enforces three strict electrical grid operations gates:
1. **Critical-Failure Recall ($\ge 0.95$):** Missing an imminent transformer blowout causes grid outages and equipment destruction. The decision threshold is dynamically calibrated on validation data to achieve $\ge 0.95$ recall.
2. **Expected Calibration Error (ECE $\le 0.05$):** Probabilities must reflect real physical frequencies, achieved via Isotonic probability calibration.
3. **Inference Latency ($< 50$ ms):** Sub-millisecond single-record CPU scoring for real-time supervisory telemetry.

---

## 🛠️ 3. Execution Commands

### Step A: Train & Export Bundle
```bash
python kaggle/train_model.py \
  --samples 50000 \
  --dataset kaggle/gridguard_training_data.csv \
  --output-dir incoming_model \
  --version 0.1.0 \
  --approve
```

### Step B: Validate Exported Bundle
```bash
python scripts/validate_model_artifact.py --dir incoming_model --verify-checksum
```

### Step C: Register into GridGuard Model Registry
```bash
python scripts/register_model.py --source-dir incoming_model --version 0.1.0 --approve
```

### Step D: Serve with GridGuard
```bash
export GRIDGUARD_MODEL_MODE=artifact
export GRIDGUARD_MODEL_DIR=model_artifacts/registered/gridguard-risk-0.1.0
uvicorn app.main:app --port 8000
```
