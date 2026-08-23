import fs from "node:fs/promises";

import archiver from "archiver";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateFcpxml, generateSrt } from "@/lib/premiere-export";
import { projectPaths } from "@/lib/storage";

export const runtime = "nodejs";

/** Premiere Pro向けXML(Final Cut Pro 7形式) + SRT を生成し ZIP でダウンロードさせる（design doc §4, §5-16〜17） */
export async function GET(request: NextRequest) {
  const videoAssetId = request.nextUrl.searchParams.get("videoAssetId");
  if (!videoAssetId) {
    return NextResponse.json({ error: "videoAssetId is required" }, { status: 400 });
  }

  const videoAsset = await prisma.videoAsset.findUnique({
    where: { id: videoAssetId },
    include: {
      timelineClips: { orderBy: { orderIndex: "asc" } },
      captions: { orderBy: { timelineStart: "asc" } },
    },
  });
  if (!videoAsset) {
    return NextResponse.json({ error: "video asset not found" }, { status: 404 });
  }

  const premiereXml = generateFcpxml(
    {
      filename: videoAsset.filename,
      absolutePath: videoAsset.storagePath,
      durationSec: videoAsset.durationSec,
      width: videoAsset.width,
      height: videoAsset.height,
      fps: videoAsset.fps,
    },
    videoAsset.timelineClips
  );
  const srt = generateSrt(videoAsset.captions);

  // プロジェクト内に複数動画がある場合に書き出しファイルが上書きされないよう、videoAssetIdでファイル名を分ける
  await fs.writeFile(projectPaths.premiere(videoAsset.projectId, `${videoAsset.id}.xml`), premiereXml, "utf-8");
  await fs.writeFile(projectPaths.captions(videoAsset.projectId, `${videoAsset.id}.srt`), srt, "utf-8");

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const finished = new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", reject);
  });

  archive.append(premiereXml, { name: "premiere/project.xml" });
  archive.append(srt, { name: "captions/captions.srt" });
  await archive.finalize();
  await finished;

  const zipBuffer = Buffer.concat(chunks);

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${videoAsset.filename}-export.zip"`,
    },
  });
}
