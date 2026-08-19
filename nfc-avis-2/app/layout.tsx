import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFC Avis — Collectez plus d'avis Google",
  description: "Vos clients scannent, ils notent, vous récoltez des avis Google en un geste.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
