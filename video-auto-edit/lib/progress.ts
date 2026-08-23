import fs from "node:fs/promises";

import { ensureProgressDir, progressFilePath } from "./storage";

/**
 * 処理パイプラインの進捗ステージ。
 * transcribe.py もこのファイル形式(stage/stagePercent)に合わせて progress.json を書き込む。
 */
export type ProgressStage =
  | "extracting_audio"
  | "loading_model"
  | "transcribing"
  | "analyzing"
  | "saving"
  | "done"
  | "error";

export interface ProgressState {
  stage: ProgressStage;
  /** そのステージ内での進捗(0-100)。意味を持たない一瞬で終わるステージは0または100固定 */
  stagePercent: number;
  message?: string;
  updatedAt: string;
}

/** 各ステージが全体(0-100%)のうちどの範囲を占めるか（design doc §5のロードマップ順） */
const STAGE_RANGE: Record<ProgressStage, [number, number]> = {
  extracting_audio: [0, 5],
  loading_model: [5, 10],
  transcribing: [10, 85],
  analyzing: [85, 95],
  saving: [95, 100],
  done: [100, 100],
  error: [0, 0],
};

export function overallPercent(state: Pick<ProgressState, "stage" | "stagePercent">): number {
  const [start, end] = STAGE_RANGE[state.stage] ?? [0, 100];
  const clampedStagePercent = Math.min(100, Math.max(0, state.stagePercent));
  return Math.round(start + ((end - start) * clampedStagePercent) / 100);
}

export async function writeProgress(
  videoAssetId: string,
  stage: ProgressStage,
  stagePercent: number,
  message?: string
): Promise<void> {
  await ensureProgressDir();
  const state: ProgressState = { stage, stagePercent, message, updatedAt: new Date().toISOString() };
  const filePath = progressFilePath(videoAssetId);
  const tmpPath = `${filePath}.tmp`;
  // 読み取り側が中途半端なJSONを読まないよう、一時ファイルに書いてからrenameする
  await fs.writeFile(tmpPath, JSON.stringify(state), "utf-8");
  await fs.rename(tmpPath, filePath);
}

export async function readProgress(videoAssetId: string): Promise<ProgressState | null> {
  try {
    const raw = await fs.readFile(progressFilePath(videoAssetId), "utf-8");
    return JSON.parse(raw) as ProgressState;
  } catch {
    return null;
  }
}
