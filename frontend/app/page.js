"use client";

import { useState, useCallback } from "react";

/* ─────────── Header ─────────── */
function Header() {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-icon">🛡️</div>
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
        <span className="upload-icon">📄</span>
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
          <span className="file-info-icon">📋</span>
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
            ✕
          </button>
        </div>
      )}

      <button
        className="btn-primary"
        disabled={!file || loading}
        onClick={onAnalyze}
      >
        {loading ? "Analyzing…" : "🔍 Analyze Contract"}
      </button>

      <div className="guide-note">
        <span className="guide-note-icon">💡</span>
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
      <h3 className="section-title">🔬 Behavior Analysis Flags</h3>
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
          <span className="risk-icon">{isSafe ? "✅" : "🚨"}</span>
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
            <h3 className="section-title">💬 Extracted Intent Text</h3>
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
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeContract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/predict", {
        method: "POST",
        body: form,
      });

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
        <UploadZone
          file={file}
          setFile={setFile}
          onAnalyze={analyzeContract}
          loading={loading}
        />
      )}

      {error && (
        <div className="error-box">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <footer className="footer">
        PragmaGuard — Intent–Behavior Deviation Analysis for Smart Contract Security
      </footer>
    </div>
  );
}
