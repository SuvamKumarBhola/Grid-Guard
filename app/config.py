from functools import lru_cache
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """GridGuard runtime configuration loaded from environment variables."""

    # Environment & Server
    env: Literal["development", "staging", "production", "test"] = Field(
        default="development", alias="GRIDGUARD_ENV"
    )
    debug: bool = Field(default=False, alias="GRIDGUARD_DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", alias="GRIDGUARD_API_V1_PREFIX")
    host: str = Field(default="0.0.0.0", alias="GRIDGUARD_HOST")
    port: int = Field(default=8000, alias="GRIDGUARD_PORT")

    # Model Integration
    model_mode: Literal["stub", "artifact", "fallback"] = Field(
        default="stub", alias="GRIDGUARD_MODEL_MODE"
    )
    model_dir: str = Field(
        default="model_artifacts/registered/gridguard-risk-0.1.0",
        alias="GRIDGUARD_MODEL_DIR",
    )
    require_approved_model: bool = Field(
        default=False, alias="GRIDGUARD_REQUIRE_APPROVED_MODEL"
    )
    enable_checksum_validation: bool = Field(
        default=False, alias="GRIDGUARD_ENABLE_CHECKSUM_VALIDATION"
    )

    # Safety Policy & Fallback Thresholds
    min_sensor_health: float = Field(
        default=0.75, alias="GRIDGUARD_MIN_SENSOR_HEALTH"
    )
    feature_freshness_max_seconds: float = Field(
        default=300.0, alias="GRIDGUARD_FEATURE_FRESHNESS_MAX_SECONDS"
    )
    max_inference_latency_ms: float = Field(
        default=900.0, alias="GRIDGUARD_MAX_INFERENCE_LATENCY_MS"
    )
    drift_threshold: float = Field(
        default=0.35, alias="GRIDGUARD_DRIFT_THRESHOLD"
    )
    min_confidence_threshold: float = Field(
        default=0.60, alias="GRIDGUARD_MIN_CONFIDENCE_THRESHOLD"
    )
    inference_timeout_seconds: float = Field(
        default=1.0, alias="GRIDGUARD_INFERENCE_TIMEOUT_SECONDS"
    )

    # Authentication & Security
    auth_mode: Literal["development", "oidc"] = Field(
        default="development", alias="GRIDGUARD_AUTH_MODE"
    )
    auth_secret: str = Field(
        default="dev-secret-key-change-in-production-32b",
        alias="GRIDGUARD_AUTH_SECRET",
    )
    oidc_issuer: str = Field(
        default="https://auth.gridguard.internal/realms/gridguard",
        alias="GRIDGUARD_OIDC_ISSUER",
    )
    oidc_audience: str = Field(
        default="gridguard-api", alias="GRIDGUARD_OIDC_AUDIENCE"
    )

    # Logging & Observability
    log_level: str = Field(default="INFO", alias="GRIDGUARD_LOG_LEVEL")
    log_format: str = Field(default="json", alias="GRIDGUARD_LOG_FORMAT")

    # Storage
    storage_backend: Literal["memory", "sqlite"] = Field(
        default="memory", alias="GRIDGUARD_STORAGE_BACKEND"
    )
    storage_sqlite_path: str = Field(
        default="./data/gridguard.db", alias="GRIDGUARD_STORAGE_SQLITE_PATH"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Returns cached settings instance."""
    return Settings()
