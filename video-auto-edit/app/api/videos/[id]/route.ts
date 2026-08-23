import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { splitDecisionsWithManualCut } from "@/lib/manual-cut";
import { rebuildTimelineAndCaptions } from "@/lib/rebuild";

export const runtime = "nodejs";

function serialize(videoAsset: { fileSizeBytes: bigint }) {
  return { ...videoAsset, fileSizeBytes: videoAsset.fileSizeBytes.toString() };
}

/** 確認画面用データ取得（design doc §5-14） */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const videoAsset = await prisma.videoAsset.findUnique({
    where: { id: params.id },
    include: {
      editDecisions: { orderBy: { sourceStart: "asc" } },
      timelineClips: { orderBy: { orderIndex: "asc" } },
      captions: { orderBy: { timelineStart: "asc" } },
    },
  });

  if (!videoAsset) {
    return NextResponse.json({ error: "video asset not found" }, { status: 404 });
  }

  return NextResponse.json(serialize(videoAsset));
}

/**
 * 誤削除された区間の復元操作（design doc §3-4）。
 * body: { editDecisionId: string, restored: boolean }
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { editDecisionId, restored } = (await request.json()) as {
    editDecisionId?: string;
    restored?: boolean;
  };

  if (!editDecisionId || typeof restored !== "boolean") {
    return NextResponse.json({ error: "editDecisionId and restored are required" }, { status: 400 });
  }

  const decision = await prisma.editDecision.findUnique({ where: { id: editDecisionId } });
  if (!decision || decision.videoAssetId !== params.id) {
    return NextResponse.json({ error: "edit decision not found" }, { status: 404 });
  }

  await prisma.editDecision.update({ where: { id: editDecisionId }, data: { restored } });
  const result = await rebuildTimelineAndCaptions(params.id);

  return NextResponse.json({ ok: true, ...result });
}

/**
 * 任意区間の手動カット（design doc の自動判定では拾えない「そもそも不要な部分」向け）。
 * body: { sourceStart: number, sourceEnd: number } （元動画のソース秒）
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { sourceStart, sourceEnd } = (await request.json()) as { sourceStart?: number; sourceEnd?: number };

  if (typeof sourceStart !== "number" || typeof sourceEnd !== "number" || !(sourceEnd > sourceStart)) {
    return NextResponse.json(
      { error: "sourceStart/sourceEnd must be numbers with sourceEnd > sourceStart" },
      { status: 400 }
    );
  }

  const videoAsset = await prisma.videoAsset.findUnique({ where: { id: params.id } });
  if (!videoAsset) {
    return NextResponse.json({ error: "video asset not found" }, { status: 404 });
  }
  if (sourceStart < 0 || sourceEnd > videoAsset.durationSec) {
    return NextResponse.json({ error: "range must be within [0, durationSec]" }, { status: 400 });
  }

  const existing = await prisma.editDecision.findMany({ where: { videoAssetId: params.id } });
  const updated = splitDecisionsWithManualCut(existing, sourceStart, sourceEnd);

  await prisma.$transaction([
    prisma.editDecision.deleteMany({ where: { videoAssetId: params.id } }),
    prisma.editDecision.createMany({ data: updated.map((d) => ({ ...d, videoAssetId: params.id })) }),
  ]);

  const result = await rebuildTimelineAndCaptions(params.id);
  return NextResponse.json({ ok: true, ...result });
}
