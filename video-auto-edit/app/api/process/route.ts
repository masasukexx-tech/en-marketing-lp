import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { extractAudio } from "@/lib/ffmpeg";
import { generateEditDecisions, type TranscriptSegmentLike, type CutStrength } from "@/lib/edit-decision";
import { rebuildTimelineAndCaptions } from "@/lib/rebuild";
import { projectPaths } from "@/lib/storage";

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

  const audioPath = projectPaths.audio(videoAsset.projectId, `${videoAsset.id}.wav`);
  await extractAudio(videoAsset.storagePath, audioPath);

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
  ]);

  const transcriptRaw = JSON.parse(await fs.readFile(transcriptJsonPath, "utf-8")) as TranscribeOutput;
  const analysisOutputJsonPath = projectPaths.transcript(videoAsset.projectId, `${videoAsset.id}.analysis.json`);

  const editDecisionRows = await generateEditDecisions({
    audioPath,
    durationSec: videoAsset.durationSec,
    segments: transcriptRaw.segments,
    transcriptJsonPath,
    analysisOutputJsonPath,
    cutStrength: (videoAsset.project.cutStrength as CutStrength) ?? "standard",
  });

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

  return NextResponse.json({
    ok: true,
    transcriptId: transcript.id,
    editDecisions: editDecisionRows.length,
    timelineClips,
    captions,
  });
}
