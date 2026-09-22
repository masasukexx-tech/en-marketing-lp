import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FollowUpInputSchema } from "@/lib/schemas";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { formatDate } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const input = FollowUpInputSchema.parse(await req.json());

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) return jsonError("候補者が見つかりません", 404);

    const dueDate = new Date(input.dueDate);
    if (Number.isNaN(dueDate.getTime())) return jsonError("次回対応日の形式が不正です", 400);

    const followUp = await prisma.followUp.create({
      data: { leadId: params.id, dueDate, memo: input.memo || null },
    });

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: { nextActionDate: dueDate },
    });

    await logActivity({
      leadId: params.id,
      type: "FOLLOW_UP",
      content: `次回対応日を${formatDate(dueDate)}に設定${input.memo ? `（${input.memo}）` : ""}`,
    });

    return NextResponse.json({ lead: updated, followUp });
  } catch (error) {
    return handleApiError(error);
  }
}
