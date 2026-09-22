import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { analyzeLeadCompatibility } from "@/lib/ai-service";
import { logActivity } from "@/lib/activity";
import type { LeadProfileForAI } from "@/types";

const CANDIDATE_THRESHOLD = 60;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
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

    const { result, raw, modelUsed } = await analyzeLeadCompatibility(profile);

    const analysis = await prisma.profileAnalysis.create({
      data: {
        leadId: lead.id,
        overallScore: result.overallScore,
        customerScore: result.customerScore,
        partnerScore: result.partnerScore,
        priority: result.priority,
        reasons: JSON.stringify(result.reasons),
        painPoints: JSON.stringify(result.painPoints),
        valueProps: JSON.stringify(result.valueProps),
        talkingPoints: JSON.stringify(result.talkingPoints),
        cautions: result.cautions ?? null,
        missingInfo: JSON.stringify(result.missingInfo),
        suggestedInfo: JSON.stringify(result.suggestedInfo),
        genericWarning: result.genericWarning,
        rawResponse: JSON.stringify(raw),
        modelUsed,
      },
    });

    const nextStatus = lead.status === "CANDIDATE" ? "REVIEWED" : lead.status;

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        overallScore: result.overallScore,
        customerScore: result.customerScore,
        partnerScore: result.partnerScore,
        priority: result.priority,
        isCustomerLead: result.customerScore >= CANDIDATE_THRESHOLD,
        isPartnerLead: result.partnerScore >= CANDIDATE_THRESHOLD,
        status: nextStatus,
      },
    });

    await logActivity({
      leadId: lead.id,
      type: "ANALYSIS",
      content: `相性判定を実施（総合${result.overallScore}点 / 優先度${result.priority}）`,
    });

    if (nextStatus !== lead.status) {
      await logActivity({
        leadId: lead.id,
        type: "STATUS_CHANGE",
        fromStatus: lead.status,
        toStatus: nextStatus,
      });
    }

    return NextResponse.json({ lead: updated, analysis });
  } catch (error) {
    return handleApiError(error);
  }
}
