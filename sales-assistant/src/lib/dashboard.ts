import { prisma } from "./db";
import { computeDashboardStats, type DashboardStats } from "./stats";

async function countLeadsEverReached(toStatus: string): Promise<number> {
  const rows = await prisma.activity.findMany({
    where: { type: "STATUS_CHANGE", toStatus },
    select: { leadId: true },
    distinct: ["leadId"],
  });
  return rows.length;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const totalLeads = await prisma.lead.count();

  const reviewedRows = await prisma.profileAnalysis.findMany({
    select: { leadId: true },
    distinct: ["leadId"],
  });

  const [requestSentCount, connectedCount, dmSentCount, meetingCount] = await Promise.all([
    countLeadsEverReached("REQUEST_SENT"),
    countLeadsEverReached("CONNECTED"),
    countLeadsEverReached("DM_SENT"),
    countLeadsEverReached("MEETING"),
  ]);

  const repliedLeadRows = await prisma.activity.findMany({
    where: { OR: [{ type: "REPLY" }, { type: "STATUS_CHANGE", toStatus: "REPLIED" }] },
    select: { leadId: true },
    distinct: ["leadId"],
  });

  return computeDashboardStats({
    totalLeads,
    reviewedCount: reviewedRows.length,
    requestSentCount,
    connectedCount,
    dmSentCount,
    repliedCount: repliedLeadRows.length,
    meetingCount,
  });
}
