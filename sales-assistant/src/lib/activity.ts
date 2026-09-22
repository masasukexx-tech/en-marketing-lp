import { prisma } from "./db";
import type { ActivityType } from "./status";

export async function logActivity(params: {
  leadId: string;
  type: ActivityType;
  fromStatus?: string | null;
  toStatus?: string | null;
  content?: string | null;
}) {
  return prisma.activity.create({
    data: {
      leadId: params.leadId,
      type: params.type,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus ?? null,
      content: params.content ?? null,
    },
  });
}
