import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_openapi_specification_contract():
    with TestClient(app) as tc:
        resp = tc.get("/openapi.json")
        assert resp.status_code == 200
        spec = resp.json()

        assert spec["info"]["title"] == "GridGuard API"
        paths = spec["paths"]

        # Ensure all required API endpoints exist in OpenAPI spec
        required_endpoints = [
            "/api/v1/telemetry/ingest",
            "/api/v1/assets",
            "/api/v1/assets/{asset_id}",
            "/api/v1/assets/{asset_id}/risk",
            "/api/v1/anomalies/detect",
            "/api/v1/simulations/load-redistribution",
            "/api/v1/health",
            "/api/v1/ready",
            "/api/v1/metrics",
            "/api/v1/model",
        ]
        for ep in required_endpoints:
            assert ep in paths, f"Required endpoint '{ep}' missing from OpenAPI paths"


def test_response_security_headers_contract():
    with TestClient(app) as tc:
        resp = tc.get("/api/v1/health")
        assert resp.status_code == 200

        # Contractual security headers
        assert "x-request-id" in resp.headers or "X-Request-ID" in resp.headers
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("x-frame-options") == "DENY"
