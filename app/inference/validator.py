import os
import json
import hashlib
from typing import Dict, Any, Tuple, Optional
from app.domain.models import ModelManifest


class ArtifactValidationError(Exception):
    """Raised when a model artifact bundle fails validation."""
    pass


class ModelArtifactValidator:
    """Validates registered model artifact directory against the strict contract."""

    REQUIRED_FILES = [
        "manifest.json",
        "feature_schema.json",
        "threshold_config.json",
        "metrics.json",
    ]

    SUPPORTED_FORMATS = ["onnx", "bin", "pkl", "stub"]

    def __init__(
        self,
        require_approved: bool = False,
        validate_checksum: bool = False,
    ):
        self.require_approved = require_approved
        self.validate_checksum = validate_checksum

    def validate_directory(self, model_dir: str) -> Tuple[bool, ModelManifest, Dict[str, Any]]:
        if not os.path.isdir(model_dir):
            raise ArtifactValidationError(f"Model directory does not exist: {model_dir}")

        # Check required files
        for req_file in self.REQUIRED_FILES:
            file_path = os.path.join(model_dir, req_file)
            if not os.path.isfile(file_path):
                raise ArtifactValidationError(
                    f"Required artifact file missing: '{req_file}' in {model_dir}"
                )

        # 1. Parse manifest.json
        manifest_path = os.path.join(model_dir, "manifest.json")
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
            manifest = ModelManifest.model_validate(manifest_data)
        except Exception as e:
            raise ArtifactValidationError(f"Invalid manifest.json: {str(e)}")

        # 2. Check format
        if manifest.artifact_format not in self.SUPPORTED_FORMATS:
            raise ArtifactValidationError(
                f"Unsupported artifact format '{manifest.artifact_format}'. "
                f"Expected one of {self.SUPPORTED_FORMATS}"
            )

        # 3. Check approval status if enforced
        if self.require_approved and manifest.approval_status != "approved":
            raise ArtifactValidationError(
                f"Model approval status '{manifest.approval_status}' is not 'approved' as required."
            )

        # 4. Check model binary file exists
        model_filename = f"model.{manifest.artifact_format}"
        model_path = os.path.join(model_dir, model_filename)
        # Also check alternative standard extensions if stub/bin
        if not os.path.isfile(model_path):
            alt_candidates = [
                os.path.join(model_dir, alt)
                for alt in ["model.bin", "model.pkl", "model.onnx", "model.json"]
            ]
            if not any(os.path.isfile(p) for p in alt_candidates):
                raise ArtifactValidationError(
                    f"Model binary not found in {model_dir} (expected {model_filename})"
                )

        # 5. Checksum validation if enforced
        if self.validate_checksum and manifest.sha256 != "replace-with-real-checksum":
            actual_hash = self.compute_sha256(model_path)
            if actual_hash != manifest.sha256:
                raise ArtifactValidationError(
                    f"SHA-256 checksum mismatch for {model_filename}. "
                    f"Expected {manifest.sha256}, got {actual_hash}"
                )

        # 6. Parse threshold config
        threshold_path = os.path.join(model_dir, "threshold_config.json")
        with open(threshold_path, "r", encoding="utf-8") as f:
            threshold_config = json.load(f)

        return True, manifest, threshold_config

    @staticmethod
    def compute_sha256(filepath: str) -> str:
        sha256 = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()
