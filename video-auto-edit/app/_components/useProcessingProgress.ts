"use client";

import { useEffect, useState } from "react";

export interface ProgressInfo {
  stage: string | null;
  percent: number;
  message?: string;
}

const STAGE_LABELS: Record<string, string> = {
  extracting_audio: "音声抽出中",
  loading_model: "文字起こしモデル読み込み中",
  transcribing: "文字起こし中",
  analyzing: "無音・フィラー・言い直しを解析中",
  saving: "データ保存中",
  done: "完了",
  error: "エラー",
};

export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return "";
  return STAGE_LABELS[stage] ?? stage;
}

/** /api/videos/[id]/progress を一定間隔でポーリングする（activeがtrueの間のみ） */
export function useProcessingProgress(videoAssetId: string | null, active: boolean): ProgressInfo | null {
  const [progress, setProgress] = useState<ProgressInfo | null>(null);

  useEffect(() => {
    if (!videoAssetId || !active) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/videos/${videoAssetId}/progress`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as ProgressInfo;
        if (!cancelled) setProgress(data);
      } catch {
        // ポーリングの一時的な失敗は無視する
      }
    };

    tick();
    const timer = setInterval(tick, 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [videoAssetId, active]);

  return progress;
}
