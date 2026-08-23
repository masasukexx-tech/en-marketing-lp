"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** アップロード → 自動カット実行までを1画面で行うシンプルなトップページ（design doc §5-3, §1-5） */
export default function HomePage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatus("動画ファイルを選択してください");
      return;
    }

    setBusy(true);
    try {
      setStatus("アップロード中...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectName", projectName);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error(await uploadRes.text());
      const { videoAsset } = await uploadRes.json();

      setStatus("文字起こし・自動カット判定中...（動画の実尺の1〜3倍ほどかかります）");
      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoAssetId: videoAsset.id }),
      });
      if (!processRes.ok) throw new Error(await processRes.text());

      router.push(`/videos/${videoAsset.id}`);
    } catch (err) {
      setStatus(`エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 560 }}>
      <h1>AI動画自動編集システム</h1>
      <p style={{ opacity: 0.7 }}>クラウド従量課金ゼロ・すべてローカルPC上で完結（完全無料構成版）</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label>
          プロジェクト名
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="未入力ならファイル名を使用"
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        <label>
          動画ファイル
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "処理中..." : "アップロード＆自動カット実行"}
        </button>
      </form>

      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </main>
  );
}
