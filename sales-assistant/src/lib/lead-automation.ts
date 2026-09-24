import type { LeadProfileForAI } from "@/types";

export const DEFAULT_AUTO_MESSAGE_SCORE_THRESHOLD = 80;

export function getAutoMessageScoreThreshold(value = process.env.AUTO_MESSAGE_SCORE_THRESHOLD): number {
  if (!value) return DEFAULT_AUTO_MESSAGE_SCORE_THRESHOLD;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100
    ? parsed
    : DEFAULT_AUTO_MESSAGE_SCORE_THRESHOLD;
}

export function hasEnoughProfileForAutoAnalysis(lead: LeadProfileForAI): boolean {
  const hasIdentity = Boolean(lead.name.trim() && (lead.companyName.trim() || lead.title?.trim()));
  const hasContext = Boolean(lead.profileText?.trim() || lead.workHistory?.trim());
  return hasIdentity && hasContext;
}

export function shouldAutoGenerateConnectionRequest(
  overallScore: number,
  threshold = getAutoMessageScoreThreshold(),
): boolean {
  return overallScore >= threshold;
}

