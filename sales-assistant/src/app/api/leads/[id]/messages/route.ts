import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, parseJsonArray } from "@/lib/api-utils";
import { checkLeadMessage, generateLeadMessages } from "@/lib/ai-service";
import { logActivity } from "@/lib/activity";
import { MESSAGE_TYPES } from "@/lib/status";
import type { AnalysisSummaryForAI, LeadProfileForAI } from "@/types";

const BodySchema = z.object({
  type: z.enum(MESSAGE_TYPES),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { type } = BodySchema.parse(await req.json());

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!lead) return jsonError("候補者が見つかりません", 404);

    const profile: LeadProfileForAI = {
      name: lead.name,
      companyName: lead.companyName,
      title: lead.title,
      industry: lead.industry,
      location: lead.location,
      profileText: lead.profileText,
      workHistory: lead.workHistory,
      recentPosts: lead.recentPosts,
      notes: lead.notes,
    };

    const latestAnalysis = lead.analyses[0];
    const analysisSummary: AnalysisSummaryForAI | null = latestAnalysis
      ? {
          overallScore: latestAnalysis.overallScore,
          priority: latestAnalysis.priority,
          reasons: parseJsonArray<string>(latestAnalysis.reasons),
          painPoints: parseJsonArray<string>(latestAnalysis.painPoints),
          valueProps: parseJsonArray<string>(latestAnalysis.valueProps),
          talkingPoints: parseJsonArray<string>(latestAnalysis.talkingPoints),
        }
      : null;

    const { result, modelUsed } = await generateLeadMessages({ lead: profile, type, analysis: analysisSummary });

    const drafts = [];
    let anyAutoRevised = false;

    for (const variant of result.variants) {
      let finalContent = variant.content;
      let checkPayload: Record<string, unknown> | null = null;

      try {
        const { result: check } = await checkLeadMessage({ lead: profile, type, content: variant.content });
        const autoRevised = !check.overallPassed && Boolean(check.revisedContent);
        if (autoRevised) {
          finalContent = check.revisedContent as string;
          anyAutoRevised = true;
        }
        checkPayload = { ...check, autoRevised };
      } catch (checkError) {
        // チェック自体が失敗しても文面生成は失敗させず、未チェックとして保存する
        console.error("message check failed", checkError);
        checkPayload = { skipped: true, reason: "チェック処理に失敗しました" };
      }

      const draft = await prisma.messageDraft.create({
        data: {
          leadId: lead.id,
          type,
          variant: variant.variant,
          label: variant.label,
          content: finalContent,
          profileSnapshot: JSON.stringify(profile),
          checkResult: JSON.stringify(checkPayload),
          modelUsed,
        },
      });
      drafts.push(draft);
    }

    await logActivity({
      leadId: lead.id,
      type: "MESSAGE_GENERATED",
      content: `${type === "CONNECTION_REQUEST" ? "つながり申請文" : "初回DM"}を${drafts.length}パターン生成${anyAutoRevised ? "（一部自動修正あり）" : ""}`,
    });

    return NextResponse.json({
      drafts,
      missingInfo: result.missingInfo,
      suggestedInfo: result.suggestedInfo,
      genericWarning: result.genericWarning,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
