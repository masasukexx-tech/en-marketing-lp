import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { checkLeadMessage } from "@/lib/ai-service";
import type { LeadProfileForAI } from "@/types";

const BodySchema = z.object({
  content: z.string().trim().min(1).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; messageId: string } },
) {
  try {
    const { content } = BodySchema.parse(await req.json().catch(() => ({})));

    const draft = await prisma.messageDraft.findUnique({
      where: { id: params.messageId },
      include: { lead: true },
    });
    if (!draft || draft.leadId !== params.id) return jsonError("文面が見つかりません", 404);

    const targetContent = content ?? draft.editedContent ?? draft.content;

    const profile: LeadProfileForAI = {
      name: draft.lead.name,
      companyName: draft.lead.companyName,
      title: draft.lead.title,
      industry: draft.lead.industry,
      location: draft.lead.location,
      profileText: draft.lead.profileText,
      workHistory: draft.lead.workHistory,
      recentPosts: draft.lead.recentPosts,
      notes: draft.lead.notes,
    };

    const { result } = await checkLeadMessage({
      lead: profile,
      type: draft.type as "CONNECTION_REQUEST" | "FIRST_DM",
      content: targetContent,
    });

    const updated = await prisma.messageDraft.update({
      where: { id: draft.id },
      data: { checkResult: JSON.stringify({ ...result, autoRevised: false, manualRecheck: true }) },
    });

    return NextResponse.json({ check: result, draft: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
