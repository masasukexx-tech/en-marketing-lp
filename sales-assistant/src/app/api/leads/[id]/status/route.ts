import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { StatusChangeSchema } from "@/lib/schemas";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const input = StatusChangeSchema.parse(await req.json());

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) return jsonError("候補者が見つかりません", 404);

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: { status: input.status },
    });

    await logActivity({
      leadId: params.id,
      type: "STATUS_CHANGE",
      fromStatus: lead.status,
      toStatus: input.status,
      content: input.note || null,
    });

    return NextResponse.json({ lead: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
