# STILLGOOD Backend — Production Dockerfile for Google Cloud Run
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Set default port for Google Cloud Run
ENV PORT=8080
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

# Run uvicorn on Cloud Run standard port
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
