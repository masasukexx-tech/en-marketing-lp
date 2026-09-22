import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LeadInputSchema } from "@/lib/schemas";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        analyses: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
        followUps: { orderBy: { dueDate: "asc" } },
        company: true,
      },
    });

    if (!lead) return jsonError("候補者が見つかりません", 404);

    return NextResponse.json({ lead });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const input = LeadInputSchema.partial().parse(body);

    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError("候補者が見つかりません", 404);

    let companyId = existing.companyId;
    if (input.companyName && input.companyName !== existing.companyName) {
      const company = await prisma.company.upsert({
        where: { name: input.companyName },
        update: { industry: input.industry || undefined },
        create: { name: input.companyName, industry: input.industry || undefined },
      });
      companyId = company.id;
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.companyName !== undefined ? { companyName: input.companyName, companyId } : {}),
        ...(input.title !== undefined ? { title: input.title || null } : {}),
        ...(input.industry !== undefined ? { industry: input.industry || null } : {}),
        ...(input.location !== undefined ? { location: input.location || null } : {}),
        ...(input.profileText !== undefined ? { profileText: input.profileText || null } : {}),
        ...(input.workHistory !== undefined ? { workHistory: input.workHistory || null } : {}),
        ...(input.recentPosts !== undefined ? { recentPosts: input.recentPosts || null } : {}),
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
        ...(input.source !== undefined ? { source: input.source || null } : {}),
      },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    return handleApiError(error);
  }
}
