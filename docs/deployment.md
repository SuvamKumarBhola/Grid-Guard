# GridGuard — Cloud & Container Deployment Guide

## 1. Local Containerized Orchestration

To run GridGuard using Docker Compose:
```bash
docker compose up --build -d
```
Verify the container status:
```bash
docker compose ps
curl http://localhost:8000/api/v1/health
```

Access the web console at: `http://localhost:8000/ui/`

---

## 2. Kubernetes Deployment (Cloud-Native)

GridGuard includes full declarative Kubernetes manifests located in `deployment/kubernetes/`:

1. `configmap.yaml`: Runtime environment parameters.
2. `deployment.yaml`: Replicated Deployment (2 replicas), rolling update strategy (`maxSurge: 1, maxUnavailable: 0`), non-root container security context, liveness and readiness probes.
3. `service.yaml`: High-availability Service with LoadBalancer/ClusterIP.
4. `hpa.yaml`: HorizontalPodAutoscaler scaling from 2 to 10 pods on CPU/memory utilization.
5. `pdb.yaml`: PodDisruptionBudget ensuring zero downtime during node maintenance.

### Deploying to a Kubernetes Cluster:
```bash
# 1. Create namespace
kubectl create namespace gridguard

# 2. Apply ConfigMap and Deployment
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/deployment.yaml
kubectl apply -f deployment/kubernetes/service.yaml
kubectl apply -f deployment/kubernetes/hpa.yaml
kubectl apply -f deployment/kubernetes/pdb.yaml

# 3. Verify Rollout Status
kubectl rollout status deployment/gridguard-api -n gridguard
```

---

## 3. Zero-Downtime Rollback Procedure

If a deployed model version or container release shows elevated fallback rates or latency anomalies:
```bash
# Roll back to the previous deployment revision
kubectl rollout undo deployment/gridguard-api -n gridguard

# Verify revision status
kubectl rollout history deployment/gridguard-api -n gridguard
```
