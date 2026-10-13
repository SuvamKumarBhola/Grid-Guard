# GridGuard — Production Operations Runbook

## Incident Playbooks

### Playbook 1: Spike in Fallback Rate (> 15%)
**Symptom:** Metric `fallback_rate` exceeds 0.15, or operator console displays elevated safety fallback badges.

**Diagnosis Steps:**
1. Check `/api/v1/alerts` for active `sensor_failure` or `api_slo_breach` alerts.
2. Check `data_freshness_violations` in `/api/v1/metrics`. If high, telemetry gateway or substation cellular uplinks may be delayed.
3. Inspect `/api/v1/audit` for `route_reason` entries on recent predictions.
4. Verify whether primary model artifact is loaded and healthy via `/api/v1/model`.

**Mitigation:**
- If telemetry is stale, contact Substation SCADA engineering.
- If primary model has crashed or corrupted, set `GRIDGUARD_MODEL_MODE=fallback` to maintain deterministic conservative safety while investigating.

---

### Playbook 2: Latency SLA Breach (p95 > 150 ms)
**Symptom:** `api_slo_breach` alert triggered; p95 latency exceeds 150 ms.

**Diagnosis Steps:**
1. Inspect container CPU/memory utilization (`kubectl top pods -n gridguard`).
2. Verify HPA autoscaling status (`kubectl get hpa -n gridguard`).

**Mitigation:**
- Scale deployment replicas manually if HPA is lagging:
  ```bash
  kubectl scale deployment/gridguard-api --replicas=5 -n gridguard
  ```

---

### Playbook 3: Model Ingestion / Rollback
**Symptom:** Newly registered model exhibits poor calibration or false positive surge.

**Mitigation:**
1. Switch `GRIDGUARD_MODEL_DIR` back to previous version or set `GRIDGUARD_MODEL_MODE=stub`.
2. Restart pods or trigger rolling restart:
   ```bash
   kubectl rollout restart deployment/gridguard-api -n gridguard
   ```
