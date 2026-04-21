"""
Feature extraction pipeline — mirrors the exact logic from scripts 05/06/07/12
in the research repo.  Produces a 398-d feature vector per contract.
"""

from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer

from solidity_extract import (
    extract_nat_spec_and_comments,
    extract_function_names,
    regex_behavior_flags,
)

# Load SBERT once at module level (same model used during training)
_embedder: SentenceTransformer | None = None

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMB_DIM = 384

BEHAV_COLS = [
    "owner_withdraw",
    "emergency_withdraw",
    "unrestricted_mint",
    "regex_owner_withdraw",
    "regex_emergency_withdraw",
    "regex_unrestricted_mint",
    "slither_ok",
    "slither_high_count",
    "slither_arbitrary_send",
    "slither_suicidal",
    "slither_unchecked_lowlevel",
    "slither_controlled_delegatecall",
    "slither_delegatecall_loop",
    "slither_ownerish_any",
]


def get_embedder() -> SentenceTransformer:
    """Lazy-load the sentence transformer (download on first use)."""
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(MODEL_NAME)
    return _embedder


def run_pipeline(source_code: str) -> dict:
    """
    Run the full feature extraction pipeline on raw Solidity source code.

    Returns
    -------
    dict with keys:
        X            : np.ndarray of shape (398,)
        intent_text  : str  — extracted NatSpec / comments
        behavior_flags : dict — the 14 behavior feature values
    """
    # 1. Intent extraction (same logic as script 12)
    intent_text = extract_nat_spec_and_comments(source_code).strip()
    funcs = extract_function_names(source_code)

    if not intent_text:
        intent_text = f"(no NatSpec/comments extracted) functions: {', '.join(funcs[:20])}"

    intent_text = intent_text[:8000]

    # 2. Embedding (same model & params as training)
    emb = get_embedder().encode(
        [intent_text],
        convert_to_numpy=True,
        normalize_embeddings=False,
    )[0].astype(np.float32)

    # 3. Behavior features (regex only — Slither disabled for web app speed)
    rx = regex_behavior_flags(source_code, funcs)

    # Slither flags zeroed (matches training when slither_ok=0)
    slither_flags = {
        "slither_ok": 0,
        "slither_high_count": 0,
        "slither_arbitrary_send": 0,
        "slither_suicidal": 0,
        "slither_unchecked_lowlevel": 0,
        "slither_controlled_delegatecall": 0,
        "slither_delegatecall_loop": 0,
        "slither_ownerish_any": 0,
    }

    # Merged flags (same logic as script 12, line 520-524)
    owner_withdraw = int(
        rx["regex_owner_withdraw"]
        or slither_flags["slither_arbitrary_send"]
        or slither_flags["slither_ownerish_any"]
    )

    beh_row = [
        owner_withdraw,
        int(rx["regex_emergency_withdraw"]),
        int(rx["regex_unrestricted_mint"]),
        int(rx["regex_owner_withdraw"]),
        int(rx["regex_emergency_withdraw"]),
        int(rx["regex_unrestricted_mint"]),
        slither_flags["slither_ok"],
        slither_flags["slither_high_count"],
        slither_flags["slither_arbitrary_send"],
        slither_flags["slither_suicidal"],
        slither_flags["slither_unchecked_lowlevel"],
        slither_flags["slither_controlled_delegatecall"],
        slither_flags["slither_delegatecall_loop"],
        slither_flags["slither_ownerish_any"],
    ]

    X = np.hstack([emb, np.array(beh_row, dtype=np.float32)])

    return {
        "X": X,                                    # shape (398,)
        "intent_text": intent_text,
        "behavior_flags": dict(zip(BEHAV_COLS, beh_row)),
    }
