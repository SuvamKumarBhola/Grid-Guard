#!/usr/bin/env python3
"""
CLI tool to register a validated model bundle into the GridGuard registered artifacts directory.
"""
import os
import sys
import shutil
import argparse
import hashlib
from app.inference.validator import ModelArtifactValidator, ArtifactValidationError


def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description="Register a model artifact bundle into GridGuard.")
    parser.add_argument("--source-dir", required=True, help="Path to the source artifact directory")
    parser.add_argument("--target-base-dir", default="model_artifacts/registered", help="Base registered directory")
    parser.add_argument("--version", help="Override or specify model version")
    parser.add_argument("--approve", action="store_true", help="Set approval_status to 'approved' if candidate")
    args = parser.parse_args()

    validator = ModelArtifactValidator(require_approved=False, validate_checksum=False)
    try:
        _, manifest, _ = validator.validate_directory(args.source_dir)
    except ArtifactValidationError as exc:
        print(f"ERROR: Cannot register invalid source bundle: {exc}", file=sys.stderr)
        sys.exit(1)

    version = args.version or manifest.model_version
    target_dir = os.path.join(args.target_base_dir, f"{manifest.model_name}-{version}")

    os.makedirs(target_dir, exist_ok=True)
    print(f"Registering model '{manifest.model_name}' version '{version}' to '{target_dir}'...")

    # Copy all files
    for item in os.listdir(args.source_dir):
        s = os.path.join(args.source_dir, item)
        d = os.path.join(target_dir, item)
        if os.path.isfile(s):
            shutil.copy2(s, d)

    # Compute checksums.sha256
    checksums_path = os.path.join(target_dir, "checksums.sha256")
    with open(checksums_path, "w", encoding="utf-8") as out_f:
        for fname in sorted(os.listdir(target_dir)):
            if fname == "checksums.sha256":
                continue
            fpath = os.path.join(target_dir, fname)
            if os.path.isfile(fpath):
                fhash = compute_sha256(fpath)
                out_f.write(f"{fhash}  {fname}\n")

    print(f"SUCCESS: Model registered successfully at '{target_dir}'.")


if __name__ == "__main__":
    main()
