# 🛡️ PragmaGuard

**Smart Contract Rugpull Detection** powered by ML-based intent–behavior deviation analysis.

Upload a Solidity (`.sol`) smart contract and get an instant rugpull risk assessment using a 3-layer MLP neural network trained on 3,300+ verified contracts.

## Architecture

```
Frontend (Next.js :3000)  →  API Proxy  →  Backend (FastAPI :8000)
                                              ├── pipeline.py     (SBERT + regex features)
                                              ├── model_loader.py (MLP3Layer inference)
                                              └── models/
                                                    ├── mlp_best_model.pt  (Tier-2 MLP)
                                                    └── scaler.joblib      (StandardScaler)
```

## How It Works

1. **Upload** a `.sol` file through the web UI
2. **Extract** NatSpec comments and function signatures (intent text)
3. **Embed** intent text with Sentence-BERT (`all-MiniLM-L6-v2`) → 384-d vector
4. **Detect** 14 behavioral heuristic flags via regex patterns
5. **Assemble** a 398-dimensional feature vector
6. **Normalize** features using a fitted `StandardScaler`
7. **Classify** with the Tier-2 MLP (`398→256→128→1`, BatchNorm, Dropout)
8. **Return** rugpull probability, confidence level, and flag breakdown

## Model Performance

| Metric     | Safe  | Rugpull |
|------------|-------|---------|
| Precision  | 0.98  | 0.98    |
| Recall     | 0.95  | 0.99    |
| F1-Score   | 0.97  | 0.99    |
| **Accuracy** | **0.98** | |
| **ROC-AUC**  | **0.9761** | |

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Train the Model (optional)

The pre-trained model is included. To retrain:

```bash
cd backend
python train_mlp.py
```

Requires the dataset NPZ file from the [Intent-Behavior Deviation Dataset](https://github.com/AbrarBb/Intent-Behavior-Deviation-Dataset).

## Tech Stack

- **Backend:** FastAPI, PyTorch, Sentence-Transformers, scikit-learn
- **Frontend:** Next.js (App Router), vanilla CSS
- **Model:** 3-layer MLP neural network (398→256→128→1)
- **Embeddings:** Sentence-BERT (`all-MiniLM-L6-v2`)

## Where to Find .sol Files

Download verified Solidity source code from block explorers:
- [Etherscan](https://etherscan.io) (Ethereum)
- [BscScan](https://bscscan.com) (BNB Chain)
- [PolygonScan](https://polygonscan.com) (Polygon)

Navigate to any contract → **Contract** tab → **Contract Source Code**.

## Dataset

Based on the [Intent-Behavior Deviation Dataset](https://github.com/AbrarBb/Intent-Behavior-Deviation-Dataset) research project.

## License

MIT
