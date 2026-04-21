#!/usr/bin/env python3
"""
Train the Tier-2 MLP model and save it for production use.

Architecture: 398 → 256 → 128 → 1 · BatchNorm · Dropout(0.3) · Adam · Early Stopping
Source: notebook-2-tier2-mlp.ipynb from the research repo.

This script:
1) Loads ml_dataset_verified_full.npz
2) Trains the MLP3Layer model on the full (imbalanced) dataset
3) Saves the trained model (.pt) AND the fitted StandardScaler (.joblib)
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.metrics import classification_report, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset

SEED = 42
torch.manual_seed(SEED)
np.random.seed(SEED)

SCRIPT_DIR = Path(__file__).resolve().parent
MODELS_DIR = SCRIPT_DIR / "models"
# The NPZ file from the research repo
DATA_PATH = Path(r"D:\CSE487 - PAPER\Dataset\artifacts\ml_dataset_verified_full.npz")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class MLP3Layer(nn.Module):
    """Exact architecture from notebook-2-tier2-mlp.ipynb."""
    def __init__(self, input_dim, dropout=0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(256, 128),       nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(128, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(1)


def train_mlp(X_tr, y_tr, X_vl, y_vl, input_dim, dropout=0.3, lr=0.001,
              batch_size=64, max_epochs=100, patience=10, use_class_weight=True):
    if use_class_weight:
        pos_w = torch.tensor([(y_tr == 0).sum() / (y_tr == 1).sum()], dtype=torch.float32).to(device)
    else:
        pos_w = None

    model = MLP3Layer(input_dim, dropout).to(device)
    opt = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = optim.lr_scheduler.ReduceLROnPlateau(opt, patience=5, factor=0.5)

    dl = DataLoader(
        TensorDataset(
            torch.tensor(X_tr, dtype=torch.float32),
            torch.tensor(y_tr, dtype=torch.float32),
        ),
        batch_size=batch_size, shuffle=True,
    )
    Xvl_t = torch.tensor(X_vl, dtype=torch.float32).to(device)
    yvl_t = torch.tensor(y_vl, dtype=torch.float32).to(device)

    best_f1, best_st, wait = 0, None, 0

    for ep in range(max_epochs):
        model.train()
        tl = 0
        for xb, yb in dl:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            logits = model(xb)
            if pos_w is not None:
                loss = nn.functional.binary_cross_entropy_with_logits(logits, yb, pos_weight=pos_w)
            else:
                loss = nn.functional.binary_cross_entropy_with_logits(logits, yb)
            loss.backward()
            opt.step()
            tl += loss.item() * len(xb)

        model.eval()
        with torch.no_grad():
            vl = model(Xvl_t)
            if pos_w is not None:
                vl_loss = nn.functional.binary_cross_entropy_with_logits(vl, yvl_t, pos_weight=pos_w).item()
            else:
                vl_loss = nn.functional.binary_cross_entropy_with_logits(vl, yvl_t).item()
            vp = torch.sigmoid(vl).cpu().numpy()
            vf = f1_score(y_vl, (vp > 0.5).astype(int), average="macro")
            va = roc_auc_score(y_vl, vp)

        sched.step(vl_loss)

        print(f"  Epoch {ep+1:3d}: train_loss={tl/len(X_tr):.4f}  val_loss={vl_loss:.4f}  F1={vf:.4f}  AUC={va:.4f}")

        if vf > best_f1:
            best_f1 = vf
            best_st = {k: v.clone() for k, v in model.state_dict().items()}
            wait = 0
        else:
            wait += 1
            if wait >= patience:
                print(f"  Early stopping at epoch {ep+1}")
                break

    model.load_state_dict(best_st)
    return model


def main():
    if not DATA_PATH.is_file():
        print(f"ERROR: Dataset not found: {DATA_PATH}")
        sys.exit(1)

    print(f"Device: {device}")
    print(f"Loading data from: {DATA_PATH}")

    pack = np.load(DATA_PATH, allow_pickle=True)
    X_raw = pack["X"]
    y = pack["y"]

    INPUT_DIM = X_raw.shape[1]
    print(f"Dataset: {X_raw.shape[0]} samples, {INPUT_DIM} features")

    # Fit StandardScaler on full data (same as notebook)
    scaler = StandardScaler()
    X = scaler.fit_transform(X_raw).astype(np.float32)

    # Hold-out split (same as notebook: 20% test, stratified)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=SEED)

    print(f"Training on {len(X_tr)} samples, validating on {len(X_te)} samples")
    print("Training MLP...")

    model = train_mlp(X_tr, y_tr, X_te, y_te, INPUT_DIM, max_epochs=100, patience=10)

    # Final evaluation
    model.eval()
    with torch.no_grad():
        prob_te = torch.sigmoid(model(torch.tensor(X_te, dtype=torch.float32).to(device))).cpu().numpy()
    pred_te = (prob_te > 0.5).astype(int)
    print("\n" + "=" * 60)
    print("Hold-out evaluation:")
    print(classification_report(y_te, pred_te, target_names=["Safe", "Rugpull"]))
    print(f"ROC-AUC: {roc_auc_score(y_te, prob_te):.4f}")
    print("=" * 60)

    # Save model and scaler
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model_path = MODELS_DIR / "mlp_best_model.pt"
    torch.save(model.state_dict(), model_path)
    print(f"\nSaved model: {model_path}")

    scaler_path = MODELS_DIR / "scaler.joblib"
    joblib.dump(scaler, scaler_path)
    print(f"Saved scaler: {scaler_path}")

    print("\nDone! Copy these files to the backend/models/ directory for production.")


if __name__ == "__main__":
    main()
