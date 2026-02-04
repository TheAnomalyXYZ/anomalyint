FROM python:3.11-slim

# Install system dependencies required for OpenCV/CommonForms/Tesseract
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libxrender1 \
    libxext6 \
    libsm6 \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Test marker: Building from commit ee81a08 at 2026-02-04 11:58
RUN echo "========================================" && \
    echo "DOCKERFILE VERSION CHECK: ee81a08-2026-02-04-11:58" && \
    echo "This should appear in Railway build logs" && \
    echo "========================================"

# Direct uvicorn command with hardcoded port (Railway uses 8080)
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
