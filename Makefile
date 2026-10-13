.PHONY: install test unit-test integration-test run validate-model register-model docker-build docker-up clean help

VENV ?= .venv
PYTHON = $(VENV)/bin/python
PYTEST = $(VENV)/bin/pytest
UVICORN = $(VENV)/bin/uvicorn

help:
	@echo "GridGuard Operational Commands:"
	@echo "  make install         Install virtualenv dependencies in editable mode"
	@echo "  make test            Run the full test suite (unit, integration, contract, failure)"
	@echo "  make run             Start the GridGuard server on http://localhost:8000"
	@echo "  make validate-model  Validate registered model artifact bundle against contract"
	@echo "  make load-test       Run concurrent load and failure resilience test"
	@echo "  make docker-build    Build production container image"
	@echo "  make docker-up       Start container stack via docker-compose"

install:
	python3 -m venv $(VENV)
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e ".[dev]"

test:
	$(PYTEST) tests/ -v

unit-test:
	$(PYTEST) tests/unit/ -v

integration-test:
	$(PYTEST) tests/integration/ tests/contract/ tests/failure_injection/ -v

run:
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --reload

validate-model:
	$(PYTHON) scripts/validate_model_artifact.py --dir model_artifacts/registered/gridguard-risk-0.1.0 --require-approved --verify-checksum

verify-model-v2:
	$(PYTHON) scripts/verify_anomaly_v2_model.py

load-test:
	$(PYTHON) scripts/run_load_test.py --requests 200 --concurrency 10

docker-build:
	docker build -t gridguard:latest .

docker-up:
	docker compose up -d

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
