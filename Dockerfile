# syntax=docker/dockerfile:1
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -e .

# Runtime Stage
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GRIDGUARD_ENV=production \
    GRIDGUARD_HOST=0.0.0.0 \
    GRIDGUARD_PORT=8000 \
    GRIDGUARD_MODEL_MODE=stub

# Create non-root user for security
RUN groupadd -g 10001 gridguard && \
    useradd -u 10001 -g gridguard -s /bin/bash -m gridguard

COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY app/ ./app
COPY model_artifacts/ ./model_artifacts
COPY frontend/ ./frontend
COPY pyproject.toml .env.example ./

RUN chown -R gridguard:gridguard /app

USER gridguard

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
