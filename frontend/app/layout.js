import "./globals.css";

export const metadata = {
  title: "PragmaGuard",
  description:
    "Smart Contract Rugpull Detection & Forensic Analysis using ML-powered intent-behavior deviation analysis.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
