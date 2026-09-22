import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EN LinkedIn営業支援",
  description: "株式会社EN LinkedIn営業を半自動化する営業支援ツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
