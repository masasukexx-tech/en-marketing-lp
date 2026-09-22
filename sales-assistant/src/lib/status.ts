// 営業ステータスの一元管理。DBには value(英語コード) を保存し、UIでは label(日本語) を表示する。

export const LEAD_STATUSES = [
  { value: "CANDIDATE", label: "候補" },
  { value: "REVIEWED", label: "審査済み" },
  { value: "APPROVED", label: "アプローチ承認" },
  { value: "REQUEST_SENT", label: "つながり申請済み" },
  { value: "CONNECTED", label: "接続済み" },
  { value: "DM_DRAFTED", label: "初回DM作成済み" },
  { value: "DM_SENT", label: "初回DM送信済み" },
  { value: "REPLIED", label: "返信あり" },
  { value: "SCHEDULING", label: "日程調整中" },
  { value: "MEETING", label: "商談化" },
  { value: "PASSED", label: "見送り" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export const LEAD_STATUS_VALUES = LEAD_STATUSES.map((s) => s.value) as [
  LeadStatus,
  ...LeadStatus[],
];

export function statusLabel(value: string): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.label ?? value;
}

// ステータスに応じたバッジの色調（EN配色: 黒地にオレンジ基調、進捗が進むほど暖色に）
export const STATUS_BADGE_STYLE: Record<LeadStatus, string> = {
  CANDIDATE: "bg-neutral-800 text-neutral-300 border-neutral-700",
  REVIEWED: "bg-neutral-800 text-neutral-200 border-neutral-700",
  APPROVED: "bg-amber-950 text-amber-300 border-amber-800",
  REQUEST_SENT: "bg-orange-950 text-orange-300 border-orange-800",
  CONNECTED: "bg-orange-900 text-orange-200 border-orange-700",
  DM_DRAFTED: "bg-orange-900/70 text-orange-200 border-orange-700",
  DM_SENT: "bg-orange-800 text-white border-orange-600",
  REPLIED: "bg-emerald-900 text-emerald-300 border-emerald-700",
  SCHEDULING: "bg-sky-900 text-sky-300 border-sky-700",
  MEETING: "bg-en-orange text-black border-orange-400 font-semibold",
  PASSED: "bg-neutral-900 text-neutral-500 border-neutral-800 line-through",
};

export const PRIORITIES = ["A", "B", "C"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_STYLE: Record<Priority, string> = {
  A: "bg-en-orange text-black border-orange-400 font-bold",
  B: "bg-amber-900 text-amber-200 border-amber-700",
  C: "bg-neutral-800 text-neutral-400 border-neutral-700",
};

export const MESSAGE_TYPES = ["CONNECTION_REQUEST", "FIRST_DM"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const ACTIVITY_TYPES = [
  "STATUS_CHANGE",
  "NOTE",
  "REPLY",
  "MESSAGE_GENERATED",
  "MESSAGE_COPIED",
  "ANALYSIS",
  "FOLLOW_UP",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function safeRate(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // 小数点1桁%
}
