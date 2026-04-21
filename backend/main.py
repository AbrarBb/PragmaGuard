"""
PragmaGuard — FastAPI backend for smart contract rugpull detection.
"""

from __future__ import annotations

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pipeline import run_pipeline
from model_loader import load_models, predict

app = FastAPI(
    title="PragmaGuard",
    description="Smart Contract Rugpull Detector — Intent-Behavior Deviation Analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model store — loaded once at startup, reused per request
models: dict = {}

MAX_FILE_SIZE = 1_048_576  # 1 MB


@app.on_event("startup")
def startup():
    """Load ML models into memory once at startup."""
    models.update(load_models())
    print(f"[OK] Model loaded: {models['name']}")
    # Warm up the SBERT encoder so first request isn't slow
    from pipeline import get_embedder
    get_embedder()
    print("[OK] Sentence-BERT encoder ready")


@app.post("/api/predict")
async def predict_contract(file: UploadFile = File(...)):
    """
    Upload a .sol file and receive a rugpull risk assessment.
    """
    # --- Validate filename ---
    if not file.filename or not file.filename.endswith(".sol"):
        raise HTTPException(400, "Only .sol files accepted")

    # --- Read & validate content ---
    raw = await file.read()

    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large ({len(raw)} bytes). Max 1 MB.")

    source_code = raw.decode("utf-8", errors="replace")

    # Basic sanity check — must look like Solidity
    if not any(kw in source_code.lower() for kw in ["pragma solidity", "contract ", "interface ", "library "]):
        raise HTTPException(
            400,
            "File does not appear to be valid Solidity (no pragma/contract/interface found)."
        )

    # --- Run pipeline ---
    features = run_pipeline(source_code)

    # --- Run inference ---
    result = predict(models, features)

    return {
        "filename":       file.filename,
        "prediction":     result["label"],
        "probability":    round(result["prob"], 4),
        "confidence":     result["confidence"],
        "behavior_flags": features["behavior_flags"],
        "intent_snippet": features["intent_text"][:500],
        "model_used":     result["model_used"],
    }


@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model_loaded": models.get("name", "none"),
    }
