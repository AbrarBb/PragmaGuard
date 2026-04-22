# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Final Runtime ---
FROM python:3.10-slim
WORKDIR /app

# Create a non-root user (Hugging Face Best Practice)
RUN useradd -m -u 1000 user
ENV PATH="/home/user/.local/bin:$PATH"

# Install system dependencies & Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Setup Backend dependencies
COPY --chown=user:user backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade -r backend/requirements.txt

# Copy Backend and Frontend code with correct ownership
COPY --chown=user:user backend/ ./backend/
COPY --chown=user:user --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --chown=user:user --from=frontend-builder /app/frontend/public ./frontend/public
COPY --chown=user:user --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --chown=user:user --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --chown=user:user --from=frontend-builder /app/frontend/next.config.mjs ./frontend/

# Setup Startup Script
COPY --chown=user:user start.sh ./
RUN chmod +x start.sh

# Switch to non-root user
USER user

# Hugging Face Spaces default port
EXPOSE 7860

# Run the unified startup script
CMD ["./start.sh"]
