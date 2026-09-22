import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NoteInputSchema } from "@/lib/schemas";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const input = NoteInputSchema.parse(await req.json());

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) return jsonError("候補者が見つかりません", 404);

    await logActivity({ leadId: params.id, type: "NOTE", content: input.content });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
