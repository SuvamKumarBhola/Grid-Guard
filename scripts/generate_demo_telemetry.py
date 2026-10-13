#!/usr/bin/env python3
"""
CLI script to generate synthetic telemetry data for GridGuard demonstrations.
Outputs JSON summary of 50 transformers across 5 feeders.
"""
import json
from app.services.synthetic_generator import generate_synthetic_grid


def main():
    feeders, assets, telemetry = generate_synthetic_grid(seed=42)
    print(f"Generated {len(feeders)} feeders, {len(assets)} assets, and {len(telemetry)} telemetry records.")

    # Display benchmark asset TX-MUM-1042 details
    tx_1042 = next(a for a in assets if a.asset_id == "TX-MUM-1042")
    tel_1042 = next(t for t in telemetry if t.asset_id == "TX-MUM-1042")

    print("\n--- Benchmark Asset TX-MUM-1042 ---")
    print(f"Asset: {tx_1042.model_dump_json(indent=2)}")
    print(f"Telemetry: {tel_1042.model_dump_json(indent=2)}")


if __name__ == "__main__":
    main()
