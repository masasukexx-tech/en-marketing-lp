"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ProjectSummary {
  id: string;
  name: string;
  cutStrength: string;
  createdAt: string;
  videoAssets: Array<{ id: string; filename: string; durationSec: number }>;
  dictionary: Array<{ id: string }>;
}

/** プロジェクト一覧画面 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        setProjects(await res.json());
      })
      .catch((err) => setError(String(err)));
  }, []);

  if (error) return <p>エラー: {error}</p>;
  if (!projects) return <p>読み込み中...</p>;

  return (
    <main style={{ maxWidth: 720 }}>
      <h1>プロジェクト一覧</h1>
      <p>
        <Link href="/">＋ 新しい動画をアップロード</Link>
      </p>

      {projects.length === 0 && <p style={{ opacity: 0.7 }}>まだプロジェクトがありません。</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {projects.map((p) => (
          <li key={p.id} style={{ border: "1px solid #333", borderRadius: 8, padding: "1rem", marginBottom: "0.75rem" }}>
            <Link href={`/projects/${p.id}`} style={{ fontWeight: "bold" }}>
              {p.name}
            </Link>
            <div style={{ opacity: 0.7, fontSize: "0.9em" }}>
              カット強度: {p.cutStrength} / 動画: {p.videoAssets.length}本 / 辞書: {p.dictionary.length}件
            </div>
            <ul>
              {p.videoAssets.map((v) => (
                <li key={v.id}>
                  <Link href={`/videos/${v.id}`}>{v.filename}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
