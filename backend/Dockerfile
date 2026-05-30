FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy only requirements first — layer cache for pip install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Exec-form CMD ensures uvicorn is PID 1 and receives signals directly.
# --timeout-keep-alive 75 keeps connections alive slightly longer than
# Railway's 60-second idle timeout to prevent premature disconnects.
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--log-level", "info", \
     "--timeout-keep-alive", "75"]
