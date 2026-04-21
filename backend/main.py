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


from pydantic import BaseModel
from etherscan import fetch_source_code

class ContractText(BaseModel):
    source_code: str
    filename: str = "pasted_contract.sol"

class ContractAddress(BaseModel):
    address: str
    network: str = "ethereum"

@app.post("/api/predict_text")
async def predict_contract_text(contract: ContractText):
    """
    Analyze raw pasted .sol text and receive a rugpull risk assessment.
    """
    source_code = contract.source_code

    if len(source_code.encode("utf-8")) > MAX_FILE_SIZE:
        raise HTTPException(400, "Text too large. Max 1 MB.")

    # Basic sanity check — must look like Solidity
    if not any(kw in source_code.lower() for kw in ["pragma solidity", "contract ", "interface ", "library "]):
        raise HTTPException(
            400,
            "Text does not appear to be valid Solidity (no pragma/contract/interface found)."
        )

    # --- Run pipeline ---
    features = run_pipeline(source_code)

    # --- Run inference ---
    result = predict(models, features)

    return {
        "filename":       contract.filename,
        "prediction":     result["label"],
        "probability":    round(result["prob"], 4),
        "confidence":     result["confidence"],
        "behavior_flags": features["behavior_flags"],
        "intent_snippet": features["intent_text"][:500],
        "model_used":     result["model_used"],
    }

@app.post("/api/predict_address")
async def predict_contract_address(contract: ContractAddress):
    """
    Fetch verified source code from a block explorer and receive a rugpull risk assessment.
    """
    try:
        source_code = fetch_source_code(contract.address, contract.network)
    except ValueError as e:
        error_msg = str(e)
        if "NOT VERIFIED" in error_msg:
            # High risk! We don't even need ML for this.
            return {
                "filename": f"{contract.address} ({contract.network})",
                "prediction": "rugpull",
                "probability": 0.9999,
                "confidence": "high",
                "behavior_flags": {},
                "intent_snippet": f"🚨 {error_msg}",
                "model_used": "Heuristic (Unverified)",
            }
        raise HTTPException(400, error_msg)
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch source code: {str(e)}")

    if len(source_code.encode("utf-8")) > MAX_FILE_SIZE:
        raise HTTPException(400, "Fetched source code too large. Max 1 MB.")

    # --- Run pipeline ---
    features = run_pipeline(source_code)

    # --- Run inference ---
    result = predict(models, features)

    return {
        "filename":       f"{contract.address} ({contract.network})",
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
