"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface DictionaryTerm {
  id: string;
  term: string;
  reading: string | null;
  category: string | null;
}

interface VideoAssetSummary {
  id: string;
  filename: string;
  durationSec: number;
}

interface ProjectDetail {
  id: string;
  name: string;
  cutStrength: string;
  videoAssets: VideoAssetSummary[];
  dictionary: DictionaryTerm[];
}

const CUT_STRENGTHS = ["weak", "standard", "strong"] as const;

/** プロジェクト詳細画面：カット強度設定・ユーザー辞書管理・動画一覧（design doc §1-1, §3-4） */
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState("");
  const [newReading, setNewReading] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${params.id}`);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setProject(await res.json());
  }

  useEffect(() => {
    load().catch((err) => setError(String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function updateCutStrength(cutStrength: string) {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cutStrength }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  async function addTerm(event: React.FormEvent) {
    event.preventDefault();
    if (!newTerm.trim()) return;
    const res = await fetch(`/api/projects/${params.id}/dictionary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: newTerm.trim(), reading: newReading.trim() || undefined }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setNewTerm("");
    setNewReading("");
    await load();
  }

  async function removeTerm(termId: string) {
    const res = await fetch(`/api/projects/${params.id}/dictionary`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termId }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  async function runProcess(videoAssetId: string) {
    setProcessingId(videoAssetId);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoAssetId }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      setError(String(err));
    } finally {
      setProcessingId(null);
    }
  }

  if (error) return <p>エラー: {error}</p>;
  if (!project) return <p>読み込み中...</p>;

  return (
    <main style={{ maxWidth: 720 }}>
      <p>
        <Link href="/projects">← プロジェクト一覧</Link>
      </p>
      <h1>{project.name}</h1>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>カット強度</h2>
        <p style={{ opacity: 0.7, fontSize: "0.9em" }}>
          strongほど積極的にカットします（design doc §3-4: confidenceが閾値未満の区間は自動カットせず候補にとどめます）
        </p>
        {CUT_STRENGTHS.map((s) => (
          <label key={s} style={{ marginRight: "1rem" }}>
            <input
              type="radio"
              name="cutStrength"
              checked={project.cutStrength === s}
              onChange={() => updateCutStrength(s)}
            />{" "}
            {s}
          </label>
        ))}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>ユーザー辞書（固有名詞リスト）</h2>
        <p style={{ opacity: 0.7, fontSize: "0.9em" }}>
          文字起こし時の initial_prompt に反映され、認識精度を補助します（design doc §1-1）。
        </p>
        <ul>
          {project.dictionary.map((t) => (
            <li key={t.id}>
              {t.term}
              {t.reading ? `（${t.reading}）` : ""}{" "}
              <button type="button" onClick={() => removeTerm(t.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addTerm} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="用語（例: 株式会社EN）"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
          />
          <input
            type="text"
            placeholder="読み（任意）"
            value={newReading}
            onChange={(e) => setNewReading(e.target.value)}
          />
          <button type="submit">追加</button>
        </form>
      </section>

      <section>
        <h2>動画一覧</h2>
        <p>
          <Link href={`/?projectId=${project.id}`}>＋ このプロジェクトに動画を追加</Link>
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {project.videoAssets.map((v) => (
            <li key={v.id} style={{ marginBottom: "0.5rem" }}>
              <Link href={`/videos/${v.id}`}>{v.filename}</Link>{" "}
              <button type="button" disabled={processingId === v.id} onClick={() => runProcess(v.id)}>
                {processingId === v.id ? "処理中..." : "再実行"}
              </button>
            </li>
          ))}
          {project.videoAssets.length === 0 && <p style={{ opacity: 0.7 }}>まだ動画がありません。</p>}
        </ul>
      </section>
    </main>
  );
}
