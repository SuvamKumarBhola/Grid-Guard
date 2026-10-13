#!/usr/bin/env python3
"""
GridGuard Offline Training Dataset Generator
============================================
Generates a realistic historical dataset of 50,000 distribution transformer telemetry
windows across 200 assets over 12 months, modeling physical degradation, thermal runaways,
and electrical fault dynamics.

Suitable for training on Kaggle, Colab, or external GPU/CPU environments.
"""

import os
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def generate_training_data(n_samples: int = 50000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    print(f"Generating {n_samples} synthetic power grid telemetry records...")

    # Assets & Age distribution (Weibull distributed asset age)
    n_assets = 200
    asset_ids = [f"TX-ZONE-{(1000 + i)}" for i in range(n_assets)]
    asset_ages = np.random.weibull(a=2.0, size=n_assets) * 12.0  # 0 to 45 years
    asset_age_map = dict(zip(asset_ids, np.clip(asset_ages, 1.0, 50.0)))
    
    # Base commissioning maintenance lateness
    maint_lateness_map = {
        aid: int(np.random.exponential(scale=25.0)) if np.random.rand() > 0.4 else 0
        for aid in asset_ids
    }

    # Time series range over 365 days
    base_date = datetime(2025, 1, 1, 0, 0, 0)
    timestamps = [base_date + timedelta(hours=int(h)) for h in np.linspace(0, 8760, n_samples)]

    sampled_assets = np.random.choice(asset_ids, size=n_samples)
    
    # 1. Weather Severity (seasonal ambient temperature & storm events)
    day_of_year = np.array([ts.timetuple().tm_yday for ts in timestamps])
    seasonal_temp = 25.0 + 10.0 * np.sin(2 * np.pi * (day_of_year - 100) / 365)
    ambient_temp = seasonal_temp + np.random.normal(0, 3.5, size=n_samples)
    ambient_temp = np.clip(ambient_temp, 5.0, 48.0)
    weather_severity = np.clip((ambient_temp - 25.0) / 25.0 + np.random.exponential(0.1, size=n_samples), 0.0, 1.0)

    # 2. Electrical Load Factor (diurnal peak patterns + random commercial surges)
    hour_of_day = np.array([ts.hour for ts in timestamps])
    daily_pattern = 0.55 + 0.25 * np.sin(2 * np.pi * (hour_of_day - 6) / 24)
    load_factor = np.clip(daily_pattern + np.random.normal(0, 0.12, size=n_samples), 0.15, 2.2)

    # Rolling load percentiles
    load_p95_1h = np.clip(load_factor * np.random.uniform(1.0, 1.15, size=n_samples), 0.2, 2.5)
    load_p95_24h = np.clip(load_factor * np.random.uniform(0.95, 1.25, size=n_samples), 0.2, 2.6)

    # 3. Winding Temperature & Thermal Headroom (IEEE C57.91 thermal model approximation)
    # Winding temp = Ambient + (Load Factor^1.6 * Rated Temperature Rise [typically 55-65C])
    rated_rise = 55.0
    thermal_stress = np.power(load_factor, 1.6) * rated_rise
    winding_temp = ambient_temp + thermal_stress + np.random.normal(0, 2.5, size=n_samples)
    winding_temp = np.clip(winding_temp, 15.0, 160.0)

    temp_rise_rate = np.random.normal(0, 4.0, size=n_samples)
    # IEEE standard max hottest-spot limit is 110C
    thermal_headroom = np.clip(110.0 - winding_temp, -40.0, 95.0)

    # 4. Electrical Instability & Power Quality
    voltage_variance = np.clip(np.random.exponential(scale=0.02, size=n_samples) + (load_factor * 0.015), 0.005, 0.45)
    current_variance = np.clip(np.random.exponential(scale=0.03, size=n_samples) + (load_factor * 0.025), 0.01, 0.50)
    power_factor = np.clip(0.98 - np.random.exponential(scale=0.05, size=n_samples) - (load_factor * 0.03), 0.60, 0.99)

    # Asset context
    asset_age = np.array([asset_age_map[aid] for aid in sampled_assets])
    maintenance_overdue = np.array([maint_lateness_map[aid] for aid in sampled_assets])
    outage_count = np.clip((asset_age / 8.0).astype(int) + np.random.poisson(0.5, size=n_samples), 0, 15)

    # 5. Physics-Informed Latent Hazard & Ground Truth Failure Label
    # Probability of dielectric breakdown, turn-to-turn fault, or thermal blowout within 72h:
    hazard_score = (
        0.35 * np.maximum(0.0, (winding_temp - 95.0) / 30.0) +
        0.25 * np.maximum(0.0, (load_factor - 1.0) / 0.5) +
        0.18 * np.maximum(0.0, maintenance_overdue / 60.0) +
        0.12 * np.maximum(0.0, (voltage_variance - 0.05) / 0.15) +
        0.10 * np.maximum(0.0, (asset_age - 20.0) / 20.0)
    )

    # Sigmoid hazard link
    fail_probability = 1.0 / (1.0 + np.exp(-4.5 * (hazard_score - 0.55)))
    failure_label = (np.random.rand(n_samples) < fail_probability).astype(int)

    df = pd.DataFrame({
        "timestamp": timestamps,
        "asset_id": sampled_assets,
        "load_factor_current": np.round(load_factor, 3),
        "load_p95_1h": np.round(load_p95_1h, 3),
        "load_p95_24h": np.round(load_p95_24h, 3),
        "winding_temp_c": np.round(winding_temp, 2),
        "temp_rise_rate_c_per_hour": np.round(temp_rise_rate, 2),
        "thermal_headroom_c": np.round(thermal_headroom, 2),
        "voltage_variance": np.round(voltage_variance, 4),
        "current_variance": np.round(current_variance, 4),
        "power_factor": np.round(power_factor, 3),
        "asset_age_years": np.round(asset_age, 1),
        "maintenance_overdue_days": maintenance_overdue,
        "weather_severity_index": np.round(weather_severity, 3),
        "historical_outage_count": outage_count,
        "failure_within_72h": failure_label,
    })

    # Sort chronologically to support clean temporal train/test splitting
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    print(f"Dataset generated. Total rows: {len(df)}, Failure events: {df['failure_within_72h'].sum()} ({df['failure_within_72h'].mean()*100:.2f}%)")
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="gridguard_training_data.csv", help="Output CSV path")
    parser.add_argument("--samples", type=int, default=50000, help="Number of telemetry samples")
    args = parser.parse_args()

    df = generate_training_data(n_samples=args.samples)
    df.to_csv(args.output, index=False)
    print(f"Saved dataset to: {args.output}")
