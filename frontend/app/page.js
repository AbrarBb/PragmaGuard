"use client";

import { useState, useCallback, useEffect } from "react";
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
  AlertTriangle,
  Users,
  BarChart3,
  Layers,
  Download,
  Sun,
  Moon,
  ArrowLeft
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ─────────── Header ─────────── */
function Header({ theme, toggleTheme }) {
  return (
    <header className="header">
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
      <div className="header-brand">
        <img src="/logo.png?v=2" alt="PragmaGuard Logo" className="header-logo" />
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
        <Microscope size={22} className="section-title-icon" /> Behavior Analysis Flags
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

/* ─────────── Explanation Generator ─────────── */
function generateExplanation(result) {
  const isSafe = result.prediction === "safe";
  const confidence = result.confidence;
  const flags = Object.keys(result.behavior_flags || {}).filter(k => result.behavior_flags[k] > 0);

  if (result.model_used && result.model_used.includes("Heuristic")) {
    return "This contract was immediately flagged because its source code is NOT VERIFIED on the blockchain explorer. Unverified contracts are extremely high risk as their underlying logic is hidden.";
  }

  let explanation = `The multi-model ensemble predicts this contract is ${isSafe ? 'SAFE' : 'a RUGPULL RISK'} with ${confidence} confidence. `;

  if (!isSafe) {
    if (flags.length > 0) {
      explanation += `The analysis identified ${flags.length} high-risk behavioral flag(s): ${flags.map(f => FLAG_LABELS[f] || f).join(', ')}. `;
      explanation += `The intent extracted from the developer's comments strongly deviates from the actual operations performed by the code.`;
    } else {
      explanation += `Although no explicit malicious behavioral flags were matched by regular expressions, the deep learning models detected anomalous structural patterns that typically indicate hidden rugpull mechanisms.`;
    }
  } else {
    if (flags.length > 0) {
      explanation += `Despite identifying some potentially sensitive functions (${flags.map(f => FLAG_LABELS[f] || f).join(', ')}), the ensemble model determined that their usage is benign and matches the stated developer intent, classifying the overall contract as safe.`;
    } else {
      explanation += `No malicious behavioral flags were detected, and the code structure aligns perfectly with standard, safe contract templates.`;
    }
  }
  return explanation;
}

/* ─────────── Ensemble Section ─────────── */
function EnsembleSection({ ensemble }) {
  if (!ensemble) return null;

  const { individual_predictions, majority_vote, weighted_average } = ensemble;

  return (
    <div className="ensemble-section">
      <h3 className="section-title">
        <Layers size={22} className="section-title-icon" /> Ensemble Model Breakdown
      </h3>

      {/* Individual Model Predictions Table */}
      <div className="ensemble-subsection">
        <h4 className="ensemble-subtitle">
          <Users size={16} color="var(--text-secondary)" /> Individual Model Predictions
        </h4>
        <div className="ensemble-table">
          <div className="ensemble-table-header">
            <span className="ensemble-col-model">Model</span>
            <span className="ensemble-col-verdict">Verdict</span>
            <span className="ensemble-col-prob">Probability</span>
            <span className="ensemble-col-conf">Confidence</span>
          </div>
          {individual_predictions.map((pred, idx) => {
            const predCls = pred.label === "safe" ? "safe" : "rugpull";
            return (
              <div key={idx} className="ensemble-table-row">
                <span className="ensemble-col-model">{pred.model_name}</span>
                <span className={`ensemble-col-verdict ensemble-verdict-${predCls}`}>
                  {pred.label === "safe" ? (
                    <><CheckCircle size={14} /> SAFE</>
                  ) : (
                    <><AlertOctagon size={14} /> RUGPULL</>
                  )}
                </span>
                <span className="ensemble-col-prob">
                  {(pred.prob * 100).toFixed(1)}%
                </span>
                <span className={`ensemble-col-conf confidence-badge-${pred.confidence}`}>
                  {pred.confidence.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Majority Vote and Weighted Average side by side */}
      <div className="ensemble-strategies">
        <div className="ensemble-strategy-card">
          <h4 className="ensemble-subtitle">
            <Users size={16} color="var(--text-secondary)" /> Majority Vote
          </h4>
          <div className={`ensemble-strategy-result ${majority_vote.label === "safe" ? "safe" : "rugpull"}`}>
            <span className="ensemble-strategy-label">
              {majority_vote.label === "safe" ? (
                <><CheckCircle size={18} /> SAFE</>
              ) : (
                <><AlertOctagon size={18} /> RUGPULL</>
              )}
            </span>
            <span className="ensemble-strategy-detail">
              Agreement: {majority_vote.agreement}
            </span>
          </div>
        </div>

        <div className="ensemble-strategy-card">
          <h4 className="ensemble-subtitle">
            <BarChart3 size={16} color="var(--text-secondary)" /> Weighted Average
          </h4>
          <div className={`ensemble-strategy-result ${weighted_average.label === "safe" ? "safe" : "rugpull"}`}>
            <span className="ensemble-strategy-label">
              {weighted_average.label === "safe" ? (
                <><CheckCircle size={18} /> SAFE</>
              ) : (
                <><AlertOctagon size={18} /> RUGPULL</>
              )}
            </span>
            <span className="ensemble-strategy-detail">
              {(weighted_average.prob * 100).toFixed(1)}% — {weighted_average.confidence.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Result Card ─────────── */
function ResultCard({ result, onReset }) {
  const [downloading, setDownloading] = useState(false);
  const isSafe = result.prediction === "safe";
  const cls = isSafe ? "safe" : "rugpull";
  const probPercent = (result.probability * 100).toFixed(1);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#000000",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollY: -window.scrollY,
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Create a PDF with a custom height to fit the entire content on one page
      const pdf = new jsPDF("p", "mm", [pdfWidth, pdfHeight]);

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PragmaGuard_Report_${result.filename.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="result-section">
      <div className="glass-card" id="report-content">
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
            <span className="meta-chip-label">File:</span>
            <span className="meta-chip-value">{result.filename}</span>
          </div>
        </div>

        {/* Ensemble Breakdown */}
        {result.ensemble && <EnsembleSection ensemble={result.ensemble} />}

        {/* Behavior flags */}
        {result.behavior_flags && Object.keys(result.behavior_flags).length > 0 && (
          <BehaviorGrid flags={result.behavior_flags} />
        )}

        {/* Detailed Explanation */}
        <div className="explanation-section">
          <h3 className="section-title">
            <ShieldCheck size={20} color="var(--text-primary)" /> Detailed Breakdown
          </h3>
          <p className="explanation-text">{generateExplanation(result)}</p>
        </div>

        {/* Intent snippet */}
        {result.intent_snippet && (
          <div className="intent-section">
            <h3 className="section-title">
              <MessageSquareQuote size={20} color="var(--text-primary)" /> Extracted Intent Text
            </h3>
            <div className="intent-content">{result.intent_snippet}</div>
          </div>
        )}
      </div>

      <div className="result-actions">
        <button
          className="btn-primary"
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? "Generating PDF..." : <><Download size={18} /> Download PDF Report</>}
        </button>
        <button className="btn-secondary" onClick={onReset}>
          <ArrowLeft size={18} /> Analyze Another Contract
        </button>
      </div>
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export default function Home() {
  const [theme, setTheme] = useState('dark');
  const [inputMode, setInputMode] = useState("upload"); // "upload" | "paste" | "address"
  const [file, setFile] = useState(null);
  const [pastedCode, setPastedCode] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("ethereum");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

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
      <Header theme={theme} toggleTheme={toggleTheme} />

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
        <div className="footer-content">
          <p className="footer-title">
            © 2026 <strong>PragmaGuard</strong>
          </p>

          <div className="footer-actions">
            <a
              href="https://github.com/AbrarBb/PragmaGuard"
              target="_blank"
              rel="noopener noreferrer"
              className="github-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="github-icon"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577
          0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754
          -1.089-.745.082-.729.082-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305
          3.492.998.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.93
          0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23
          .957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.296-1.23
          3.296-1.23.653 1.653.241 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22
          0 4.61-2.804 5.624-5.475 5.921.43.372.823 1.102.823 2.222
          0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12
          24 5.37 18.63 0 12 0z" />
              </svg>
              <span>View Repository</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
