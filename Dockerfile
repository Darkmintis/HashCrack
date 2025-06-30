# HashCrack Dockerfile - Multi-stage build for optimized production image

# Build stage
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    john \
    hashcat \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user for security
RUN groupadd -r hashcrack && useradd -r -g hashcrack hashcrack

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p wordlists cache results logs && \
    chown -R hashcrack:hashcrack /app

# Switch to non-root user
USER hashcrack

# Expose ports
EXPOSE 5000 8765

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Environment variables
ENV FLASK_APP=web_interface.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Default command
CMD ["python", "web_interface.py"]

# Labels for metadata
LABEL maintainer="Darkmintis <hashcrack@darkmintis.com>"
LABEL version="2.0.0"
LABEL description="HashCrack - Next-Generation Hash Cracking Tool"
LABEL org.opencontainers.image.source="https://github.com/Darkmintis/HashCrack"
LABEL org.opencontainers.image.documentation="https://github.com/Darkmintis/HashCrack#readme"
LABEL org.opencontainers.image.licenses="MIT"
