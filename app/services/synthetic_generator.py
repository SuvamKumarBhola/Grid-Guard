from datetime import datetime, timezone, timedelta
from typing import List, Dict, Tuple
import random
from app.domain.models import (
    Asset,
    AssetLocation,
    Feeder,
    TelemetryObservation,
    TelemetryIngestPayload,
)
from app.repositories.base import (
    BaseAssetRepository,
    BaseFeederRepository,
    BaseTelemetryRepository,
)
from app.domain.grid_mapping import (
    WESTERN_TO_MUMBAI_ASSET_MAP,
    WESTERN_TO_MUMBAI_FEEDER_MAP,
    get_primary_asset_alias,
    get_primary_feeder_alias,
    resolve_canonical_asset_id,
    resolve_canonical_feeder_id,
)
from app.services.telemetry_service import TelemetryService


def generate_synthetic_grid(seed: int = 42) -> Tuple[List[Feeder], List[Asset], List[TelemetryIngestPayload]]:
    """Generates 5 feeders and 50 transformers with realistic telemetry profiles."""
    rng = random.Random(seed)
    now = datetime.now(timezone.utc)

    # 1. Feeders (5 feeders across Mumbai metropolitan electrical zones)
    feeders_meta = [
        {"id": "FDR-MUM-11", "name": "Bandra West Feeder", "sub": "SUB-BANDRA", "cap": 25.0, "cust": 12500, "tier": "tier_1"},
        {"id": "FDR-MUM-22", "name": "Andheri East Feeder", "sub": "SUB-ANDHERI", "cap": 30.0, "cust": 16800, "tier": "tier_1"},
        {"id": "FDR-MUM-33", "name": "Kurla Central Feeder", "sub": "SUB-KURLA", "cap": 20.0, "cust": 9400, "tier": "tier_2"},
        {"id": "FDR-MUM-44", "name": "Colaba Port Feeder", "sub": "SUB-COLABA", "cap": 18.0, "cust": 7200, "tier": "tier_2"},
        {"id": "FDR-MUM-55", "name": "Thane Industrial Feeder", "sub": "SUB-THANE", "cap": 35.0, "cust": 14100, "tier": "tier_3"},
    ]

    feeders: List[Feeder] = []
    for f in feeders_meta:
        feeders.append(
            Feeder(
                feeder_id=f["id"],
                alias=get_primary_feeder_alias(f["id"]),
                canonical_id=f["id"],
                feeder_name=f["name"],
                substation_id=f["sub"],
                nominal_capacity_mva=f["cap"],
                current_load_mva=round(f["cap"] * rng.uniform(0.55, 0.78), 2),
                customer_count=f["cust"],
                criticality_tier=f["tier"],  # type: ignore
            )
        )

    # 2. 50 Transformers across these 5 feeders (10 per feeder)
    assets: List[Asset] = []
    telemetry_list: List[TelemetryIngestPayload] = []

    # Benchmark test assets:
    # TX-MUM-1042: High risk critical transformer on FDR-MUM-22
    # TX-MUM-1015: Degraded sensor asset on FDR-MUM-11 (sensor_health = 0.52)
    # TX-MUM-1028: Stale telemetry asset on FDR-MUM-33 (observed 1 hour ago)

    base_lat = 19.0760
    base_lng = 72.8777

    for i in range(1, 51):
        feeder_idx = (i - 1) // 10
        target_feeder = feeders[feeder_idx]
        asset_id = f"TX-MUM-{1000 + i}"

        # Default normal attributes
        capacity = rng.choice([500.0, 750.0, 1000.0, 1500.0])
        age = round(rng.uniform(3.0, 22.0), 1)
        cust_count = int(capacity * rng.uniform(1.2, 2.1))
        overdue_days = 0 if rng.random() > 0.3 else rng.randint(5, 60)
        criticality = rng.choice(["tier_1", "tier_2", "tier_3"])

        # Default telemetry values
        load_factor = round(rng.uniform(0.42, 0.74), 2)
        ambient_temp = round(rng.uniform(28.0, 35.0), 1)
        winding_temp = round(ambient_temp + (load_factor * 35.0) + rng.uniform(5.0, 15.0), 1)
        oil_temp = round(winding_temp - rng.uniform(10.0, 18.0), 1)
        voltage_var = round(rng.uniform(0.01, 0.05), 3)
        current_var = round(rng.uniform(0.02, 0.06), 3)
        power_fact = round(rng.uniform(0.88, 0.98), 2)
        vibration = round(rng.uniform(0.5, 2.0), 2)
        sensor_health = round(rng.uniform(0.92, 0.99), 2)
        observed_time = now - timedelta(seconds=rng.randint(5, 60))

        # Specialized profiles:
        feeder_id = target_feeder.feeder_id
        if asset_id == "TX-MUM-1042":
            # Critical asset from Dossier
            feeder_id = "FDR-MUM-22"
            criticality = "tier_1"
            capacity = 1000.0
            age = 18.5
            cust_count = 1840
            overdue_days = 45
            load_factor = 0.91
            ambient_temp = 34.2
            winding_temp = 108.4
            oil_temp = 92.1
            voltage_var = 0.08
            current_var = 0.13
            power_fact = 0.82
            vibration = 4.8
            sensor_health = 0.97
            observed_time = now - timedelta(seconds=12)

        elif asset_id == "TX-MUM-1015":
            # Degraded sensor asset (tests fallback on sensor_health < 0.75)
            sensor_health = 0.52

        elif asset_id == "TX-MUM-1028":
            # Stale sensor asset (observed 3600 seconds ago, tests fallback on freshness)
            observed_time = now - timedelta(minutes=45)

        asset = Asset(
            asset_id=asset_id,
            alias=get_primary_asset_alias(asset_id),
            canonical_id=asset_id,
            asset_type="transformer",
            feeder_id=feeder_id,
            location=AssetLocation(
                substation=target_feeder.substation_id,
                lat=round(base_lat + rng.uniform(-0.08, 0.08), 4),
                lng=round(base_lng + rng.uniform(-0.08, 0.08), 4),
            ),
            rated_capacity_kva=capacity,
            age_years=age,
            criticality_class=criticality,  # type: ignore
            connected_customers=cust_count,
            last_maintenance_date=(now - timedelta(days=overdue_days + 180)).strftime("%Y-%m-%d"),
            maintenance_overdue_days=overdue_days,
        )
        assets.append(asset)

        telemetry = TelemetryIngestPayload(
            asset_id=asset_id,
            observations=TelemetryObservation(
                load_factor=load_factor,
                winding_temperature_c=winding_temp,
                ambient_temperature_c=ambient_temp,
                oil_temperature_c=oil_temp,
                voltage_variance=voltage_var,
                current_variance=current_var,
                power_factor=power_fact,
                vibration_g=vibration,
            ),
            sensor_health=sensor_health,
            observed_at=observed_time,
        )
        telemetry_list.append(telemetry)

    return feeders, assets, telemetry_list


def populate_synthetic_grid(
    asset_repo: BaseAssetRepository,
    feeder_repo: BaseFeederRepository,
    telemetry_service: TelemetryService,
    seed: int = 42,
) -> None:
    """Populates repositories with the synthetic distribution network."""
    # Register Western utility aliases on repositories
    for alias, can_id in WESTERN_TO_MUMBAI_FEEDER_MAP.items():
        feeder_repo.register_alias(alias, can_id)

    for alias, can_id in WESTERN_TO_MUMBAI_ASSET_MAP.items():
        asset_repo.register_alias(alias, can_id)

    feeders, assets, telemetry_list = generate_synthetic_grid(seed=seed)

    for f in feeders:
        feeder_repo.save(f)

    for a in assets:
        asset_repo.save(a)

    for t in telemetry_list:
        telemetry_service.ingest(t)
