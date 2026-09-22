import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "@/components/layout/main-nav";

export const metadata: Metadata = {
  title: "EN LinkedIn営業支援",
  description: "株式会社EN LinkedIn営業を半自動化するローカル営業支援ツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <MainNav />
          <main className="flex-1">
            <div className="container max-w-7xl py-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
