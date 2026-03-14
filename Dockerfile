# ═══════════════════════════════════════════════════════════════
# Wanderlore AI — Multi-stage Production Build
# Stage 1: Build Vite frontend
# Stage 2: Python API server + built frontend as static files
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build frontend ──────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /build

# Install dependencies first (cached layer)
COPY client/package.json client/package-lock.json ./
RUN npm ci --production=false

# Copy source and build
COPY client/ ./
RUN npm run build

# ── Stage 2: Python API + static frontend ────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies (cached layer)
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Copy server code
COPY server/ server/

# Copy DM engine prompt
COPY dm-engine.md dm-engine.md

# Copy built frontend from Stage 1
COPY --from=frontend-build /build/dist dist/

# Add server/ to Python path so "from app.config" works
ENV PYTHONPATH=/app/server

# Run with uvicorn on Railway's dynamic $PORT (default 8000 for local dev)
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
