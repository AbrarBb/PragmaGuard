"""
Model loading and inference using the Tier-2 MLP neural network.

Architecture: 398 → 256 → 128 → 1 (BatchNorm, Dropout, ReLU)
Source: notebook-2-tier2-mlp.ipynb from the research repo.

The model is loaded from a .pt state_dict file.
Features are scaled using a fitted StandardScaler saved as .joblib.
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import torch
import torch.nn as nn

SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR / "models" / "mlp_best_model.pt"
SCALER_PATH = SCRIPT_DIR / "models" / "scaler.joblib"

INPUT_DIM = 398
THRESHOLD = 0.50


class MLP3Layer(nn.Module):
    """Exact architecture from notebook-2-tier2-mlp.ipynb."""
    def __init__(self, input_dim=INPUT_DIM, dropout=0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(256, 128),       nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(128, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(1)


def load_models() -> dict:
    """Load the trained MLP model and scaler at startup."""
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}. "
            "Run train_mlp.py first to train and save the model."
        )
    if not SCALER_PATH.is_file():
        raise FileNotFoundError(
            f"Scaler file not found: {SCALER_PATH}. "
            "Run train_mlp.py first to train and save the scaler."
        )

    # Load the model
    device = torch.device("cpu")  # Use CPU for inference (fast enough for single samples)
    model = MLP3Layer(INPUT_DIM)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=True))
    model.eval()

    # Load the scaler
    scaler = joblib.load(SCALER_PATH)

    return {
        "model": model,
        "scaler": scaler,
        "device": device,
        "name": "MLP3Layer (Tier-2)",
    }


def predict(models: dict, features: dict) -> dict:
    """
    Run inference on a single contract's feature vector.

    Parameters
    ----------
    models   : dict from load_models()
    features : dict from pipeline.run_pipeline()

    Returns
    -------
    dict with label, prob, confidence, model_used
    """
    model = models["model"]
    scaler = models["scaler"]
    device = models["device"]

    # Scale the features (same as during training)
    X_raw = features["X"].reshape(1, -1)
    X_scaled = scaler.transform(X_raw).astype(np.float32)

    # Run inference
    X_tensor = torch.tensor(X_scaled, dtype=torch.float32).to(device)

    with torch.no_grad():
        logits = model(X_tensor)
        prob = torch.sigmoid(logits).cpu().numpy()[0]

    prob = float(prob)

    label = "rugpull" if prob > THRESHOLD else "safe"

    # Confidence bands
    dist = abs(prob - 0.5)
    if dist > 0.3:
        confidence = "high"
    elif dist > 0.15:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "label": label,
        "prob": prob,
        "confidence": confidence,
        "model_used": models["name"],
    }
