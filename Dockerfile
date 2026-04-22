# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Set environment variable for production API URL if needed
# For Hugging Face, localhost:8000 works since they share the same container
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
RUN npm run build

# --- Stage 2: Final Image ---
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (needed to run the frontend in the same container)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Copy and install Backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Backend code
COPY backend/ ./backend/

# Copy built Frontend from Stage 1
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Create a startup script
RUN echo '#!/bin/bash\n\
# Start the FastAPI backend in the background\n\
cd /app/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
\n\
# Start the Next.js frontend on port 7860 (Hugging Face default)\n\
cd /app/frontend && npm run start -- -p 7860\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose the port Hugging Face expects
EXPOSE 7860

# Start everything
CMD ["/app/start.sh"]
