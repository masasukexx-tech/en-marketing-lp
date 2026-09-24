import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { automation?: string };
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      analyses: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!lead) notFound();

  return <LeadDetailClient initialLead={lead} automationResult={searchParams.automation} />;
}
