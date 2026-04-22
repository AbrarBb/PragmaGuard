#!/usr/bin/env python3
"""
Train the Tier-3 Deep MLP model and save it for production use.

Architecture: 398 → 512 → 256 → 128 → 64 → 1
              BatchNorm · Dropout(0.2) · CosineAnnealingLR · GradientClipping
Source: notebook-3-tier3-deep.ipynb from the research repo.

This script:
1) Loads ml_dataset_verified_full.npz
2) Trains the DeepMLP model on the full (imbalanced) dataset
3) Saves the trained model (.pt)
   (Uses the same StandardScaler already saved by train_mlp.py)
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


class DeepMLP(nn.Module):
    """Exact architecture from notebook-3-tier3-deep.ipynb."""
    def __init__(self, input_dim, dropout=0.2):
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


def train_deep(X_tr, y_tr, X_vl, y_vl, input_dim,
               dropout=0.2, lr=0.0005, batch_size=32,
               max_epochs=200, patience=15):
    """Train the DeepMLP with best hyperparameters from notebook-3 sweep."""
    pos_w = torch.tensor(
        [(y_tr == 0).sum() / (y_tr == 1).sum()],
        dtype=torch.float32,
    ).to(device)

    model = DeepMLP(input_dim, dropout).to(device)
    opt = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = optim.lr_scheduler.CosineAnnealingLR(opt, T_max=max_epochs)

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
            loss = nn.functional.binary_cross_entropy_with_logits(
                logits, yb, pos_weight=pos_w
            )
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            tl += loss.item() * len(xb)

        sched.step()
        model.eval()
        with torch.no_grad():
            vl = model(Xvl_t)
            vl_loss = nn.functional.binary_cross_entropy_with_logits(
                vl, yvl_t, pos_weight=pos_w
            ).item()
            vp = torch.sigmoid(vl).cpu().numpy()
            vf = f1_score(y_vl, (vp > 0.5).astype(int), average="macro")
            va = roc_auc_score(y_vl, vp)

        print(
            f"  Epoch {ep+1:3d}: "
            f"train_loss={tl/len(X_tr):.4f}  "
            f"val_loss={vl_loss:.4f}  "
            f"F1={vf:.4f}  AUC={va:.4f}"
        )

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
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )

    print(f"Training on {len(X_tr)} samples, validating on {len(X_te)} samples")
    print("Training Deep MLP (Tier-3)...")
    print("  Hyperparameters: lr=0.0005, dropout=0.2, batch_size=32")

    model = train_deep(
        X_tr, y_tr, X_te, y_te, INPUT_DIM,
        dropout=0.2, lr=0.0005, batch_size=32,
        max_epochs=200, patience=15,
    )

    # Final evaluation
    model.eval()
    with torch.no_grad():
        prob_te = torch.sigmoid(
            model(torch.tensor(X_te, dtype=torch.float32).to(device))
        ).cpu().numpy()
    pred_te = (prob_te > 0.5).astype(int)
    print("\n" + "=" * 60)
    print("Hold-out evaluation:")
    print(classification_report(y_te, pred_te, target_names=["Safe", "Rugpull"]))
    print(f"ROC-AUC: {roc_auc_score(y_te, prob_te):.4f}")
    print("=" * 60)

    # Save model
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model_path = MODELS_DIR / "deep_mlp_best_model.pt"
    torch.save(model.state_dict(), model_path)
    print(f"\nSaved model: {model_path}")

    # Also save the scaler (overwrite with same scaler for consistency)
    scaler_path = MODELS_DIR / "scaler.joblib"
    joblib.dump(scaler, scaler_path)
    print(f"Saved scaler: {scaler_path}")

    print("\nDone! The Deep MLP model is ready for production use.")


if __name__ == "__main__":
    main()
