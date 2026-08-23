import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** プロジェクト詳細（動画一覧・辞書一覧を含む） */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      videoAssets: { orderBy: { uploadedAt: "desc" } },
      dictionary: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...project,
    videoAssets: project.videoAssets.map((v) => ({ ...v, fileSizeBytes: v.fileSizeBytes.toString() })),
  });
}

const VALID_CUT_STRENGTHS = new Set(["weak", "standard", "strong"]);

/** カット強度(weak/standard/strong)の変更（design doc §3-4） */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { cutStrength } = (await request.json()) as { cutStrength?: string };

  if (!cutStrength || !VALID_CUT_STRENGTHS.has(cutStrength)) {
    return NextResponse.json({ error: "cutStrength must be one of weak/standard/strong" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: { cutStrength },
  });

  return NextResponse.json(project);
}
