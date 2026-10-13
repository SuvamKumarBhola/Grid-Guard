# GridGuard — Security & Governance Architecture

## 1. Authentication & RBAC Model

GridGuard implements role-based access control (RBAC) across five specialized operational personas:

| Role | Permitted Capabilities |
| :--- | :--- |
| **Operator** | View assets, acknowledge alerts, execute counterfactual simulations, score risk |
| **Planner** | Create maintenance recommendations, export reliability reports |
| **Reliability Manager** | Approve candidate models, adjust safety policy thresholds |
| **Administrator** | Manage identity connectors, secret rotation, system policies |
| **Auditor** | Read-only inspection of immutable audit trail and decision logs |

---

## 2. Secrets & Configuration Governance
- Zero secrets committed to source control (enforced via `.gitignore`).
- In production, authentication secrets are mounted as Kubernetes Secrets (`gridguard-secrets`).
- Structured JSON logging strips authorization headers and tokens.

---

## 3. Input Validation & Defense-in-Depth
- Strict Pydantic v2 domain schemas reject out-of-range physical values (e.g. negative capacity, impossible temperatures).
- Rate-limiting headers and SHA-256 event deduplication protect ingestion gateways.
- Contractual security headers (`nosniff`, `DENY`, HSTS) applied on all HTTP responses.
