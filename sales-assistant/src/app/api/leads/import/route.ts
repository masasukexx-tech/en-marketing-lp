import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLeadsCsv } from "@/lib/csv";
import { LeadInputSchema } from "@/lib/schemas";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const csvText: string | undefined = body?.csv;
    if (!csvText || typeof csvText !== "string") {
      return jsonError("CSVテキストが送信されていません", 400);
    }

    const { leads, errors } = parseLeadsCsv(csvText);

    const created: string[] = [];
    const rowErrors: { row: number; message: string }[] = [...errors];

    for (let i = 0; i < leads.length; i++) {
      const row = leads[i];
      const parsed = LeadInputSchema.safeParse(row);
      if (!parsed.success) {
        rowErrors.push({
          row: i + 2,
          message: parsed.error.issues.map((iss) => iss.message).join(" / "),
        });
        continue;
      }
      const input = parsed.data;

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
          source: input.source || "CSV一括登録",
          status: "CANDIDATE",
        },
      });

      await logActivity({ leadId: lead.id, type: "STATUS_CHANGE", toStatus: "CANDIDATE" });
      created.push(lead.id);
    }

    return NextResponse.json({
      createdCount: created.length,
      createdIds: created,
      errors: rowErrors,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
