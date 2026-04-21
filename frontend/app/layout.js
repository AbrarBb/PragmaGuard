import "./globals.css";

export const metadata = {
  title: "PragmaGuard — Smart Contract Rugpull Detector",
  description:
    "Upload a Solidity smart contract to analyze rug-pull risk using ML-powered intent-behavior deviation analysis. Powered by Sentence-BERT embeddings and behavioral heuristics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
