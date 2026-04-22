#  PragmaGuard

**Forensic Smart Contract Rugpull Detection** powered by ML-based intent–behavior deviation analysis.

PragmaGuard provides an instant rugpull risk assessment for Solidity (`.sol`) smart contracts using a sophisticated multi-model ensemble trained on 3,300+ verified contracts.

![PragmaGuard Banner](https://github.com/AbrarBb/PragmaGuard/raw/main/frontend/public/logo.png)

##  Key Features

-   **Multi-Modal Analysis**: Drag & drop `.sol` files, paste raw code, or fetch directly from Ethereum, BSC, or Polygon block explorers.
-   **On-Chain Forensics (Etherscan V2)**: Connects to block explorers to fetch verified source code automatically for deep inspection.
-   **Ensemble Intelligence System**:
    -   **Tier-1**: Classical ML (Random Forest) for robust baseline detection.
    -   **Tier-2**: 3-Layer MLP Neural Network for complex non-linear pattern recognition.
    -   **Tier-3**: 5-Layer Deep MLP for deep feature interaction analysis.
    -   **Consensus Engine**: Combines predictions via Majority Voting and Weighted Average (weighted by model F1-scores).
-   **Intent–Behavior Deviation Engine**: Extracts developer intent from comments (NatSpec) using `Sentence-BERT` and compares it against 14+ detected behavioral flags (Owner Withdraw, Emergency Withdraw, Unrestricted Mint, etc.).
-   **Forensic Reporting & PDF Export**: Generates a natural language explanation of risks. Export the entire analysis as a premium, high-fidelity PDF report for audits.
-   **Premium Forensic UI**: A state-of-the-art **Slate & Midnight Blue** interface with theme-aware Light/Dark modes, designed for professional auditors.

---

##  How to Use PragmaGuard

### 1. Choose Your Input Method
PragmaGuard offers three ways to analyze a contract:
-   **Upload**: Drag and drop your `.sol` file into the upload zone.
-   **Paste**: Switch to the "Paste Code" tab and paste the Solidity source code directly.
-   **Address**: Enter a contract address and select the network (Ethereum, BSC, or Polygon). PragmaGuard will fetch the verified source code via Etherscan.

### 2. Run Forensic Analysis
Click the **"Analyze Contract"** button. The backend will:
-   Extract comments and behavioral markers.
-   Vectorize the data using Sentence-BERT.
-   Run the data through the 3-model ensemble.

### 3. Review the Results
-   **Risk Gauge**: View the overall rugpull probability and confidence level.
-   **Ensemble Breakdown**: See exactly how each model (Random Forest vs. MLP) voted.
-   **Behavioral Flags**: Inspect specific high-risk functions detected in the code.
-   **Detailed Breakdown**: Read a natural language summary explaining *why* the contract was flagged.

### 4. Export Report
Click **"Download PDF Report"** to generate a professional audit document you can share with your team or community.

---

##  Technical Architecture

### How This Tool Was Made

PragmaGuard was built to bridge the gap between "what a developer says" and "what the code actually does."

#### The ML Pipeline
1.  **Feature Extraction**: The tool extracts 398 dimensions of features.
    -   **384-d**: SBERT embeddings (`all-MiniLM-L6-v2`) of the contract's intent (comments/NatSpec).
    -   **14-d**: Binary behavioral heuristic flags (e.g., `is_owner_withdraw`, `unrestricted_minting`).
2.  **Normalization**: Features are passed through a `StandardScaler` trained on the research dataset.
3.  **Ensemble Inference**:
    -   **Tier-1 (RF)**: Handled by `scikit-learn`.
    -   **Tier-2 & 3 (MLP)**: Custom PyTorch neural networks optimized for high recall on rugpull patterns.

#### The Frontend Design System
The UI was meticulously crafted using **Vanilla CSS** with a custom Slate/Navy theme engine.
-   **Theme Engine**: Uses CSS variables (`--bg-primary`, `--accent-blue`) for instant, high-contrast switching between Light and Dark forensic modes.
-   **Component Architecture**: Built with **Next.js (App Router)** for fast rendering and a smooth, single-page application experience.
-   **PDF Generation**: Uses `html2canvas` and `jsPDF` to render the React DOM directly into a high-fidelity vector PDF.

---

##  Model Performance

| Metric     | Random Forest | MLP 3-Layer | Deep MLP 5-Layer |
|------------|---------------|-------------|------------------|
| **F1-Score** | 0.9745        | 0.9700      | 0.9750           |
| **ROC-AUC**  | 0.9730        | 0.9700      | 0.9748           |

---

##  Installation & Setup

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend/` directory:
```env
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

Start the server:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [PragmaGuard](https://huggingface.co/spaces/aklajim/PragmaGuard).

---

##  Dataset Reference
Based on the [Intent-Behavior Deviation Dataset](https://github.com/AbrarBb/Intent-Behavior-Deviation-Dataset) research project.

##  License
MIT License - Developed by **Abrar**
