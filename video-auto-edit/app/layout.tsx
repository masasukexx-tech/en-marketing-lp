import type { ReactNode } from "react";

export const metadata = {
  title: "AI動画自動編集システム",
  description: "ローカル完結・完全無料構成のAI動画自動編集ツール",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "sans-serif", margin: 0, padding: "2rem", background: "#0b0b0c", color: "#eee" }}>
        {children}
      </body>
    </html>
  );
}
