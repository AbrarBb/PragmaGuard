"use client";

import { useState, useCallback } from "react";
import { 
  ShieldCheck, 
  FileUp, 
  FileText, 
  X, 
  Search, 
  Lightbulb, 
  Microscope, 
  CheckCircle, 
  AlertOctagon, 
  MessageSquareQuote, 
  AlertTriangle 
} from "lucide-react";

/* ─────────── Header ─────────── */
function Header() {
  return (
    <header className="header">
      <div className="header-brand">
        <ShieldCheck className="header-icon" size={36} color="var(--accent-blue)" />
        <h1 className="header-title">PragmaGuard</h1>
      </div>
      <p className="header-subtitle">
        Upload a Solidity smart contract to check for rug-pull risk using
        ML-powered intent–behavior deviation analysis
      </p>
    </header>
  );
}

/* ─────────── Upload Zone ─────────── */
function UploadZone({ file, setFile, onAnalyze, loading }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && f.name.endsWith(".sol")) setFile(f);
    },
    [setFile]
  );

  const handleSelect = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  return (
    <div className="glass-card">
      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input").click()}
      >
        <FileUp className="upload-icon" size={48} color="var(--accent-blue)" />
        <p className="upload-label">
          {dragOver
            ? "Drop your .sol file here"
            : "Drag & drop a .sol file or click to browse"}
        </p>
        <p className="upload-hint">Supports Solidity source files up to 1 MB</p>
        <input
          id="file-input"
          className="file-input"
          type="file"
          accept=".sol"
          onChange={handleSelect}
        />
      </div>

      {file && (
        <div className="file-info">
          <FileText className="file-info-icon" size={24} color="var(--text-secondary)" />
          <div>
            <div className="file-info-name">{file.name}</div>
            <div className="file-info-size">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <button
            className="file-info-remove"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <button
        className="btn-primary"
        disabled={!file || loading}
        onClick={onAnalyze}
      >
        {loading ? "Analyzing…" : <><Search size={18} /> Analyze Contract</>}
      </button>

      <div className="guide-note">
        <Lightbulb className="guide-note-icon" size={20} color="var(--warning-color)" />
        <div className="guide-note-content">
          <p className="guide-note-title">Where to find .sol files?</p>
          <p className="guide-note-text">
            You can download verified Solidity source code from block explorers
            such as{" "}
            <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer">
              Etherscan
            </a>
            ,{" "}
            <a href="https://bscscan.com" target="_blank" rel="noopener noreferrer">
              BscScan
            </a>
            , or{" "}
            <a href="https://polygonscan.com" target="_blank" rel="noopener noreferrer">
              PolygonScan
            </a>
            . Navigate to any contract address, go to the{" "}
            <strong>Contract</strong> tab, and look for the{" "}
            <strong>Contract Source Code</strong> section. Copy the code into a{" "}
            <code>.sol</code> file and upload it here.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Paste Zone ─────────── */
function PasteZone({ pastedCode, setPastedCode, onAnalyze, loading }) {
  return (
    <div className="glass-card">
      <div className="paste-zone">
        <textarea
          className="code-textarea"
          placeholder="Paste your Solidity source code here..."
          value={pastedCode}
          onChange={(e) => setPastedCode(e.target.value)}
          disabled={loading}
          spellCheck="false"
        />
      </div>

      <button
        className="btn-primary"
        disabled={!pastedCode.trim() || loading}
        onClick={onAnalyze}
      >
        {loading ? "Analyzing…" : <><Search size={18} /> Analyze Code</>}
      </button>

      <div className="guide-note">
        <Lightbulb className="guide-note-icon" size={20} color="var(--warning-color)" />
        <div className="guide-note-content">
          <p className="guide-note-title">Where to find .sol files?</p>
          <p className="guide-note-text">
            You can copy verified Solidity source code from block explorers
            such as{" "}
            <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer">
              Etherscan
            </a>
            ,{" "}
            <a href="https://bscscan.com" target="_blank" rel="noopener noreferrer">
              BscScan
            </a>
            , or{" "}
            <a href="https://polygonscan.com" target="_blank" rel="noopener noreferrer">
              PolygonScan
            </a>
            . Navigate to any contract address, go to the{" "}
            <strong>Contract</strong> tab, and look for the{" "}
            <strong>Contract Source Code</strong> section. Copy the code and paste it here.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Address Zone ─────────── */
function AddressZone({ address, setAddress, network, setNetwork, onAnalyze, loading }) {
  return (
    <div className="glass-card">
      <div className="address-zone">
        <div className="address-inputs">
          <select 
            className="network-select" 
            value={network} 
            onChange={(e) => setNetwork(e.target.value)}
            disabled={loading}
          >
            <option value="ethereum">Ethereum (Etherscan)</option>
            <option value="bsc">BNB Chain (BscScan)</option>
            <option value="polygon">Polygon (PolygonScan)</option>
          </select>
          <input
            type="text"
            className="address-input"
            placeholder="0x..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            spellCheck="false"
          />
        </div>
      </div>

      <button
        className="btn-primary"
        disabled={!address.trim() || loading}
        onClick={onAnalyze}
      >
        {loading ? "Fetching & Analyzing…" : <><Search size={18} /> Fetch & Analyze</>}
      </button>

      <div className="guide-note">
        <Lightbulb className="guide-note-icon" size={20} color="var(--warning-color)" />
        <div className="guide-note-content">
          <p className="guide-note-title">How does this work?</p>
          <p className="guide-note-text">
            Enter a smart contract address. The backend will automatically fetch the verified source code from the selected block explorer and run it through the ML pipeline. If the contract is <strong>NOT VERIFIED</strong>, it will be immediately flagged as high risk.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Behavior Grid ─────────── */
const FLAG_LABELS = {
  owner_withdraw: "Owner Withdraw",
  emergency_withdraw: "Emergency Withdraw",
  unrestricted_mint: "Unrestricted Mint",
  regex_owner_withdraw: "Regex: Owner Withdraw",
  regex_emergency_withdraw: "Regex: Emergency Withdraw",
  regex_unrestricted_mint: "Regex: Unrestricted Mint",
  slither_ok: "Slither OK",
  slither_high_count: "Slither High Count",
  slither_arbitrary_send: "Slither Arbitrary Send",
  slither_suicidal: "Slither Suicidal",
  slither_unchecked_lowlevel: "Slither Unchecked Low-Level",
  slither_controlled_delegatecall: "Slither Controlled Delegatecall",
  slither_delegatecall_loop: "Slither Delegatecall Loop",
  slither_ownerish_any: "Slither Ownerish Any",
};

function BehaviorGrid({ flags }) {
  return (
    <div className="behavior-section">
      <h3 className="section-title">
        <Microscope size={20} color="var(--accent-blue)" /> Behavior Analysis Flags
      </h3>
      <div className="behavior-grid">
        {Object.entries(flags).map(([key, val]) => {
          const isFlagged = val > 0;
          return (
            <div
              key={key}
              className={`behavior-flag ${isFlagged ? "flagged" : "clean"}`}
            >
              <div
                className={`flag-indicator ${isFlagged ? "flagged" : "clean"}`}
              />
              <span className="flag-name">
                {FLAG_LABELS[key] || key}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Result Card ─────────── */
function ResultCard({ result, onReset }) {
  const isSafe = result.prediction === "safe";
  const cls = isSafe ? "safe" : "rugpull";
  const probPercent = (result.probability * 100).toFixed(1);

  return (
    <div className="result-section">
      <div className="glass-card">
        {/* Risk badge */}
        <div className={`risk-badge ${cls}`}>
          <span className="risk-icon">
            {isSafe ? <CheckCircle size={24} /> : <AlertOctagon size={24} />}
          </span>
          <span className="risk-label">
            {isSafe ? "SAFE" : "RUGPULL RISK"}
          </span>
        </div>

        {/* Probability bar */}
        <div className="prob-section">
          <div className="prob-header">
            <span className="prob-title">Rugpull Probability</span>
            <span className={`prob-value ${cls}`}>{probPercent}%</span>
          </div>
          <div className="prob-track">
            <div
              className={`prob-fill ${cls}`}
              style={{ width: `${probPercent}%` }}
            />
          </div>
        </div>

        {/* Meta chips */}
        <div className="meta-row">
          <div className={`meta-chip confidence-${result.confidence}`}>
            <span className="meta-chip-label">Confidence:</span>
            <span className="meta-chip-value">
              {result.confidence.toUpperCase()}
            </span>
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">Model:</span>
            <span className="meta-chip-value">{result.model_used}</span>
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">File:</span>
            <span className="meta-chip-value">{result.filename}</span>
          </div>
        </div>

        {/* Behavior flags */}
        <BehaviorGrid flags={result.behavior_flags} />

        {/* Intent snippet */}
        {result.intent_snippet && (
          <div className="intent-section">
            <h3 className="section-title">
              <MessageSquareQuote size={20} color="var(--accent-blue)" /> Extracted Intent Text
            </h3>
            <div className="intent-content">{result.intent_snippet}</div>
          </div>
        )}

        <button className="btn-secondary" onClick={onReset}>
          ← Analyze Another Contract
        </button>
      </div>
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export default function Home() {
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "paste" | "address"
  const [file, setFile] = useState(null);
  const [pastedCode, setPastedCode] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("ethereum");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeContract = async () => {
    if (inputMode === "upload" && !file) return;
    if (inputMode === "paste" && !pastedCode.trim()) return;
    if (inputMode === "address" && !address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let res;
      if (inputMode === "upload") {
        const form = new FormData();
        form.append("file", file);

        res = await fetch("/api/predict", {
          method: "POST",
          body: form,
        });
      } else if (inputMode === "paste") {
        res = await fetch("/api/predict_text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source_code: pastedCode }),
        });
      } else {
        res = await fetch("/api/predict_address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address, network }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPastedCode("");
    setAddress("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <Header />

      {loading ? (
        <div className="glass-card">
          <div className="spinner-container">
            <div className="spinner" />
            <p className="spinner-text">
              Running analysis pipeline… extracting intent, computing embeddings,
              evaluating behavior flags
            </p>
          </div>
        </div>
      ) : result ? (
        <ResultCard result={result} onReset={reset} />
      ) : (
        <div className="input-section">
          <div className="tab-switcher">
            <button
              className={`tab-btn ${inputMode === "upload" ? "active" : ""}`}
              onClick={() => setInputMode("upload")}
            >
              Upload File
            </button>
            <button
              className={`tab-btn ${inputMode === "paste" ? "active" : ""}`}
              onClick={() => setInputMode("paste")}
            >
              Paste Code
            </button>
            <button
              className={`tab-btn ${inputMode === "address" ? "active" : ""}`}
              onClick={() => setInputMode("address")}
            >
              Fetch Address
            </button>
          </div>
          
          {inputMode === "upload" ? (
            <UploadZone
              file={file}
              setFile={setFile}
              onAnalyze={analyzeContract}
              loading={loading}
            />
          ) : inputMode === "paste" ? (
            <PasteZone
              pastedCode={pastedCode}
              setPastedCode={setPastedCode}
              onAnalyze={analyzeContract}
              loading={loading}
            />
          ) : (
            <AddressZone
              address={address}
              setAddress={setAddress}
              network={network}
              setNetwork={setNetwork}
              onAnalyze={analyzeContract}
              loading={loading}
            />
          )}
        </div>
      )}

      {error && (
        <div className="error-box">
          <AlertTriangle size={20} color="var(--error-color)" />
          <span>{error}</span>
        </div>
      )}

      <footer className="footer">
        PragmaGuard — Intent–Behavior Deviation Analysis for Smart Contract Security
      </footer>
    </div>
  );
}
