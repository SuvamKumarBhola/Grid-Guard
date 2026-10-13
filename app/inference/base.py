from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.domain.models import (
    Asset,
    FeatureVector,
    DataQualityReport,
    RiskPrediction,
)


class ModelProvider(ABC):
    """Abstract interface for all model providers (stub, artifact, fallback)."""

    @abstractmethod
    def predict(
        self,
        features: FeatureVector,
        asset: Asset,
        data_quality: DataQualityReport,
        request_id: Optional[str] = None,
    ) -> RiskPrediction:
        """Executes inference and returns a validated RiskPrediction."""
        pass

    @abstractmethod
    def get_model_metadata(self) -> Dict[str, Any]:
        """Returns model version, framework, metrics, and mode."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Returns true if the provider is healthy and ready to serve."""
        pass
