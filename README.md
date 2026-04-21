# 🛡️ PragmaGuard

**Smart Contract Rugpull Detection** powered by ML-based intent–behavior deviation analysis.

PragmaGuard provides an instant rugpull risk assessment for Solidity (`.sol`) smart contracts using a 3-layer MLP neural network trained on 3,300+ verified contracts.

## Key Features

1. **Upload File**: Analyze a local `.sol` file.
2. **Paste Code**: Paste raw Solidity source code directly into the UI.
3. **Fetch Address**: Instantly fetch and analyze verified source code from Etherscan, BscScan, or PolygonScan using a contract address. Instantly flags unverified contracts as High Risk.
4. **Professional UI**: Premium dark theme interface built with Next.js and Lucide React icons.

## Architecture

```
Frontend (Next.js :3000)  →  API Proxy  →  Backend (FastAPI :8000)
                                              ├── pipeline.py     (SBERT + regex features)
                                              ├── model_loader.py (MLP3Layer inference)
                                              ├── etherscan.py    (API V2 Client)
                                              └── models/
                                                    ├── mlp_best_model.pt  (Tier-2 MLP)
                                                    └── scaler.joblib      (StandardScaler)
```

## How It Works

1. **Input**: Supply a contract via Upload, Paste, or Block Explorer Fetch.
2. **Extract**: Extract NatSpec comments and function signatures (intent text).
3. **Embed**: Embed intent text with Sentence-BERT (`all-MiniLM-L6-v2`) → 384-d vector.
4. **Detect**: Detect 14 behavioral heuristic flags via regex patterns.
5. **Assemble**: Construct a 398-dimensional feature vector.
6. **Normalize**: Normalize features using a fitted `StandardScaler`.
7. **Classify**: Classify with the Tier-2 MLP (`398→256→128→1`, BatchNorm, Dropout).
8. **Return**: Return rugpull probability, confidence level, and detailed flag breakdown.

## Model Performance

| Metric     | Safe  | Rugpull |
|------------|-------|---------|
| Precision  | 0.98  | 0.98    |
| Recall     | 0.95  | 0.99    |
| F1-Score   | 0.97  | 0.99    |
| **Accuracy** | **0.98** | |
| **ROC-AUC**  | **0.9761** | |

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

### Train the Model (optional)

The pre-trained model is included. To retrain:

```bash
cd backend
python train_mlp.py
```

Requires the dataset NPZ file from the [Intent-Behavior Deviation Dataset](https://github.com/AbrarBb/Intent-Behavior-Deviation-Dataset).

## Tech Stack

- **Backend:** FastAPI, PyTorch, Sentence-Transformers, scikit-learn, Requests
- **Frontend:** Next.js (App Router), Vanilla CSS, Lucide-React
- **Model:** 3-layer MLP neural network (398→256→128→1)
- **Embeddings:** Sentence-BERT (`all-MiniLM-L6-v2`)

## Dataset

Based on the [Intent-Behavior Deviation Dataset](https://github.com/AbrarBb/Intent-Behavior-Deviation-Dataset) research project.

## License

MIT
