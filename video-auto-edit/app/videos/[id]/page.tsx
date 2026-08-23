"use client";

import { useEffect, useRef, useState } from "react";

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

/** カット/候補区間の色分け（design doc §3-4: 復元されたものは"残す"扱い） */
function segmentColor(d: EditDecision): string {
  if (d.decision === "keep" || d.restored) return "#2e7d32";
  if (d.decision === "candidate") return "#f9a825";
  return "#c62828";
}

/** 確認画面：動画プレビュー＋ハイライトバーでカット/候補区間を確認し、誤削除を復元できる（design doc §3-4, §5-14） */
export default function VideoReviewPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<VideoAssetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  function seekTo(sec: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
    }
  }

  async function submitManualCut(event: React.FormEvent) {
    event.preventDefault();
    const start = Number(manualStart);
    const end = Number(manualEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setError("開始秒より終了秒が大きい数値を入力してください");
      return;
    }
    const res = await fetch(`/api/videos/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceStart: start, sourceEnd: end }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setManualStart("");
    setManualEnd("");
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

      <video
        ref={videoRef}
        src={`/api/videos/${data.id}/source`}
        controls
        style={{ width: "100%", background: "#000" }}
      />

      <div
        style={{
          display: "flex",
          width: "100%",
          height: 24,
          marginTop: 4,
          marginBottom: "1rem",
          border: "1px solid #444",
        }}
        title="緑=保持 / 黄=候補(要確認) / 赤=カット。クリックでその位置に再生ジャンプ"
      >
        {data.editDecisions.map((d) => (
          <div
            key={d.id}
            onClick={() => seekTo(d.sourceStart)}
            style={{
              width: `${((d.sourceEnd - d.sourceStart) / Math.max(data.durationSec, 0.001)) * 100}%`,
              background: segmentColor(d),
              cursor: "pointer",
              minWidth: 1,
            }}
          />
        ))}
      </div>

      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1em", marginBottom: 4 }}>手動カット</h2>
        <p style={{ fontSize: "0.85em", opacity: 0.7, marginTop: 0 }}>
          AIの自動判定では拾えない「そもそも不要な部分」（冒頭の雑談など）を、秒数を指定して直接カットできます。
          「現在位置」ボタンで動画プレビューの再生位置を入力欄に反映できます。
        </p>
        <form onSubmit={submitManualCut} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <label>
            開始(秒)
            <input
              type="number"
              step="0.1"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
              style={{ width: 90, marginLeft: 4 }}
            />
          </label>
          <button type="button" onClick={() => setManualStart(String(videoRef.current?.currentTime ?? 0))}>
            現在位置
          </button>
          <label>
            終了(秒)
            <input
              type="number"
              step="0.1"
              value={manualEnd}
              onChange={(e) => setManualEnd(e.target.value)}
              style={{ width: 90, marginLeft: 4 }}
            />
          </label>
          <button type="button" onClick={() => setManualEnd(String(videoRef.current?.currentTime ?? 0))}>
            現在位置
          </button>
          <button type="submit">この区間をカット</button>
        </form>
      </section>

      <a href={`/api/export?videoAssetId=${data.id}`}>
        <button type="button" style={{ marginBottom: "0.25rem" }}>
          Premiere用データをZIPでエクスポート
        </button>
      </a>
      <p style={{ fontSize: "0.85em", opacity: 0.7, marginTop: 0, marginBottom: "1rem" }}>
        ZIP内の project.xml はPremiereの「ファイル &gt; 読み込み」（プロジェクトパネルの「メディアを読み込む」ではありません）で開いてください。
        字幕は project.xml には含めていません。captions.srt を単独で読み込むとPremiereのネイティブ字幕トラックとして追加されます。
      </p>

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
                <button type="button" onClick={() => seekTo(d.sourceStart)} style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer" }}>
                  {formatTime(d.sourceStart)} - {formatTime(d.sourceEnd)}
                </button>
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
