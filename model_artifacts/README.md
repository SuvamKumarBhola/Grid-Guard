# Model Artifacts Directory

This directory stores model artifacts used by GridGuard.

## Subdirectories
- `registered/`: Validated model bundles ready for serving by `ArtifactModelProvider`.
- `incoming/`: Staging directory for newly uploaded or unvalidated model bundles from Kaggle.
- `archived/`: Deprecated or rolled-back model versions retained for auditability and replay.
- `development/`: Local development notes and stub specifications.

## Strict Rules
- **DO NOT** execute local training scripts in this directory or project.
- Always use `scripts/validate_model_artifact.py` before promoting an incoming artifact.
- Use `scripts/register_model.py` to register validated bundles into `registered/`.
