# GridGuard — Load, Resilience, and Performance Results

**Date of Execution:** 2026-10-13  
**Environment:** Linux (x86_64), Python 3.14 / 3.11  
**Architecture:** In-process ASGI & Async HTTP/2 concurrency  
**Workload Composition:** Concurrent asset risk predictions across 50 distribution transformers with random 10% degraded sensor fault injection.  

---

## 1. Measured Performance Summary

| Metric | Target SLA | Measured Benchmark Result | Status |
| :--- | :--- | :--- | :--- |
| **Total Requests** | $\ge 200$ | **300 requests** | Pass |
| **Concurrency** | 10 workers | **10 concurrent workers** | Pass |
| **Duration** | N/A | **2.26 seconds** | Pass |
| **Throughput** | $\ge 100$ req/s | **132.7 requests / second** | Exceeds SLA |
| **Availability / Error Rate** | $\le 0.1\%$ | **0.00% errors (0 / 300 failed)** | 100% Availability |
| **Latency p50** | $< 100$ ms | **69.59 ms** | Pass |
| **Latency p95** | $< 150$ ms | **113.47 ms** | Pass |
| **Latency p99** | $< 250$ ms | **148.46 ms** | Pass |
| **Safety Fallback Activation** | $> 0\%$ | **31.0% (93 / 300 requests)** | Pass |

---

## 2. Failure Injection & Resilience Analysis

### A. Degraded Sensor Health Injection
- **Test:** Injected sensor health reading of $0.42$ ($< 0.75$ safe policy cutoff).
- **Observed Behavior:** 100% of injected requests were safely intercepted by `SafetyRouter`.
- **System Action:** Routed to `SafetyFallbackProvider` with explicit reason (`Sensor health (0.42) is below safe policy threshold (0.75)`). Confidence automatically downscaled to $\le 0.65$.

### B. Telemetry Staleness Injection
- **Test:** Injected telemetry observations with timestamp $\ge 15$ minutes old ($> 300$ seconds limit).
- **Observed Behavior:** Marked data quality as degraded/critical; routed to safety fallback without failing the client request.

### C. Forced Primary Model Failure
- **Test:** Overridden inference with `force_fallback=True`.
- **Observed Behavior:** Seamlessly returned conservative risk calculation without raising 500 status codes.

---

## 3. Operational Reproducibility

To re-run this exact load test suite:
```bash
python scripts/run_load_test.py --requests 300 --concurrency 10
```
