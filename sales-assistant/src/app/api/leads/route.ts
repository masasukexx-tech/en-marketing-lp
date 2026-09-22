import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LeadInputSchema } from "@/lib/schemas";
import { handleApiError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { listLeads, parseLeadListParams } from "@/lib/leads";

export async function GET(req: NextRequest) {
  try {
    const params = parseLeadListParams(req.nextUrl.searchParams);
    const result = await listLeads(params);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = LeadInputSchema.parse(body);

    const company = await prisma.company.upsert({
      where: { name: input.companyName },
      update: { industry: input.industry || undefined },
      create: { name: input.companyName, industry: input.industry || undefined },
    });

    const lead = await prisma.lead.create({
      data: {
        linkedinUrl: input.linkedinUrl,
        name: input.name,
        companyName: input.companyName,
        companyId: company.id,
        title: input.title || null,
        industry: input.industry || null,
        location: input.location || null,
        profileText: input.profileText || null,
        workHistory: input.workHistory || null,
        recentPosts: input.recentPosts || null,
        notes: input.notes || null,
        source: input.source || null,
        status: "CANDIDATE",
      },
    });

    await logActivity({ leadId: lead.id, type: "STATUS_CHANGE", toStatus: "CANDIDATE" });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
