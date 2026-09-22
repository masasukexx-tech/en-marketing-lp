// ANTHROPIC_API_KEY未設定時のモックモード。
// Claude APIを呼ばず、プロフィール情報を軽くテンプレートに埋め込んだダミー結果を返す。
// 画面の一連の操作（相性判定→文面生成→文面チェック→ステータス管理）を
// APIキーなしで確認できるようにするためのもので、実際のAI判定ではない。
// 呼び出し元は modelUsed:"mock" を保存し、UI側で「モック生成」であることを明示する。

import type { AnalysisResult, MessageCheckResult, MessageGenerationResult } from "./schemas";
import type { LeadProfileForAI } from "@/types";
import type { MessageType } from "./status";

export const MOCK_MODEL_LABEL = "mock";

function hasProfileInfo(lead: LeadProfileForAI): boolean {
  return Boolean(
    (lead.profileText && lead.profileText.trim()) ||
      (lead.workHistory && lead.workHistory.trim()) ||
      (lead.recentPosts && lead.recentPosts.trim()),
  );
}

export function buildMockAnalysis(lead: LeadProfileForAI): AnalysisResult {
  const rich = hasProfileInfo(lead);
  const roleHint = lead.title?.trim() || "役職未入力";
  const overallScore = rich ? 68 : 42;
  const customerScore = rich ? 72 : 45;
  const partnerScore = rich ? 40 : 30;

  return {
    overallScore,
    customerScore,
    partnerScore,
    priority: overallScore >= 60 ? "B" : "C",
    reasons: [
      `(モック生成) ${roleHint}という立場から、SNSを活用した集客・採用に関心を持っている可能性があります`,
      "実際の判定にはANTHROPIC_API_KEYを設定してください",
    ],
    painPoints: rich
      ? [`${lead.companyName}のSNS運用体制について、詳細は情報からは断定できません`]
      : ["プロフィール情報が少ないため、課題の推測が困難です"],
    valueProps: ["SNSマーケティング戦略の立案から運用までの一気通貫支援（ENの標準的な提供価値）"],
    talkingPoints: rich
      ? ["登録されたプロフィール本文・職歴・投稿内容に触れること"]
      : ["まずはプロフィール本文や最近の投稿内容の追加登録を検討してください"],
    cautions: null,
    missingInfo: rich ? [] : ["プロフィール本文", "職歴", "最近の投稿内容"],
    suggestedInfo: rich ? ["具体的な課題感が伝わる投稿内容"] : ["プロフィール本文", "職歴", "最近の投稿内容"],
    genericWarning: !rich,
  };
}

const CONNECTION_REQUEST_TEMPLATES: { variant: string; label: string }[] = [
  { variant: "polite", label: "丁寧で落ち着いた文面" },
  { variant: "friendly", label: "親しみのある文面" },
  { variant: "collab", label: "協業可能性を感じさせる文面" },
];

const FIRST_DM_TEMPLATES: { variant: string; label: string }[] = [
  { variant: "relationship", label: "関係構築型" },
  { variant: "proposal", label: "協業提案型" },
  { variant: "hypothesis", label: "課題仮説型" },
];

export function buildMockMessages(
  lead: LeadProfileForAI,
  type: MessageType,
): MessageGenerationResult {
  const rich = hasProfileInfo(lead);
  const templates = type === "CONNECTION_REQUEST" ? CONNECTION_REQUEST_TEMPLATES : FIRST_DM_TEMPLATES;

  const variants = templates.map((t) => ({
    variant: t.variant,
    label: t.label,
    content:
      type === "CONNECTION_REQUEST"
        ? `[モック生成/${t.label}] ${lead.name}様、はじめまして。${lead.companyName}の${lead.title || "ご担当"}として活動されている点に関心を持ちご連絡しました。よろしければ繋がらせてください。（ANTHROPIC_API_KEY未設定のためモック文面です）`
        : `[モック生成/${t.label}] ${lead.name}様\n\nつながっていただきありがとうございます。${lead.companyName}でのお取り組みに関心を持ちご連絡しました。株式会社ENでSNSを起点とした集客・採用支援を行っております。差し支えなければ現在の取り組み状況を伺えますでしょうか。\n（ANTHROPIC_API_KEY未設定のためモック文面です）`,
  }));

  return {
    missingInfo: rich ? [] : ["プロフィール本文", "職歴", "最近の投稿内容"],
    suggestedInfo: rich ? [] : ["プロフィール本文", "職歴", "最近の投稿内容"],
    genericWarning: !rich,
    variants,
  };
}

export function buildMockCheck(content: string, limit: number): MessageCheckResult {
  const lengthOk = content.length <= limit;
  const hasQuestion = content.includes("？") || content.includes("?");

  const issues: MessageCheckResult["issues"] = [
    { id: "salesy", passed: true, comment: "(モック) 判定していません" },
    { id: "templatey", passed: true, comment: "(モック) 判定していません" },
    { id: "specific", passed: true, comment: "(モック) 判定していません" },
    { id: "keigo", passed: true, comment: "(モック) 判定していません" },
    { id: "fabrication", passed: true, comment: "(モック) 判定していません" },
    {
      id: "length",
      passed: lengthOk,
      comment: lengthOk ? `${content.length}文字で目安(${limit}文字)以内です` : `${content.length}文字で目安(${limit}文字)を超えています`,
    },
    {
      id: "question",
      passed: hasQuestion,
      comment: hasQuestion ? "質問が含まれています" : "質問が含まれていない可能性があります",
    },
  ];

  return {
    issues,
    overallPassed: issues.every((i) => i.passed),
    revisedContent: null,
  };
}
