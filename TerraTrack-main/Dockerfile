# Use an official Python slim base image
FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8766

# Set work directory
WORKDIR /app

# Install basic compiler tools and libraries (libexpat1 is required by rasterio/gdal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libexpat1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt to container
COPY requirements.txt /app/

# Install PyTorch CPU wheel first to optimize build time and image size (avoids downloading 2GB+ CUDA wheel)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy project source files
COPY . /app/

# Create model directory (in case it wasn't copied)
RUN mkdir -p /app/model

# Expose port
EXPOSE 8766

# Start Flask app using Gunicorn WSGI server for production reliability
CMD ["gunicorn", "--bind", "0.0.0.0:8766", "--workers", "2", "--threads", "4", "--timeout", "300", "app:app"]
