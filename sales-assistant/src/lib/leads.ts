import { prisma } from "./db";
import { LEAD_STATUS_VALUES } from "./status";

export type LeadRow = Awaited<ReturnType<typeof prisma.lead.findMany>>[number];

export interface LeadListParams {
  status?: string | null;
  priority?: string | null;
  industry?: string | null;
  title?: string | null;
  minScore?: string | null;
  customerCandidate?: boolean;
  partnerCandidate?: boolean;
  q?: string | null;
  sort?: string | null;
  page?: number;
  pageSize?: number;
  registeredFrom?: string | null;
  registeredTo?: string | null;
  nextActionFrom?: string | null;
  nextActionTo?: string | null;
}

export interface LeadListResult {
  leads: LeadRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function parseLeadListParams(sp: URLSearchParams): LeadListParams {
  return {
    status: sp.get("status"),
    priority: sp.get("priority"),
    industry: sp.get("industry"),
    title: sp.get("title"),
    minScore: sp.get("minScore"),
    customerCandidate: sp.get("customerCandidate") === "true",
    partnerCandidate: sp.get("partnerCandidate") === "true",
    q: sp.get("q"),
    sort: sp.get("sort"),
    page: Math.max(1, Number(sp.get("page") || "1")),
    pageSize: Math.min(200, Math.max(1, Number(sp.get("pageSize") || "50"))),
    registeredFrom: sp.get("registeredFrom"),
    registeredTo: sp.get("registeredTo"),
    nextActionFrom: sp.get("nextActionFrom"),
    nextActionTo: sp.get("nextActionTo"),
  };
}

export async function listLeads(params: LeadListParams): Promise<LeadListResult> {
  const where: Record<string, unknown> = {};

  if (params.status) {
    const statuses = params.status.split(",").filter((s) => LEAD_STATUS_VALUES.includes(s as never));
    if (statuses.length) where.status = { in: statuses };
  }
  if (params.priority) {
    const priorities = params.priority.split(",").filter((p) => ["A", "B", "C"].includes(p));
    if (priorities.length) where.priority = { in: priorities };
  }
  if (params.industry) where.industry = { contains: params.industry, mode: "insensitive" };
  if (params.title) where.title = { contains: params.title, mode: "insensitive" };
  if (params.minScore) where.overallScore = { gte: Number(params.minScore) };
  if (params.customerCandidate) where.isCustomerLead = true;
  if (params.partnerCandidate) where.isPartnerLead = true;
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { companyName: { contains: params.q, mode: "insensitive" } },
      { profileText: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.registeredFrom || params.registeredTo) {
    where.createdAt = {
      ...(params.registeredFrom ? { gte: new Date(params.registeredFrom) } : {}),
      ...(params.registeredTo ? { lte: endOfDay(params.registeredTo) } : {}),
    };
  }
  if (params.nextActionFrom || params.nextActionTo) {
    where.nextActionDate = {
      ...(params.nextActionFrom ? { gte: new Date(params.nextActionFrom) } : {}),
      ...(params.nextActionTo ? { lte: endOfDay(params.nextActionTo) } : {}),
    };
  }

  const leads = await prisma.lead.findMany({ where });
  const sorted = sortLeads(leads, params.sort || "created_desc");

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const start = (page - 1) * pageSize;

  return {
    leads: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
  };
}

function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function sortLeads(leads: LeadRow[], sort: string): LeadRow[] {
  const arr = [...leads];
  switch (sort) {
    case "score_desc":
      return arr.sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));
    case "next_action_asc":
      return arr.sort((a, b) => {
        if (!a.nextActionDate && !b.nextActionDate) return 0;
        if (!a.nextActionDate) return 1;
        if (!b.nextActionDate) return -1;
        return new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime();
      });
    case "unhandled_first": {
      const statusOrder = LEAD_STATUS_VALUES;
      return arr.sort((a, b) => {
        const aOverdue = a.nextActionDate ? new Date(a.nextActionDate).getTime() <= Date.now() : false;
        const bOverdue = b.nextActionDate ? new Date(b.nextActionDate).getTime() <= Date.now() : false;
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        const aHas = Boolean(a.nextActionDate);
        const bHas = Boolean(b.nextActionDate);
        if (aHas !== bHas) return aHas ? -1 : 1;
        if (aHas && bHas) {
          const diff = new Date(a.nextActionDate!).getTime() - new Date(b.nextActionDate!).getTime();
          if (diff !== 0) return diff;
        }
        const aIdx = statusOrder.indexOf(a.status as never);
        const bIdx = statusOrder.indexOf(b.status as never);
        if (aIdx !== bIdx) return aIdx - bIdx;
        return (a.priority ?? "Z").localeCompare(b.priority ?? "Z");
      });
    }
    case "created_desc":
    default:
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
