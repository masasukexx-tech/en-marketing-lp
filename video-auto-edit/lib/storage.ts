import path from "node:path";
import fs from "node:fs/promises";

/**
 * design doc §1-4 のフォルダ構成:
 * storage/projects/{project_id}/{original,audio,edited,captions,transcript,timeline,premiere}/
 */
const STORAGE_ROOT = path.join(process.cwd(), "storage");

export function projectDir(projectId: string): string {
  return path.join(STORAGE_ROOT, "projects", projectId);
}

export const projectPaths = {
  original: (projectId: string, filename: string) => path.join(projectDir(projectId), "original", filename),
  audio: (projectId: string, filename: string) => path.join(projectDir(projectId), "audio", filename),
  edited: (projectId: string, filename: string) => path.join(projectDir(projectId), "edited", filename),
  captions: (projectId: string, filename: string) => path.join(projectDir(projectId), "captions", filename),
  transcript: (projectId: string, filename: string) => path.join(projectDir(projectId), "transcript", filename),
  timeline: (projectId: string, filename: string) => path.join(projectDir(projectId), "timeline", filename),
  premiere: (projectId: string, filename: string) => path.join(projectDir(projectId), "premiere", filename),
};

const SUBDIRS = ["original", "audio", "edited", "captions", "transcript", "timeline", "premiere"] as const;

export async function ensureProjectDirs(projectId: string): Promise<void> {
  await Promise.all(SUBDIRS.map((dir) => fs.mkdir(path.join(projectDir(projectId), dir), { recursive: true })));
}

/**
 * 処理進捗ファイル（videoAssetId単位、プロジェクトをまたいでフラットに配置）。
 * 確認画面から短い間隔でポーリングされるため、プロジェクトのDB参照無しで
 * 直接パスを組み立てられるようにしている。
 */
export function progressFilePath(videoAssetId: string): string {
  return path.join(STORAGE_ROOT, "progress", `${videoAssetId}.json`);
}

export async function ensureProgressDir(): Promise<void> {
  await fs.mkdir(path.join(STORAGE_ROOT, "progress"), { recursive: true });
}
