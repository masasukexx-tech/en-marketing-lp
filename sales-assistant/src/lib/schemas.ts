import { z } from "zod";
import { LEAD_STATUS_VALUES } from "./status";

// ---------- リード登録・更新 ----------

export const LeadInputSchema = z.object({
  linkedinUrl: z
    .string()
    .trim()
    .min(1, "LinkedInプロフィールURLは必須です")
    .refine((v) => v.includes("linkedin.com/"), {
      message: "LinkedInのプロフィールURLを入力してください",
    }),
  name: z.string().trim().min(1, "氏名は必須です"),
  companyName: z.string().trim().min(1, "会社名は必須です"),
  title: z.string().trim().optional().or(z.literal("")),
  industry: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().optional().or(z.literal("")),
  profileText: z.string().trim().optional().or(z.literal("")),
  workHistory: z.string().trim().optional().or(z.literal("")),
  recentPosts: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  source: z.string().trim().optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;

export const StatusChangeSchema = z.object({
  status: z.enum(LEAD_STATUS_VALUES),
  note: z.string().trim().optional(),
});

export const FollowUpInputSchema = z.object({
  dueDate: z.string().min(1, "次回対応日は必須です"),
  memo: z.string().trim().optional(),
});

export const ReplyInputSchema = z.object({
  content: z.string().trim().min(1, "返信内容を入力してください"),
  markAsReplied: z.boolean().optional().default(true),
});

export const NoteInputSchema = z.object({
  content: z.string().trim().min(1, "メモを入力してください"),
});

// ---------- AI: 相性判定 ----------

export const PrioritySchema = z.enum(["A", "B", "C"]);

export const AnalysisResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  customerScore: z.number().int().min(0).max(100),
  partnerScore: z.number().int().min(0).max(100),
  priority: PrioritySchema,
  reasons: z.array(z.string().min(1)).min(1).max(6),
  painPoints: z.array(z.string().min(1)).max(6),
  valueProps: z.array(z.string().min(1)).max(6),
  talkingPoints: z.array(z.string().min(1)).max(6),
  cautions: z.string().nullable().optional(),
  missingInfo: z.array(z.string()).default([]),
  suggestedInfo: z.array(z.string()).default([]),
  genericWarning: z.boolean().default(false),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ---------- AI: メッセージ生成（つながり申請文 / 初回DM 共通） ----------

export const MessageVariantSchema = z.object({
  variant: z.string().min(1),
  label: z.string().min(1),
  content: z.string().min(1),
});

export const MessageGenerationResultSchema = z.object({
  missingInfo: z.array(z.string()).default([]),
  suggestedInfo: z.array(z.string()).default([]),
  genericWarning: z.boolean().default(false),
  variants: z.array(MessageVariantSchema).min(1).max(3),
});

export type MessageGenerationResult = z.infer<typeof MessageGenerationResultSchema>;

// ---------- AI: 文面チェック ----------

export const CHECK_CRITERIA = [
  { id: "salesy", label: "売り込み感が強すぎないか" },
  { id: "templatey", label: "定型文に見えないか" },
  { id: "specific", label: "相手固有の内容が含まれているか" },
  { id: "keigo", label: "不自然な敬語がないか" },
  { id: "fabrication", label: "事実を捏造していないか" },
  { id: "length", label: "長すぎないか" },
  { id: "question", label: "返信しやすい質問があるか" },
] as const;

export const CheckCriterionIdSchema = z.enum(
  CHECK_CRITERIA.map((c) => c.id) as [string, ...string[]],
);

export const MessageCheckResultSchema = z.object({
  issues: z
    .array(
      z.object({
        id: CheckCriterionIdSchema,
        passed: z.boolean(),
        comment: z.string(),
      }),
    )
    .min(1),
  overallPassed: z.boolean(),
  revisedContent: z.string().nullable(),
});

export type MessageCheckResult = z.infer<typeof MessageCheckResultSchema>;

// ---------- CSVインポート確認 ----------

export const CsvImportConfirmSchema = z.object({
  rows: z.array(LeadInputSchema).min(1),
});
