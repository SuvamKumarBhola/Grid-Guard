# GridGuard — Master Agent Prompt

Copy and paste the prompt below into the coding agent that will implement the project.

---

## MASTER PROMPT START

You are the lead software architect, ML platform engineer, backend developer, DevOps engineer, QA engineer, and technical project manager responsible for completing the **GridGuard** project.

Your goal is to build a believable, production-oriented AI engineering and MLOps system for the hackathon problem statement:

> **AI in Production — Building & Scaling Real-World Intelligent Software Systems**
>
> Design and build an end-to-end software solution that takes an AI/ML capability from a working model to a production-grade application exposed through clean APIs, deployed on cloud infrastructure, and engineered to be reliable, observable, secure, scalable, and capable of graceful fallback.

The project is:

> **GridGuard — Autonomous Reliability Intelligence for Power Distribution Networks**

GridGuard predicts transformer and feeder failure risk, explains the reasons behind each prediction, detects abnormal behavior, simulates load-redistribution scenarios, monitors production health, and falls back safely when the primary model or data pipeline is degraded.

The system is an **operator-assistance platform**. It must never directly control breakers, change protection settings, or perform physical grid operations. Human operators remain responsible for approving operational actions.

---

# 1. Non-negotiable instructions

## 1.1 Do not train models on the development system

Do **not** train, fine-tune, or download large training datasets on the local development system.

The model-training process will be executed separately by the project owner on Kaggle. Your responsibility is to build the complete implementation needed to integrate trained model artifacts into the application.

You must:

- Create the complete model integration code.
- Create the expected model artifact directory structure.
- Create model-loading, validation, versioning, and inference code.
- Create model metadata schemas.
- Create inference tests using mocks, fixtures, or a small deterministic development substitute.
- Create a clear artifact handoff contract for Kaggle-trained models.
- Create a model import or registration script that accepts trained artifacts later.
- Create a sample placeholder model only if required for local execution.
- Keep placeholder artifacts small and clearly label them as development-only.
- Never silently train a replacement model locally.
- Never make the application depend on a model-training command during startup.

If a real trained model artifact is missing, the application must still run by using one of these clearly identified modes:

1. **Development stub mode** — deterministic and small, for local development.
2. **Rules-based safety fallback mode** — conservative and explainable.
3. **Production model mode** — activated only when the project owner supplies the Kaggle-trained artifact.

The runtime must expose which mode is active.

## 1.2 Implement phase by phase

Implement the project in the exact phases defined in this prompt.

Do not jump directly to a polished frontend.

Do not combine all requirements into one large implementation batch.

At the end of every phase:

- Run the relevant tests.
- Verify that the application still starts.
- Update documentation.
- Record completed work and known limitations.
- Do not start the next phase until the current phase is stable.

Use small, reviewable commits or clearly separated implementation checkpoints.

## 1.3 Keep the initial UI minimal

The first phases must prioritize the backend, model integration, APIs, infrastructure, reliability, observability, and tests.

During the initial phases, create only a minimal interface necessary to:

- Confirm that the backend is working.
- View a small list of assets.
- Submit a risk request.
- See prediction output.
- See health and metrics.

Do not spend significant time on visual polish, animations, advanced navigation, maps, dashboards, or responsive design until the final UI/UX phase.

The final UI/UX phase may improve the interface after all backend and production requirements are working.

## 1.4 Do not invent production claims

Do not claim that the system has achieved real-world accuracy, availability, or scale unless it has actually been measured.

Clearly distinguish:

- Implemented functionality.
- Simulated behavior.
- Development stub behavior.
- Expected production behavior.
- Future integration work.

## 1.5 Preserve safety boundaries

GridGuard must remain an advisory system.

Never implement direct control commands for:

- Circuit breakers.
- Substation protection settings.
- Feeder switching.
- Transformer shutdown.
- Automatic load shedding.

The counterfactual simulator may recommend an action but must never execute it.

---

# 2. Project outcome

Build a production-oriented platform that accepts power-grid asset observations and returns:

- Failure-risk score.
- Severity band.
- Predicted failure window.
- Confidence or uncertainty.
- Model version.
- Runtime model mode.
- Model route or fallback route.
- Contributing factors.
- Data-quality status.
- Recommended operator action.
- Audit identifier.

The system must also provide:

- Asset registry.
- Telemetry ingestion.
- Feature preparation.
- Model inference integration.
- Anomaly detection integration.
- Safety fallback.
- Counterfactual load-redistribution simulation.
- Versioned APIs.
- Health checks.
- Metrics.
- Logging.
- Alerting hooks.
- CI/CD.
- Containerization.
- Cloud deployment manifests.
- Security controls.
- Minimal initial interface.
- Final polished UI/UX.

---

# 3. Recommended repository structure

Create or preserve a clear structure similar to this:

```text
gridguard/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── Makefile
├── pyproject.toml
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── model-artifact-contract.md
│   ├── deployment.md
│   ├── runbook.md
│   ├── security.md
│   └── decisions/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── logging_config.py
│   ├── api/
│   ├── domain/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── inference/
│   ├── fallback/
│   ├── monitoring/
│   └── security/
├── model_artifacts/
│   ├── README.md
│   ├── manifest.schema.json
│   ├── development/
│   │   └── README.md
│   ├── incoming/
│   │   └── .gitkeep
│   ├── registered/
│   │   └── .gitkeep
│   └── archived/
│       └── .gitkeep
├── scripts/
│   ├── validate_model_artifact.py
│   ├── register_model.py
│   ├── generate_demo_telemetry.py
│   └── run_load_test.py
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── failure_injection/
│   └── fixtures/
├── deployment/
│   ├── docker/
│   ├── kubernetes/
│   └── observability/
├── frontend/
│   └── minimal-then-polished-ui/
└── .github/
    └── workflows/
```

Adapt this structure to the existing repository if one already exists. Do not unnecessarily rewrite a working project.

---

# 4. Model artifact handoff contract

Create `docs/model-artifact-contract.md` and implement the contract before building the model-serving integration.

The model owner will train models on Kaggle and provide artifacts later.

The runtime must support a registered model directory with this structure:

```text
model_artifacts/registered/gridguard-risk-0.1.0/
├── model.bin or model.pkl or model.onnx
├── manifest.json
├── feature_schema.json
├── threshold_config.json
├── metrics.json
├── explainability.json
└── checksums.sha256
```

The `manifest.json` must contain at least:

```json
{
  "model_name": "gridguard-risk",
  "model_version": "0.1.0",
  "artifact_format": "onnx",
  "created_at": "2026-10-13T00:00:00Z",
  "framework": "onnxruntime",
  "input_schema_version": "features-v1",
  "output_schema_version": "risk-v1",
  "training_dataset_reference": "kaggle://owner/dataset/version",
  "metrics": {
    "critical_recall": 0.0,
    "calibration_error": 0.0,
    "validation_samples": 0
  },
  "approval_status": "candidate",
  "sha256": "replace-with-real-checksum"
}
```

Implement these checks:

- Manifest exists.
- Required fields exist.
- Model version is valid.
- Artifact format is supported.
- Feature schema matches runtime features.
- Metrics are present.
- Checksum is valid when checksum enforcement is enabled.
- Approval status is acceptable for the selected environment.
- Model is loadable before it receives traffic.

The application must fail clearly and safely if the artifact is malformed. It must not silently use an incompatible model.

Add environment variables such as:

```text
GRIDGUARD_MODEL_MODE=stub|artifact|fallback
gridguard_MODEL_DIR=model_artifacts/registered/gridguard-risk-0.1.0
GRIDGUARD_REQUIRE_APPROVED_MODEL=false
GRIDGUARD_ENABLE_CHECKSUM_VALIDATION=false
```

Use the project’s naming conventions, but preserve the same meaning.

---

# 5. Required phases

## Phase 0 — Repository inspection and implementation plan

Before writing application code:

1. Inspect the repository.
2. Identify the current language, framework, package manager, entrypoint, and existing tests.
3. Check whether the project already contains a plan or architecture.
4. Reuse existing working infrastructure where appropriate.
5. Write or update `docs/implementation-plan.md`.
6. Create a phase checklist with explicit acceptance criteria.
7. Identify missing dependencies without installing unnecessary packages.

Do not implement the complete project in this phase.

### Phase 0 acceptance criteria

- Repository structure is documented.
- Technology decisions are recorded.
- Model-training boundary is recorded.
- Phase plan is approved internally before implementation continues.

## Phase 1 — Domain model and configuration

Implement the core domain types and configuration.

Create types or schemas for:

- Asset.
- Feeder.
- Telemetry observation.
- Sensor health.
- Data-quality report.
- Feature vector.
- Risk prediction.
- Anomaly result.
- Simulation request.
- Simulation result.
- Alert.
- Audit event.
- Model manifest.

Add configuration for:

- Environment.
- API version.
- Model mode.
- Thresholds.
- Timeouts.
- Feature freshness.
- Logging.
- Authentication mode.
- Database or storage connection.

### Phase 1 acceptance criteria

- Schemas validate correct inputs.
- Invalid inputs produce clear validation errors.
- Configuration loads from environment variables.
- No model training code is introduced.
- Unit tests cover schemas and configuration.

## Phase 2 — Storage, asset registry, and telemetry ingestion

Implement:

- Asset registry repository.
- Feeder repository.
- Telemetry ingestion endpoint or service.
- Synthetic telemetry generator for development.
- Data validation.
- Deduplication.
- Freshness tracking.
- Missingness tracking.
- Range validation.
- Sensor-health calculation.

Use a lightweight local storage option for development and a production-compatible repository abstraction.

Do not hard-code the application to a single database if the existing project already has a persistence layer.

### Phase 2 acceptance criteria

- Synthetic telemetry can be generated reproducibly.
- Asset records can be created and retrieved.
- Telemetry can be ingested and queried.
- Invalid and stale data are identified.
- Tests cover duplicate events, missing fields, stale readings, and out-of-range values.

## Phase 3 — Model integration layer, without training

Implement the model-serving abstraction.

Required components:

- `ModelProvider` interface.
- Development stub provider.
- Artifact provider.
- Safety fallback provider.
- Model manifest loader.
- Artifact validator.
- Model registry adapter.
- Model health checker.
- Model version resolver.
- Inference timeout handling.
- Model output validator.

The runtime must support at least:

1. A small development stub.
2. A trained artifact supplied later by the user.
3. A deterministic fallback.

Do not train a model.

Do not create a training notebook as part of the application runtime.

You may create a separate `docs/kaggle-training-handoff.md` explaining the expected Kaggle output, but the implementation agent must not execute training locally.

### Phase 3 acceptance criteria

- The application starts without a trained model by using stub mode.
- Artifact mode loads a valid externally supplied artifact.
- Invalid artifacts are rejected with actionable errors.
- Provider selection is configuration-driven.
- Model output is validated against the response schema.
- Model version and runtime mode are included in every prediction.
- Tests cover successful loading, invalid manifest, missing artifact, timeout, malformed output, and fallback.

## Phase 4 — Risk prediction and anomaly detection APIs

Implement the versioned backend APIs.

At minimum:

```text
POST /api/v1/assets/{asset_id}/risk
POST /api/v1/telemetry/ingest
POST /api/v1/anomalies/detect
GET  /api/v1/assets
GET  /api/v1/assets/{asset_id}
GET  /api/v1/health
GET  /api/v1/ready
GET  /api/v1/metrics
GET  /api/v1/model
```

Risk responses must include:

- Asset ID.
- Risk score.
- Severity.
- Failure window.
- Confidence.
- Model version.
- Runtime mode.
- Route.
- Contributing factors.
- Recommended action.
- Data-quality status.
- Request ID.
- Timestamp.

Anomaly responses must include:

- Anomaly status.
- Anomaly type.
- Severity.
- Evidence.
- Detection method.
- Confidence.
- Timestamp.

### Phase 4 acceptance criteria

- APIs have typed request and response schemas.
- APIs return structured errors.
- APIs are documented through OpenAPI or equivalent.
- API versioning is explicit.
- Request IDs are generated and logged.
- Integration tests cover normal, critical, invalid, and degraded requests.

## Phase 5 — Safety router and graceful fallback

Implement the safety policy engine.

The system must route to fallback when:

- Sensor health is below threshold.
- Required telemetry is stale.
- Required features are missing.
- Inference latency exceeds the configured limit.
- The model provider is unavailable.
- Model output fails validation.
- Drift or confidence policy is violated.

The fallback must:

- Return a valid response.
- Identify `route: safety-fallback`.
- Reduce confidence where appropriate.
- Explain which gate caused fallback.
- Recommend a conservative operator action.
- Never hide the degraded state.

### Phase 5 acceptance criteria

- Failure injection activates fallback.
- The API remains available when the primary model is unavailable.
- Fallback behavior is deterministic and tested.
- Fallback rate is measurable.
- Logs distinguish primary, stub, artifact, and fallback inference.

## Phase 6 — Counterfactual load-redistribution simulator

Implement an advisory simulator.

Endpoint:

```text
POST /api/v1/simulations/load-redistribution
```

The simulator must accept:

- Source asset or feeder.
- Target feeder.
- Redistribution percentage.
- Duration.
- Optional scenario assumptions.

It must return:

- Source risk before and after.
- Target overload risk.
- Customers protected estimate.
- Estimated energy loss.
- Constraint violations.
- Confidence.
- Human approval requirement.
- Simulation ID.

The simulator must reject unsafe or impossible scenarios.

It must never execute the scenario.

### Phase 6 acceptance criteria

- A valid scenario reduces source risk when capacity permits.
- An overload scenario is rejected with an explanation.
- Simulation results are auditable.
- The UI/API clearly labels results as advisory.

## Phase 7 — Persistence, auditability, and security

Implement:

- Prediction persistence.
- Simulation persistence.
- Alert persistence.
- Audit events.
- Role-aware access control.
- Authentication abstraction.
- Development authentication mode.
- Production OIDC integration point.
- Secret configuration through environment variables.
- Request validation and rate limiting.
- Security headers.
- Structured logging without secrets.

Record for every prediction:

- Request ID.
- Asset ID.
- Input hash.
- Feature schema version.
- Model version.
- Runtime mode.
- Route.
- Output.
- Explanation.
- Timestamp.
- Operator action if one occurs.

### Phase 7 acceptance criteria

- Audit events are immutable from the application API.
- Unauthenticated protected requests are rejected in production mode.
- Secrets are not committed or logged.
- Roles are enforced for protected operations.
- Security tests cover invalid tokens, privilege violations, malformed input, and log leakage.

## Phase 8 — Observability and production operations

Implement the observability layer.

### System metrics

- Request count.
- Error count.
- p50, p95, and p99 latency.
- Inference latency.
- Queue depth.
- CPU and memory where supported.
- Dependency health.
- Availability.

### ML metrics

- Model route distribution.
- Fallback rate.
- Data freshness violations.
- Missing-feature rate.
- Feature drift index.
- Prediction drift.
- Calibration metrics when labels exist.
- Recall and false-negative rate when labels exist.
- Model version distribution.

### Cost metrics

- Prediction count.
- Estimated cost per 1,000 predictions.
- Model execution time.
- Storage volume where measurable.

Add:

- `/health` for process and basic service status.
- `/ready` for dependency readiness.
- `/metrics` in a machine-readable format.
- Alert definitions or alerting documentation.
- A troubleshooting runbook.

### Phase 8 acceptance criteria

- Metrics are emitted consistently.
- Dashboard or local metrics view displays the main service and model metrics.
- A test can simulate a latency or fallback spike.
- Alerts have severity and response guidance.
- Runbook explains how to investigate model and API degradation.

## Phase 9 — Containerization, CI/CD, and cloud deployment

Implement:

- Dockerfile.
- Local compose or equivalent development orchestration.
- CI workflow.
- Unit tests.
- Integration tests.
- Contract tests.
- Static checks.
- Container build.
- Vulnerability scan hook where practical.
- Kubernetes manifests or cloud deployment configuration.
- ConfigMap/secret separation.
- Readiness and liveness probes.
- Resource requests and limits.
- Horizontal scaling configuration.
- Rolling deployment.
- Model version configuration.
- Rollback documentation.

The CI/CD flow must include:

```text
validate -> test -> build -> artifact validation -> deploy staging -> smoke test
```

If actual cloud credentials are unavailable, create deployment-ready configuration and validate it locally. Clearly document what was and was not deployed.

### Phase 9 acceptance criteria

- Image builds successfully.
- Container starts in stub mode.
- CI runs all required tests.
- Deployment manifests pass syntax or schema validation.
- Health probes are present.
- Model artifact is not baked into source code unless explicitly configured.
- Rollback procedure is documented.

## Phase 10 — Load, resilience, and failure testing

Implement tests or scripts for:

- Concurrent prediction requests.
- Burst telemetry ingestion.
- Model timeout.
- Model process failure.
- Feature store failure.
- Stale telemetry.
- Malformed telemetry.
- Invalid model artifact.
- High fallback rate.
- Dependency recovery.

Measure and report:

- Throughput.
- p95 latency.
- p99 latency.
- Error rate.
- Recovery time.
- Fallback activation.
- Resource use.

Do not invent benchmark values. Record measured values and test conditions.

### Phase 10 acceptance criteria

- Load test can run reproducibly.
- Primary model failure does not make the API unusable.
- The application recovers after dependency restoration.
- Results are written to `docs/performance-results.md`.

## Phase 11 — Minimal initial UI

Only after the backend is stable, build a minimal interface.

The initial UI must include:

- Asset list.
- Severity and risk score.
- Model version and runtime mode.
- Basic asset detail.
- Risk explanation.
- Data-quality state.
- Button or form to run a prediction.
- Basic health and metrics display.
- Clear “advisory only” label.

Keep it simple. Do not prioritize visual polish.

### Phase 11 acceptance criteria

- The UI consumes the real APIs.
- No important values are hard-coded in the UI.
- Loading, empty, error, and degraded states are visible.
- The UI works in stub mode without a production model.
- The UI shows when the safety fallback is active.

## Phase 12 — Final UI/UX and presentation layer

Only after all backend, AI integration, reliability, observability, security, and testing phases are complete, improve the UI/UX.

The final UI may include:

- Risk-ranked asset dashboard.
- Feeder and asset visual context.
- Prediction explanation panel.
- Data-quality indicators.
- Alert center.
- Model health panel.
- Simulation workflow.
- Decision trace.
- Audit timeline.
- Responsive layout.
- Accessible color usage.
- Keyboard navigation.
- Helpful empty and failure states.
- Clear primary actions.

Do not add decorative features that obscure operational information.

The UI must make these states obvious:

- Normal.
- Watch.
- Critical.
- Model degraded.
- Sensor degraded.
- Fallback active.
- Simulation advisory.
- Operator approval required.

### Phase 12 acceptance criteria

- UI is usable at desktop and tablet widths.
- Critical information is visually prioritized.
- Fallback and uncertainty are impossible to miss.
- Accessibility basics are addressed.
- The final UI has no fake production claims or placeholder content presented as real.

---

# 6. API requirements

Use an explicit version prefix, such as `/api/v1`.

At minimum, implement:

```text
POST /api/v1/telemetry/ingest
GET  /api/v1/assets
GET  /api/v1/assets/{asset_id}
POST /api/v1/assets/{asset_id}/risk
POST /api/v1/anomalies/detect
POST /api/v1/simulations/load-redistribution
GET  /api/v1/health
GET  /api/v1/ready
GET  /api/v1/metrics
GET  /api/v1/model
```

Every prediction response must include:

```json
{
  "request_id": "...",
  "asset_id": "...",
  "risk_score": 0.0,
  "severity": "normal|watch|critical",
  "failure_window_hours": {"low": 0, "high": 0},
  "confidence": 0.0,
  "model_version": "...",
  "runtime_mode": "stub|artifact|fallback",
  "route": "champion-model|stub-model|safety-fallback",
  "contributing_factors": [],
  "recommended_action": "...",
  "data_quality": {},
  "created_at": "..."
}
```

Use structured error responses. Never return raw stack traces to clients.

---

# 7. Testing requirements

Create tests at multiple levels.

## Unit tests

Cover:

- Schema validation.
- Feature preparation.
- Risk thresholding.
- Model manifest validation.
- Model provider selection.
- Fallback policy.
- Simulation constraints.
- Explanation generation.

## Integration tests

Cover:

- Telemetry ingestion to prediction.
- API to persistence.
- API to model provider.
- API to fallback provider.
- Audit record creation.

## Contract tests

Cover:

- Request schemas.
- Response schemas.
- Error schemas.
- Backward compatibility.

## Failure-injection tests

Cover:

- Model unavailable.
- Model timeout.
- Feature store unavailable.
- Stale telemetry.
- Invalid artifact.
- High latency.
- Missing feature.

## UI tests

Only after Phase 11:

- API loading state.
- API error state.
- Fallback state.
- Critical risk rendering.
- Simulation advisory label.

Do not mark a phase complete if its acceptance criteria are not evidenced by tests or a documented manual verification.

---

# 8. Documentation requirements

Maintain these documents while implementing:

```text
docs/
├── implementation-plan.md
├── architecture.md
├── api.md
├── model-artifact-contract.md
├── kaggle-training-handoff.md
├── deployment.md
├── observability.md
├── runbook.md
├── security.md
├── performance-results.md
├── limitations.md
└── decisions/
```

The `kaggle-training-handoff.md` document must explain:

- Required feature columns.
- Feature units and ranges.
- Label definition.
- Train/validation/test split expectations.
- Expected output artifact format.
- Manifest format.
- Required evaluation metrics.
- How to copy or register the artifact into the application.
- How to verify that the artifact is compatible.

The owner will train the model on Kaggle. Do not train it locally.

---

# 9. Development workflow

For each phase:

1. Read the current repository state.
2. State the implementation objective internally.
3. Implement only the phase scope.
4. Run formatting, linting, tests, and startup checks.
5. Fix failures before continuing.
6. Update documentation.
7. Record the result in the phase checklist.
8. Continue to the next phase only after acceptance criteria are met.

Prefer:

- Small modules.
- Explicit interfaces.
- Dependency injection.
- Typed schemas.
- Configuration-driven behavior.
- Deterministic fixtures.
- Structured logs.
- Reproducible commands.
- Backward-compatible API evolution.

Avoid:

- Giant files.
- Hidden global state.
- Hard-coded secrets.
- Local model training.
- Fake metrics.
- Hard-coded UI data after APIs exist.
- Direct grid-control functionality.
- Unexplained model outputs.
- Premature visual polish.

---

# 10. Definition of done

The project is complete only when all of the following are true:

- The application starts successfully in development stub mode.
- The application can later load a Kaggle-trained model through the documented artifact contract.
- The system does not train models locally.
- The prediction API is versioned and documented.
- Asset and telemetry data are validated and persisted.
- Risk prediction and anomaly detection are implemented.
- Explanations and confidence are returned.
- Safety fallback works under failure conditions.
- Counterfactual simulation works and remains advisory.
- Audit events are recorded.
- Health and metrics endpoints work.
- Logs are structured and do not leak secrets.
- Security boundaries are documented and tested.
- CI/CD runs tests and builds the application.
- Containerization is complete.
- Deployment manifests or deployment instructions are complete.
- Load and failure testing has measured results.
- The minimal UI uses real APIs.
- The final UI/UX is built only after backend completion.
- Limitations and unimplemented integrations are honestly documented.
- The README provides exact setup and demo commands.
- Every hackathon requirement is mapped to implementation evidence.

At the end, provide:

1. A concise implementation summary.
2. A list of files created or changed.
3. Exact commands to run locally.
4. Exact commands to run tests.
5. Exact commands to start the demo.
6. Model artifact handoff instructions for Kaggle.
7. Test and performance results.
8. Known limitations.
9. Recommended next steps.

Do not claim completion if any required acceptance criterion is missing.

## MASTER PROMPT END
