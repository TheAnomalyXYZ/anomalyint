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

# Make start script executable and fix line endings
RUN chmod +x start.sh && \
    sed -i 's/\r$//' start.sh

# Use start script to handle PORT env var
CMD ["bash", "./start.sh"]
