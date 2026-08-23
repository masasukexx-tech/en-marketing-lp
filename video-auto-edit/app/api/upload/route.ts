import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { probeVideo } from "@/lib/ffmpeg";
import { ensureProjectDirs, projectPaths } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * 素材アップロード（design doc §5-3）。
 * multipart/form-data で file (必須), projectName (新規プロジェクト作成時), projectId (既存プロジェクトへ追加) を受け取る。
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const projectName = formData.get("projectName");
  const projectId = formData.get("projectId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  let project = typeof projectId === "string" && projectId ? await prisma.project.findUnique({ where: { id: projectId } }) : null;

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: typeof projectName === "string" && projectName ? projectName : file.name,
        settings: JSON.stringify({ autoCut: true }),
      },
    });
  }

  await ensureProjectDirs(project.id);

  // 同一プロジェクトに同名ファイルを複数回アップロードしても上書きされないよう、
  // 保存パスにはユニークな接頭辞を付ける（表示用の filename は元のファイル名のまま保持）
  const storedFilename = `${randomUUID()}-${file.name}`;
  const destPath = projectPaths.original(project.id, storedFilename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(destPath, buffer);

  const metadata = await probeVideo(destPath);

  const videoAsset = await prisma.videoAsset.create({
    data: {
      projectId: project.id,
      storagePath: destPath,
      filename: file.name,
      durationSec: metadata.durationSec,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      fileSizeBytes: BigInt(buffer.byteLength),
    },
  });

  return NextResponse.json({
    project: { id: project.id, name: project.name },
    videoAsset: { ...videoAsset, fileSizeBytes: videoAsset.fileSizeBytes.toString() },
  });
}
