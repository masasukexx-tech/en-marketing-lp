import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ReplyInputSchema } from "@/lib/schemas";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { LEAD_STATUS_VALUES } from "@/lib/status";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const input = ReplyInputSchema.parse(await req.json());

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) return jsonError("候補者が見つかりません", 404);

    await logActivity({ leadId: params.id, type: "REPLY", content: input.content });

    let updated = lead;
    const repliedIdx = LEAD_STATUS_VALUES.indexOf("REPLIED");
    const currentIdx = LEAD_STATUS_VALUES.indexOf(lead.status as never);

    if (input.markAsReplied && (currentIdx === -1 || currentIdx < repliedIdx)) {
      updated = await prisma.lead.update({ where: { id: params.id }, data: { status: "REPLIED" } });
      await logActivity({
        leadId: params.id,
        type: "STATUS_CHANGE",
        fromStatus: lead.status,
        toStatus: "REPLIED",
      });
    }

    return NextResponse.json({ lead: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
