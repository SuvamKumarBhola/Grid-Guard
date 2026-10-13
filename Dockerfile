FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GRIDGUARD_ENV=production \
    GRIDGUARD_HOST=0.0.0.0 \
    GRIDGUARD_PORT=8000 \
    GRIDGUARD_MODEL_MODE=stub

# Create non-root user
RUN groupadd -g 10001 gridguard && \
    useradd -u 10001 -g gridguard -s /bin/bash -m gridguard

COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

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
