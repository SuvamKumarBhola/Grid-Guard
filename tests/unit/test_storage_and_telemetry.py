import pytest
from datetime import datetime, timezone, timedelta

from app.domain.models import (
    Asset,
    AssetLocation,
    Feeder,
    TelemetryObservation,
    TelemetryIngestPayload,
)
from app.repositories.memory import (
    InMemoryAssetRepository,
    InMemoryFeederRepository,
    InMemoryTelemetryRepository,
    InMemoryAlertRepository,
)
from app.services.telemetry_service import TelemetryService
from app.services.synthetic_generator import generate_synthetic_grid, populate_synthetic_grid


@pytest.fixture
def repos():
    asset_repo = InMemoryAssetRepository()
    feeder_repo = InMemoryFeederRepository()
    telemetry_repo = InMemoryTelemetryRepository()
    alert_repo = InMemoryAlertRepository()
    telemetry_service = TelemetryService(
        telemetry_repo=telemetry_repo,
        asset_repo=asset_repo,
        alert_repo=alert_repo,
    )
    return asset_repo, feeder_repo, telemetry_repo, alert_repo, telemetry_service


def test_synthetic_telemetry_reproducibility():
    f1, a1, t1 = generate_synthetic_grid(seed=123)
    f2, a2, t2 = generate_synthetic_grid(seed=123)

    assert len(f1) == 5
    assert len(a1) == 50
    assert len(t1) == 50
    assert a1[0].asset_id == a2[0].asset_id
    assert t1[0].observations.winding_temperature_c == t2[0].observations.winding_temperature_c


def test_asset_creation_and_retrieval(repos):
    asset_repo, feeder_repo, telemetry_repo, alert_repo, telemetry_service = repos

    populate_synthetic_grid(asset_repo, feeder_repo, telemetry_service)

    # Verify asset lookup
    tx = asset_repo.get("TX-MUM-1042")
    assert tx is not None
    assert tx.feeder_id == "FDR-MUM-22"
    assert tx.criticality_class == "tier_1"

    # Verify feeder lookup
    feeder = feeder_repo.get("FDR-MUM-22")
    assert feeder is not None
    assert feeder.feeder_name == "Andheri East Feeder"

    # Verify feeder asset filtering
    feeder_assets = asset_repo.list(feeder_id="FDR-MUM-22")
    assert len(feeder_assets) == 11


def test_telemetry_ingestion_and_quality(repos):
    asset_repo, feeder_repo, telemetry_repo, alert_repo, telemetry_service = repos

    obs = TelemetryObservation(
        load_factor=0.85,
        winding_temperature_c=85.0,
        ambient_temperature_c=32.0,
        voltage_variance=0.03,
        current_variance=0.04,
        power_factor=0.92,
    )
    payload = TelemetryIngestPayload(
        asset_id="TX-TEST-001",
        observations=obs,
        sensor_health=0.95,
        observed_at=datetime.now(timezone.utc),
    )

    success, quality = telemetry_service.ingest(payload)
    assert success is True
    assert quality.status == "healthy"
    assert quality.sensor_health == 0.95
    assert len(quality.missing_features) == 2  # oil_temperature_c and vibration_g


def test_telemetry_deduplication(repos):
    asset_repo, feeder_repo, telemetry_repo, alert_repo, telemetry_service = repos

    now = datetime.now(timezone.utc)
    obs = TelemetryObservation(
        load_factor=0.7,
        winding_temperature_c=65.0,
        ambient_temperature_c=30.0,
        voltage_variance=0.02,
        current_variance=0.03,
        power_factor=0.95,
    )
    payload = TelemetryIngestPayload(
        asset_id="TX-TEST-002",
        observations=obs,
        sensor_health=0.98,
        observed_at=now,
    )

    # First ingestion succeeds
    success1, q1 = telemetry_service.ingest(payload)
    assert success1 is True
    assert q1.duplicate_detected is False

    # Second ingestion with identical asset_id and observed_at is deduplicated
    success2, q2 = telemetry_service.ingest(payload)
    assert success2 is False
    assert q2.duplicate_detected is True


def test_stale_telemetry_detection(repos):
    asset_repo, feeder_repo, telemetry_repo, alert_repo, telemetry_service = repos

    # 10 minutes old observation (freshness max is 300s = 5m)
    stale_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    obs = TelemetryObservation(
        load_factor=0.6,
        winding_temperature_c=60.0,
        ambient_temperature_c=28.0,
        voltage_variance=0.02,
        current_variance=0.02,
        power_factor=0.96,
    )
    payload = TelemetryIngestPayload(
        asset_id="TX-TEST-003",
        observations=obs,
        sensor_health=0.95,
        observed_at=stale_time,
    )

    success, quality = telemetry_service.ingest(payload)
    assert success is True
    assert quality.freshness_seconds >= 600.0
    assert quality.status in ["degraded", "critical"]


def test_out_of_range_and_degraded_sensor_health(repos):
    asset_repo, feeder_repo, telemetry_repo, alert_repo, telemetry_service = repos

    obs = TelemetryObservation(
        load_factor=2.8,  # out of physical range (0.0 - 2.5)
        winding_temperature_c=175.0,  # out of physical range (-20 to 160)
        ambient_temperature_c=30.0,
        voltage_variance=0.02,
        current_variance=0.02,
        power_factor=0.95,
    )
    payload = TelemetryIngestPayload(
        asset_id="TX-TEST-004",
        observations=obs,
        sensor_health=0.50,  # Below threshold 0.75
        observed_at=datetime.now(timezone.utc),
    )

    success, quality = telemetry_service.ingest(payload)
    assert success is True
    assert quality.sensor_health == 0.50
    assert len(quality.range_violations) >= 2
    assert quality.status in ["degraded", "critical"]

    # Verify alert was created
    alerts = alert_repo.list()
    assert any(a.asset_id == "TX-TEST-004" and a.alert_type == "sensor_failure" for a in alerts)
