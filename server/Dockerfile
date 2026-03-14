FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt

# Copy server code
COPY server/ server/
COPY dm-engine.md dm-engine.md

# Add server/ to Python path so "from app.config" works
ENV PYTHONPATH=/app/server

# Run with uvicorn
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
