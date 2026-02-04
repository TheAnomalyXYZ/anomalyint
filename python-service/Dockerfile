FROM python:3.11-slim

# Install system dependencies required for OpenCV/CommonForms
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libxrender1 \
    libxext6 \
    libsm6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway will provide PORT via environment variable (defaults to 8080)
# Start the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
