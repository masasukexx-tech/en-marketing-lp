import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
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
