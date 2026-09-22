import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";

const BodySchema = z.object({
  editedContent: z.string().trim().min(1).optional(),
  adopted: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; messageId: string } },
) {
  try {
    const input = BodySchema.parse(await req.json());

    const draft = await prisma.messageDraft.findUnique({ where: { id: params.messageId } });
    if (!draft || draft.leadId !== params.id) return jsonError("文面が見つかりません", 404);

    const updated = await prisma.messageDraft.update({
      where: { id: params.messageId },
      data: {
        ...(input.editedContent !== undefined ? { editedContent: input.editedContent } : {}),
        ...(input.adopted !== undefined ? { adopted: input.adopted } : {}),
      },
    });

    if (input.adopted) {
      await logActivity({
        leadId: params.id,
        type: "MESSAGE_COPIED",
        content: `${draft.type === "CONNECTION_REQUEST" ? "つながり申請文" : "初回DM"}（${draft.label}）をコピー・採用`,
      });
    }

    return NextResponse.json({ draft: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
