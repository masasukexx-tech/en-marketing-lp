import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * ユーザー辞書（固有名詞リスト）の追加。faster-whisper の initial_prompt に反映される
 * （design doc §1-1, §5-7）。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { term, reading, category } = (await request.json()) as {
    term?: string;
    reading?: string;
    category?: string;
  };

  if (!term) {
    return NextResponse.json({ error: "term is required" }, { status: 400 });
  }

  const entry = await prisma.dictionaryTerm.create({
    data: { projectId: params.id, term, reading: reading || null, category: category || null },
  });

  return NextResponse.json(entry);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { termId } = (await request.json()) as { termId?: string };
  if (!termId) {
    return NextResponse.json({ error: "termId is required" }, { status: 400 });
  }

  const term = await prisma.dictionaryTerm.findUnique({ where: { id: termId } });
  if (!term || term.projectId !== params.id) {
    return NextResponse.json({ error: "dictionary term not found" }, { status: 404 });
  }

  await prisma.dictionaryTerm.delete({ where: { id: termId } });
  return NextResponse.json({ ok: true });
}
