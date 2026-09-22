import { MainNav } from "@/components/layout/main-nav";
import { isAiConfigured } from "@/lib/ai";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const mockMode = !isAiConfigured();

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      {mockMode && (
        <div className="border-b border-sky-900 bg-sky-950/60 px-4 py-1.5 text-center text-xs text-sky-300">
          GEMINI_API_KEY未設定のため、相性判定・文面生成はモックモードで動作しています。
        </div>
      )}
      <main className="flex-1">
        <div className="container max-w-7xl py-6">{children}</div>
      </main>
    </div>
  );
}
