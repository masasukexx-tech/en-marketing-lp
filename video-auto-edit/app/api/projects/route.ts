import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** プロジェクト一覧（design doc §1-4: プロジェクト単位でstorageを管理） */
export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      videoAssets: { orderBy: { uploadedAt: "desc" } },
      dictionary: true,
    },
  });

  const serialized = projects.map((p) => ({
    ...p,
    videoAssets: p.videoAssets.map((v) => ({ ...v, fileSizeBytes: v.fileSizeBytes.toString() })),
  }));

  return NextResponse.json(serialized);
}
