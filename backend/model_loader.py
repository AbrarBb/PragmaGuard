"""
Multi-model ensemble loading and inference for PragmaGuard.

Loads three model tiers and provides ensemble predictions via:
  1. Majority Voting
  2. Weighted Average (based on model F1 scores)
  3. Show All Individual Predictions

Model Tiers:
  Tier-1: Random Forest (scikit-learn Pipeline, .joblib)
  Tier-2: 3-layer MLP  (398→256→128→1, PyTorch .pt)
  Tier-3: 5-layer Deep MLP (398→512→256→128→64→1, PyTorch .pt)

All tiers share the same 398-d feature vector and StandardScaler.
"""

from __future__ import annotations

from pathlib import Path
from collections import Counter

import joblib
import numpy as np
import torch
import torch.nn as nn

SCRIPT_DIR = Path(__file__).resolve().parent
MODELS_DIR = SCRIPT_DIR / "models"

# ── Paths ──────────────────────────────────────────────────────────────────────
TIER1_MODEL_PATH = MODELS_DIR / "best_model_verified_full.joblib"
TIER2_MODEL_PATH = MODELS_DIR / "mlp_best_model.pt"
TIER3_MODEL_PATH = MODELS_DIR / "deep_mlp_best_model.pt"
SCALER_PATH      = MODELS_DIR / "scaler.joblib"

INPUT_DIM = 398
THRESHOLD = 0.50

# F1 scores from research notebooks (used for weighted average)
TIER1_F1 = 0.9745   # Random Forest on Full dataset
TIER2_F1 = 0.9700   # 3-layer MLP
TIER3_F1 = 0.9748   # Deep MLP on Full dataset


# ── PyTorch Model Architectures ───────────────────────────────────────────────

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


class DeepMLP(nn.Module):
    """Exact architecture from notebook-3-tier3-deep.ipynb."""
    def __init__(self, input_dim=INPUT_DIM, dropout=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 512), nn.BatchNorm1d(512), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(512, 256),       nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(256, 128),       nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(128, 64),        nn.BatchNorm1d(64),  nn.ReLU(), nn.Dropout(dropout / 2),
            nn.Linear(64, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(1)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _confidence_band(prob: float) -> str:
    """Map probability to a confidence band."""
    dist = abs(prob - 0.5)
    if dist > 0.3:
        return "high"
    elif dist > 0.15:
        return "medium"
    else:
        return "low"


def _predict_single_pytorch(model, scaler, device, features: dict) -> dict:
    """Run inference on a single contract with a PyTorch model."""
    X_raw = features["X"].reshape(1, -1)
    X_scaled = scaler.transform(X_raw).astype(np.float32)
    X_tensor = torch.tensor(X_scaled, dtype=torch.float32).to(device)

    with torch.no_grad():
        logits = model(X_tensor)
        prob = torch.sigmoid(logits).cpu().numpy()[0]

    prob = float(prob)
    label = "rugpull" if prob > THRESHOLD else "safe"
    confidence = _confidence_band(prob)

    return {"label": label, "prob": prob, "confidence": confidence}


def _predict_single_sklearn(clf, scaler, features: dict) -> dict:
    """Run inference on a single contract with a scikit-learn classifier.
    """
    X_raw = features["X"].reshape(1, -1)
    X_scaled = scaler.transform(X_raw).astype(np.float32)

    prob = float(clf.predict_proba(X_scaled)[0, 1])
    label = "rugpull" if prob > THRESHOLD else "safe"
    confidence = _confidence_band(prob)

    return {"label": label, "prob": prob, "confidence": confidence}


# ── Public API ─────────────────────────────────────────────────────────────────

def load_models() -> dict:
    """Load all model tiers and the shared scaler at startup.

    Returns a dict with keys: models (list), scaler, device, name
    """
    # Check required files
    if not SCALER_PATH.is_file():
        raise FileNotFoundError(
            f"Scaler file not found: {SCALER_PATH}. "
            "Run train_mlp.py first to train and save the scaler."
        )

    device = torch.device("cpu")
    scaler = joblib.load(SCALER_PATH)

    model_entries = []

    # ── Tier-1: Random Forest ──────────────────────────────────────────────
    if TIER1_MODEL_PATH.is_file():
        # best_model_verified_full.joblib contains a dict: {'model': RandomForestClassifier, 'name': ...}
        rf_dict = joblib.load(TIER1_MODEL_PATH)
        rf_clf = rf_dict["model"] if isinstance(rf_dict, dict) else rf_dict
        model_entries.append({
            "name": "Random Forest (Tier-1)",
            "type": "sklearn",
            "model": rf_clf,
            "weight": TIER1_F1,
        })
        print(f"  [OK] Tier-1 loaded: Random Forest")
    else:
        print(f"  [WARN] Tier-1 model not found: {TIER1_MODEL_PATH}")

    # ── Tier-2: 3-Layer MLP ────────────────────────────────────────────────
    if TIER2_MODEL_PATH.is_file():
        mlp = MLP3Layer(INPUT_DIM)
        mlp.load_state_dict(torch.load(TIER2_MODEL_PATH, map_location=device, weights_only=True))
        mlp.eval()
        model_entries.append({
            "name": "MLP 3-Layer (Tier-2)",
            "type": "pytorch",
            "model": mlp,
            "weight": TIER2_F1,
        })
        print(f"  [OK] Tier-2 loaded: MLP 3-Layer")
    else:
        print(f"  [WARN] Tier-2 model not found: {TIER2_MODEL_PATH}")

    # ── Tier-3: 5-Layer Deep MLP ───────────────────────────────────────────
    if TIER3_MODEL_PATH.is_file():
        deep = DeepMLP(INPUT_DIM)
        deep.load_state_dict(torch.load(TIER3_MODEL_PATH, map_location=device, weights_only=True))
        deep.eval()
        model_entries.append({
            "name": "Deep MLP 5-Layer (Tier-3)",
            "type": "pytorch",
            "model": deep,
            "weight": TIER3_F1,
        })
        print(f"  [OK] Tier-3 loaded: Deep MLP 5-Layer")
    else:
        print(f"  [WARN] Tier-3 model not found: {TIER3_MODEL_PATH}")

    if not model_entries:
        raise FileNotFoundError(
            "No model files found! Run training scripts first."
        )

    model_names = [m["name"] for m in model_entries]
    name = f"Ensemble ({len(model_entries)} models: {', '.join(model_names)})"

    return {
        "models": model_entries,
        "scaler": scaler,
        "device": device,
        "name": name,
    }


def predict(models_store: dict, features: dict) -> dict:
    """
    Run inference through all loaded models and return ensemble results.

    Returns a dict with:
        label, prob, confidence, model_used   — primary (weighted avg) result
        ensemble — { individual_predictions, majority_vote, weighted_average }
    """
    scaler = models_store["scaler"]
    device = models_store["device"]
    model_entries = models_store["models"]

    individual_predictions = []

    for entry in model_entries:
        if entry["type"] == "pytorch":
            result = _predict_single_pytorch(entry["model"], scaler, device, features)
        else:
            result = _predict_single_sklearn(entry["model"], scaler, features)

        individual_predictions.append({
            "model_name": entry["name"],
            "label": result["label"],
            "prob": round(result["prob"], 4),
            "confidence": result["confidence"],
        })

    # ── Majority Vote ──────────────────────────────────────────────────────
    labels = [p["label"] for p in individual_predictions]
    label_counts = Counter(labels)
    majority_label = label_counts.most_common(1)[0][0]
    majority_count = label_counts.most_common(1)[0][1]
    total_models = len(individual_predictions)
    agreement = f"{majority_count}/{total_models}"

    majority_vote = {
        "label": majority_label,
        "agreement": agreement,
    }

    # ── Weighted Average ───────────────────────────────────────────────────
    total_weight = sum(entry["weight"] for entry in model_entries)
    weighted_prob = sum(
        entry["weight"] * pred["prob"]
        for entry, pred in zip(model_entries, individual_predictions)
    ) / total_weight

    weighted_prob = round(float(weighted_prob), 4)
    weighted_label = "rugpull" if weighted_prob > THRESHOLD else "safe"
    weighted_confidence = _confidence_band(weighted_prob)

    weighted_average = {
        "label": weighted_label,
        "prob": weighted_prob,
        "confidence": weighted_confidence,
    }

    # ── Compose response ───────────────────────────────────────────────────
    return {
        "label": weighted_label,
        "prob": weighted_prob,
        "confidence": weighted_confidence,
        "model_used": models_store["name"],
        "ensemble": {
            "individual_predictions": individual_predictions,
            "majority_vote": majority_vote,
            "weighted_average": weighted_average,
        },
    }
