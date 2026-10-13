import logging
from typing import Optional
from app.config import Settings, get_settings
from app.inference.base import ModelProvider
from app.inference.stub import StubModelProvider
from app.inference.artifact import ArtifactModelProvider
from app.inference.fallback import SafetyFallbackProvider
from app.inference.validator import ArtifactValidationError

logger = logging.getLogger("gridguard.inference")


class ModelProviderResolver:
    """Configuration-driven factory and health resolver for ModelProvider implementations."""

    @classmethod
    def resolve(cls, settings: Optional[Settings] = None) -> ModelProvider:
        cfg = settings or get_settings()
        mode = cfg.model_mode.lower()

        if mode == "stub":
            logger.info("Initializing StubModelProvider (mode=stub)")
            return StubModelProvider()

        elif mode == "artifact":
            logger.info(f"Initializing ArtifactModelProvider from {cfg.model_dir}")
            try:
                return ArtifactModelProvider(
                    model_dir=cfg.model_dir,
                    require_approved=cfg.require_approved_model,
                    validate_checksum=cfg.enable_checksum_validation,
                    timeout_seconds=cfg.inference_timeout_seconds,
                )
            except (ArtifactValidationError, Exception) as exc:
                logger.error(
                    f"Failed to load artifact model from '{cfg.model_dir}': {exc}. "
                    f"Gracefully activating SafetyFallbackProvider."
                )
                return SafetyFallbackProvider(
                    reason=f"Primary artifact model load failure: {exc}"
                )

        elif mode == "fallback":
            logger.warning("Initializing explicit SafetyFallbackProvider (mode=fallback)")
            return SafetyFallbackProvider(reason="Configured manual fallback mode")

        else:
            logger.warning(f"Unknown mode '{mode}'. Defaulting to StubModelProvider.")
            return StubModelProvider()
