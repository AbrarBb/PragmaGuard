# 🛡️ PragmaGuard

**Smart Contract Rugpull Detection** powered by ML-based intent–behavior deviation analysis.

PragmaGuard provides an instant rugpull risk assessment for Solidity (`.sol`) smart contracts using a 3-layer MLP neural network trained on 3,300+ verified contracts.

## ✨ Features

- **Multi-Modal Analysis**: Drag & drop `.sol` files, paste raw code, or fetch directly from Ethereum, BSC, or Polygon block explorers.
- **On-Chain Forensics (Etherscan V2)**: Connects to block explorers to fetch verified source code automatically.
- **Unverified Contract Heuristics**: Instantly flags contracts lacking verified source code as high-risk (99.9% confidence) without needing ML analysis.
- **Multi-Model Ensemble Intelligence**:
  - **Tier-1**: Classical ML (Random Forest) for robust baseline detection.
  - **Tier-2**: 3-Layer MLP for complex non-linear pattern recognition.
  - **Tier-3**: 5-Layer Deep MLP for deep feature interaction analysis.
  - **Ensemble Combinations**: Provides Majority Voting, Weighted Average (by F1 score), and individual model breakdowns.
- **Intent–Behavior Deviation Engine**: Extracts and encodes developer intent (via NatSpec/comments) using `Sentence-BERT` and compares it against actual behavioral flags.
- **Detailed Breakdown & PDF Reporting**: Dynamically generates a natural language explanation of the rugpull risk based on behavioral flags and deep learning predictions. Instantly download the complete forensic analysis as a professional, continuous PDF document.
- **Monochrome UI**: A sleek, academic black-and-white interface built with Next.js, featuring responsive layouts, `lucide-react` icons, and clean high-contrast styling.

---

## 🧠 Technical Architecture

**Backend (FastAPI & PyTorch)**
- `main.py`: REST API endpoints (`/api/predict`, `/api/predict_text`, `/api/predict_address`).
- `etherscan.py`: Multi-chain source code fetching using Etherscan V2 API.
- `pipeline.py`: Feature extraction (398-d vector) combining SBERT embeddings (384-d) and behavioral flags (14-d).
- `model_loader.py`: Ensemble model management, loading scikit-learn and PyTorch models, and computing majority vote / weighted average.
- `models/`: Contains the pre-trained `scaler.joblib`, `best_model_verified_full.joblib` (RF), `mlp_best_model.pt`, and `deep_mlp_best_model.pt`.

**Frontend (Next.js & React)**
- `app/page.js`: Main application logic, tab-based input routing, and comprehensive result rendering with an Ensemble Model Breakdown and PDF generation.
- `app/globals.css`: Premium pure monochrome CSS with custom tokens and clean, high-contrast card designs.

## How It Works

1. **Input**: Supply a contract via Upload, Paste, or Block Explorer Fetch.
2. **Extract**: Extract NatSpec comments and function signatures (intent text).
3. **Embed**: Embed intent text with Sentence-BERT (`all-MiniLM-L6-v2`) → 384-d vector.
4. **Detect**: Detect 14 behavioral heuristic flags via regex patterns.
5. **Assemble**: Construct a 398-dimensional feature vector.
6. **Normalize**: Normalize features using a fitted `StandardScaler`.
7. **Classify (Ensemble)**: Pass the feature vector through three independent models:
   - Tier-1: Random Forest
   - Tier-2: 3-Layer MLP (398→256→128→1)
   - Tier-3: Deep 5-Layer MLP (398→512→256→128→64→1)
8. **Synthesize**: Compute Majority Vote and Weighted Average across the ensemble.
9. **Return**: Return rugpull probability, confidence level, detailed flag breakdown, and a natural language explanation ready for PDF export.

## Model Performance

| Metric     | Random Forest | MLP 3-Layer | Deep MLP 5-Layer |
|------------|---------------|-------------|------------------|
| **F1-Score** | 0.9745        | 0.9700      | 0.9750           |
| **ROC-AUC**  | 0.9730        | 0.9700      | 0.9748           |

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend/` directory to enable the **Fetch Address** feature:
```env
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

Start the backend:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Train the Models (optional)

The pre-trained models are included. To retrain the neural networks:

```bash
cd backend
python train_mlp.py
python train_deep_mlp.py
```

Requires the dataset NPZ file from the [Intent-Behavior Deviation Dataset](https://github.com/AbrarBb/Intent-Behavior-Deviation-Dataset).

## Tech Stack

- **Backend:** FastAPI, PyTorch, Sentence-Transformers, scikit-learn
- **Frontend:** Next.js (App Router), Vanilla CSS, html2canvas, jsPDF, Lucide-React
- **Ensemble Intelligence:** Random Forest, 3-layer MLP, 5-layer Deep MLP
- **Embeddings:** Sentence-BERT (`all-MiniLM-L6-v2`)

## Dataset

Based on the [Intent-Behavior Deviation Dataset](https://github.com/AbrarBb/Intent-Behavior-Deviation-Dataset) research project.

## License

MIT
