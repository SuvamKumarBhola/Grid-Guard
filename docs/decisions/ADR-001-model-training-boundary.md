# ADR-001: Model Training Boundary and Artifact Handoff

## Status
Accepted

## Context
In production AI engineering for safety-critical infrastructure, local development environments must not execute ad-hoc, untracked model training. The project specification strictly mandates that models are trained externally (on Kaggle) and handed off via a formal artifact contract.

## Decision
1. Local development and runtime containers will never execute training scripts.
2. A strict directory-based model artifact handoff contract (`manifest.json`, `feature_schema.json`, `threshold_config.json`, `metrics.json`, `checksums.sha256`) is enforced.
3. The runtime supports three explicit modes: `stub`, `artifact`, and `fallback`.

## Consequences
- Clean separation between offline data science workflows and online reliability engineering.
- Immediate predictability and fast test execution across local and CI environments.
