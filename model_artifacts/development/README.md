# Development Artifact Notes

The GridGuard runtime runs in `GRIDGUARD_MODEL_MODE=stub` by default.
In this mode, `StubModelProvider` is used for deterministic, fast local development and CI testing.
No model training is performed locally.
