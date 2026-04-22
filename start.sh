#!/bin/bash

# --- PragmaGuard Unified Startup Script ---

echo "Starting PragmaGuard Backend (FastAPI)..."
cd /app/backend
# Start FastAPI on port 8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &

echo "Starting PragmaGuard Frontend (Next.js)..."
cd /app/frontend
# Start Next.js on port 7860 (Hugging Face Default)
npm run start -- -p 7860
