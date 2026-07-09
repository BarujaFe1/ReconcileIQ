import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReconcileIQ — Reconciliation Intelligence",
  description:
    "Match orders, payments and fees with confidence scores, exception inbox and audit trail.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
