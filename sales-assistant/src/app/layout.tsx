import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "@/components/layout/main-nav";
import { isAnthropicConfigured } from "@/lib/anthropic";

export const metadata: Metadata = {
  title: "EN LinkedIn営業支援",
  description: "株式会社EN LinkedIn営業を半自動化するローカル営業支援ツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const mockMode = !isAnthropicConfigured();

  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <MainNav />
          {mockMode && (
            <div className="border-b border-sky-900 bg-sky-950/60 px-4 py-1.5 text-center text-xs text-sky-300">
              ANTHROPIC_API_KEY未設定のため、相性判定・文面生成はモックモードで動作しています。
            </div>
          )}
          <main className="flex-1">
            <div className="container max-w-7xl py-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
