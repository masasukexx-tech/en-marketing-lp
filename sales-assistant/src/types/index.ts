import type {
  Activity,
  Company,
  FollowUp,
  Lead,
  MessageDraft,
  ProfileAnalysis,
} from "@prisma/client";

export type LeadDetail = Lead & {
  company: Company | null;
  analyses: ProfileAnalysis[];
  messages: MessageDraft[];
  activities: Activity[];
  followUps: FollowUp[];
};

export interface LeadProfileForAI {
  name: string;
  companyName: string;
  title?: string | null;
  industry?: string | null;
  location?: string | null;
  profileText?: string | null;
  workHistory?: string | null;
  recentPosts?: string | null;
  notes?: string | null;
}

export interface AnalysisSummaryForAI {
  overallScore: number;
  priority: string;
  reasons: string[];
  painPoints: string[];
  valueProps: string[];
  talkingPoints: string[];
}
