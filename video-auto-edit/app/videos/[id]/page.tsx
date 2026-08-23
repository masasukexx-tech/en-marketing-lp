"use client";

import { useEffect, useState } from "react";

interface EditDecision {
  id: string;
  sourceStart: number;
  sourceEnd: number;
  decision: "keep" | "cut" | "candidate";
  reason: string;
  reasonDetail: string | null;
  confidence: number;
  restored: boolean;
}

interface VideoAssetDetail {
  id: string;
  filename: string;
  durationSec: number;
  editDecisions: EditDecision[];
  timelineClips: unknown[];
  captions: unknown[];
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

/** 確認画面：カット/候補区間をプレビューし、誤削除を復元できる（design doc §3-4, §5-14） */
export default function VideoReviewPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<VideoAssetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/videos/${params.id}`);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setData(await res.json());
  }

  useEffect(() => {
    load().catch((err) => setError(String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function toggleRestore(decision: EditDecision) {
    const res = await fetch(`/api/videos/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editDecisionId: decision.id, restored: !decision.restored }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  if (error) return <p>エラー: {error}</p>;
  if (!data) return <p>読み込み中...</p>;

  const problems = data.editDecisions.filter((d) => d.decision !== "keep");

  return (
    <main style={{ maxWidth: 800 }}>
      <h1>{data.filename}</h1>
      <p style={{ opacity: 0.7 }}>
        尺: {formatTime(data.durationSec)} / タイムラインクリップ数: {data.timelineClips.length} / キャプション数:{" "}
        {data.captions.length}
      </p>

      <a href={`/api/export?videoAssetId=${data.id}`}>
        <button type="button" style={{ marginBottom: "1rem" }}>
          Premiere用データをZIPでエクスポート
        </button>
      </a>

      <h2>カット / 候補区間（{problems.length}件）</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
            <th>区間</th>
            <th>判定</th>
            <th>理由</th>
            <th>確信度</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #2a2a2a" }}>
              <td>
                {formatTime(d.sourceStart)} - {formatTime(d.sourceEnd)}
              </td>
              <td>
                {d.decision}
                {d.restored ? " (復元済み)" : ""}
              </td>
              <td>
                {d.reason}
                {d.reasonDetail ? `: ${d.reasonDetail}` : ""}
              </td>
              <td>{d.confidence.toFixed(2)}</td>
              <td>
                <button type="button" onClick={() => toggleRestore(d)}>
                  {d.restored ? "取り消す" : "復元(残す)"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
