import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { extractAudio } from "@/lib/ffmpeg";
import { generateEditDecisions, type TranscriptSegmentLike, type CutStrength } from "@/lib/edit-decision";
import { rebuildTimelineAndCaptions } from "@/lib/rebuild";
import { writeProgress } from "@/lib/progress";
import { progressFilePath, projectPaths } from "@/lib/storage";

export const runtime = "nodejs";

function runPythonScript(scriptRelPath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = process.env.PYTHON_BIN ?? "python3";
    const child = spawn(bin, [path.join(process.cwd(), scriptRelPath), ...args]);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptRelPath} exited with code ${code}: ${stderr}`));
    });
  });
}

interface TranscribeOutput {
  engine: string;
  language: string;
  segments: TranscriptSegmentLike[];
}

/**
 * 文字起こし → 無音/フィラー/言い直し解析 → EditDecision/TimelineClip/Caption 生成までの
 * 一連のパイプラインをキックする（design doc §5-6〜§5-13、ロードマップ全体をここで統合）。
 * 処理中は lib/progress.ts 経由で progress.json に進捗を書き込み、
 * GET /api/videos/[id]/progress からポーリングできるようにする。
 */
export async function POST(request: NextRequest) {
  const { videoAssetId } = (await request.json()) as { videoAssetId?: string };
  if (!videoAssetId) {
    return NextResponse.json({ error: "videoAssetId is required" }, { status: 400 });
  }

  const videoAsset = await prisma.videoAsset.findUnique({
    where: { id: videoAssetId },
    include: { project: { include: { dictionary: true } } },
  });
  if (!videoAsset) {
    return NextResponse.json({ error: "video asset not found" }, { status: 404 });
  }

  try {
    await writeProgress(videoAssetId, "extracting_audio", 0);
    const audioPath = projectPaths.audio(videoAsset.projectId, `${videoAsset.id}.wav`);
    await extractAudio(videoAsset.storagePath, audioPath);
    await writeProgress(videoAssetId, "extracting_audio", 100);

    const transcriptJsonPath = projectPaths.transcript(videoAsset.projectId, `${videoAsset.id}.json`);
    const initialPrompt = videoAsset.project.dictionary.map((d) => d.term).join(", ");

    await runPythonScript("scripts/transcribe.py", [
      audioPath,
      transcriptJsonPath,
      "--model",
      process.env.WHISPER_MODEL ?? "large-v3",
      "--language",
      "ja",
      "--initial-prompt",
      initialPrompt,
      "--progress-path",
      progressFilePath(videoAssetId),
    ]);

    const transcriptRaw = JSON.parse(await fs.readFile(transcriptJsonPath, "utf-8")) as TranscribeOutput;
    const analysisOutputJsonPath = projectPaths.transcript(videoAsset.projectId, `${videoAsset.id}.analysis.json`);

    await writeProgress(videoAssetId, "analyzing", 0);
    const editDecisionRows = await generateEditDecisions({
      audioPath,
      durationSec: videoAsset.durationSec,
      segments: transcriptRaw.segments,
      transcriptJsonPath,
      analysisOutputJsonPath,
      cutStrength: (videoAsset.project.cutStrength as CutStrength) ?? "standard",
    });
    await writeProgress(videoAssetId, "analyzing", 100);

    await writeProgress(videoAssetId, "saving", 0);
    await prisma.$transaction([
      prisma.transcript.deleteMany({ where: { videoAssetId } }),
      prisma.editDecision.deleteMany({ where: { videoAssetId } }),
      prisma.timelineClip.deleteMany({ where: { videoAssetId } }),
      prisma.caption.deleteMany({ where: { videoAssetId } }),
    ]);

    const transcript = await prisma.transcript.create({
      data: {
        videoAssetId,
        engine: transcriptRaw.engine,
        language: transcriptRaw.language,
        segments: {
          create: transcriptRaw.segments.map((seg) => ({
            text: seg.text,
            startSec: seg.startSec,
            endSec: seg.endSec,
            confidence: seg.confidence,
            words: {
              create: seg.words.map((w) => ({
                word: w.word,
                startSec: w.startSec,
                endSec: w.endSec,
                confidence: w.confidence,
              })),
            },
          })),
        },
      },
    });

    await prisma.editDecision.createMany({
      data: editDecisionRows.map((d) => ({ ...d, videoAssetId })),
    });

    const { timelineClips, captions } = await rebuildTimelineAndCaptions(videoAssetId);
    await writeProgress(videoAssetId, "saving", 100);
    await writeProgress(videoAssetId, "done", 100);

    return NextResponse.json({
      ok: true,
      transcriptId: transcript.id,
      editDecisions: editDecisionRows.length,
      timelineClips,
      captions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await writeProgress(videoAssetId, "error", 0, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
