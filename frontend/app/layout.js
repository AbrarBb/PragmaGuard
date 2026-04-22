import "./globals.css";

export const metadata = {
  title: "PragmaGuard",
  description:
    "Advanced Smart Contract Rugpull Detection & Forensic Analysis using ML-powered intent-behavior deviation analysis.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
