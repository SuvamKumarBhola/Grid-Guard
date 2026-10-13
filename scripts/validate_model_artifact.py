#!/usr/bin/env python3
"""
CLI tool to validate a model artifact bundle against the GridGuard Model Artifact Contract.
"""
import sys
import argparse
from app.inference.validator import ModelArtifactValidator, ArtifactValidationError


def main():
    parser = argparse.ArgumentParser(description="Validate a GridGuard model artifact directory.")
    parser.add_argument("--dir", required=True, help="Path to the model artifact directory")
    parser.add_argument(
        "--require-approved",
        action="store_true",
        help="Enforce that manifest approval_status is 'approved'",
    )
    parser.add_argument(
        "--verify-checksum",
        action="store_true",
        help="Enforce SHA-256 checksum verification",
    )
    args = parser.parse_args()

    validator = ModelArtifactValidator(
        require_approved=args.require_approved,
        validate_checksum=args.verify_checksum,
    )

    try:
        is_valid, manifest, thresholds = validator.validate_directory(args.dir)
        print(f"SUCCESS: Model artifact bundle at '{args.dir}' is valid.")
        print(f"Model Name:       {manifest.model_name}")
        print(f"Version:          {manifest.model_version}")
        print(f"Format:           {manifest.artifact_format}")
        print(f"Framework:        {manifest.framework}")
        print(f"Approval Status:  {manifest.approval_status}")
        print(f"Critical Recall:  {manifest.metrics.critical_recall}")
        print(f"Calibration Err:  {manifest.metrics.calibration_error}")
        sys.exit(0)
    except ArtifactValidationError as exc:
        print(f"VALIDATION FAILED: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
