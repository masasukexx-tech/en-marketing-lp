import type { AnalysisSummaryForAI, LeadProfileForAI } from "@/types";

export const EN_COMPANY_PROFILE = `株式会社ENは、企業・個人を含む300件以上のSNSプロデュース実績を持つSNSマーケティング会社です。
提供サービス：TikTok運用、Instagram運用、YouTube運用、SNSマーケティング戦略、SNS広告、インフルエンサー・タレントのキャスティング、映像・クリエイティブ制作、LINEを含む導線設計、採用向けSNS支援、売上獲得を目的としたSNS支援。
強み：単なる投稿代行ではなく、認知から問い合わせ・採用・成約までの導線を一気通貫で設計できること。`;

export const TARGET_PERSONA = `【優先度の高い見込み顧客】
経営者、代表取締役、マーケティング責任者、広報責任者、採用責任者、新規事業責任者、SNS運用や集客・採用に課題がありそうな企業の担当者。

【優先度の高い協業・紹介パートナー】
広告代理店、Web制作会社、採用支援会社、人材会社、経営コンサルタント、営業支援会社、ブランディング会社、映像制作会社、システム開発会社、士業、複数の経営者との接点を持つ人物。`;

export const AI_GROUND_RULES = `厳守事項：
- プロフィールに明記されていない事実を断定的に書かない。推測する場合は「〜の可能性があります」等、推測だと分かる表現を必ず使うこと。
- プロフィールに存在しない実績・関係性・投稿内容・経営課題を創作しないこと。
- 出力は必ず与えられたツール(関数)のJSON形式のみで返すこと。JSON以外のテキストを含めないこと。
- ビジネスで違和感のない自然な日本語を使うこと。`;

export function formatLeadProfileBlock(lead: LeadProfileForAI): string {
  const lines: string[] = [];
  lines.push(`【氏名】${lead.name}`);
  lines.push(`【会社名】${lead.companyName}`);
  lines.push(`【役職】${lead.title?.trim() || "(未入力)"}`);
  lines.push(`【業界】${lead.industry?.trim() || "(未入力)"}`);
  lines.push(`【所在地】${lead.location?.trim() || "(未入力)"}`);
  lines.push(`【プロフィール本文】\n${lead.profileText?.trim() || "(未入力)"}`);
  lines.push(`【職歴】\n${lead.workHistory?.trim() || "(未入力)"}`);
  lines.push(`【最近の投稿内容】\n${lead.recentPosts?.trim() || "(未入力)"}`);
  lines.push(`【登録者メモ】\n${lead.notes?.trim() || "(未入力)"}`);
  return lines.join("\n");
}

// ---------- 相性判定 ----------

export const ANALYSIS_TOOL_NAME = "submit_compatibility_analysis";

export const ANALYSIS_TOOL_SCHEMA = {
  type: "object",
  properties: {
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    customerScore: { type: "integer", minimum: 0, maximum: 100 },
    partnerScore: { type: "integer", minimum: 0, maximum: 100 },
    priority: { type: "string", enum: ["A", "B", "C"] },
    reasons: { type: "array", items: { type: "string" } },
    painPoints: { type: "array", items: { type: "string" } },
    valueProps: { type: "array", items: { type: "string" } },
    talkingPoints: { type: "array", items: { type: "string" } },
    cautions: { type: ["string", "null"] },
    missingInfo: { type: "array", items: { type: "string" } },
    suggestedInfo: { type: "array", items: { type: "string" } },
    genericWarning: { type: "boolean" },
  },
  required: [
    "overallScore",
    "customerScore",
    "partnerScore",
    "priority",
    "reasons",
    "painPoints",
    "valueProps",
    "talkingPoints",
    "missingInfo",
    "suggestedInfo",
    "genericWarning",
  ],
} as const;

export function buildAnalysisPrompt(lead: LeadProfileForAI) {
  const system = `あなたは株式会社ENの法人営業を支援するアシスタントです。LinkedIn上の人物プロフィールと、ENの事業内容から相性を判定します。
${EN_COMPANY_PROFILE}

${TARGET_PERSONA}

${AI_GROUND_RULES}
- customerScoreは「ENの顧客になり得るか」、partnerScoreは「協業・紹介パートナーになり得るか」を0〜100で評価すること。overallScoreは両者を踏まえた総合スコア。
- priorityはA(即アプローチ推奨)/B(条件が揃えばアプローチ)/C(優先度低)の3段階。
- プロフィール本文・職歴・最近の投稿内容がいずれも(未入力)に近い場合はgenericWarningをtrueにし、missingInfoに具体的に不足している項目を、suggestedInfoに精度向上のために追加登録すべき項目を挙げること。
- cautionsは、アプローチを見送るべき明確な理由がある場合のみ記載し、なければnullにすること。`;

  const prompt = `以下のLinkedInプロフィール情報をもとに、株式会社ENとの相性を判定してください。

${formatLeadProfileBlock(lead)}`;

  return { system, prompt };
}

// ---------- つながり申請文 / 初回DM 生成 ----------

export const MESSAGE_TOOL_NAME = "submit_message_drafts";

export const MESSAGE_TOOL_SCHEMA = {
  type: "object",
  properties: {
    missingInfo: { type: "array", items: { type: "string" } },
    suggestedInfo: { type: "array", items: { type: "string" } },
    genericWarning: { type: "boolean" },
    variants: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          variant: { type: "string" },
          label: { type: "string" },
          content: { type: "string" },
        },
        required: ["variant", "label", "content"],
      },
    },
  },
  required: ["missingInfo", "suggestedInfo", "genericWarning", "variants"],
} as const;

export function buildConnectionRequestPrompt(
  lead: LeadProfileForAI,
  analysis?: AnalysisSummaryForAI | null,
) {
  const system = `あなたは株式会社ENの営業担当者のために、LinkedInの「つながり申請」に添えるメッセージ文を作成するアシスタントです。
${EN_COMPANY_PROFILE}

${AI_GROUND_RULES}

文面の目的は「自然につながること」であり、すぐに営業することではありません。以下の条件を必ず守ってください：
- 180文字以内を基本とする
- 相手の会社名、役職、事業内容または投稿内容のいずれかに具体的に触れる
- 定型文に見えないようにする
- 過度に褒めない
- 「ぜひ情報交換させてください」だけで終わらせない
- いきなりサービスを売り込まない
- 相手との具体的な接点や関心理由を示す
- 読みやすく簡潔にする
- 事実の捏造をしない

variantsには以下の3パターンを必ずこの順番で生成してください：
1. variant="polite", label="丁寧で落ち着いた文面"
2. variant="friendly", label="親しみのある文面"
3. variant="collab", label="協業可能性を感じさせる文面"`;

  const analysisBlock = analysis
    ? `\n\n【参考: 事前の相性判定結果】\n優先度: ${analysis.priority} / 総合スコア: ${analysis.overallScore}\n相性理由: ${analysis.reasons.join(" / ")}\n話題候補: ${analysis.talkingPoints.join(" / ")}`
    : "";

  const prompt = `以下のLinkedInプロフィール情報をもとに、つながり申請メッセージを3パターン作成してください。${analysisBlock}

${formatLeadProfileBlock(lead)}`;

  return { system, prompt };
}

export function buildFirstDmPrompt(
  lead: LeadProfileForAI,
  analysis?: AnalysisSummaryForAI | null,
) {
  const system = `あなたは株式会社ENの営業担当者のために、LinkedInで接続済みの相手に送る「初回DM」を作成するアシスタントです。
${EN_COMPANY_PROFILE}

${AI_GROUND_RULES}

初回DMの目的は「売り込みではなく会話を始めること」です。以下の構成・条件を必ず守ってください：
- 構成: 1.承認へのお礼 → 2.相手の事業や経歴に触れる → 3.連絡した理由 → 4.自分と株式会社ENの簡潔な紹介 → 5.相手に答えやすい質問 → 6.必要な場合だけ、短時間の会話を提案する
- 350文字以内を基本とする
- 「SNSにお困りではありませんか」のような一方的な営業文は禁止
- 相手のプロフィールから読み取れる具体的な内容を1〜2点だけ使い、自然な文章にすること
- 事実の捏造をしないこと

variantsには以下の3パターンを必ずこの順番で生成してください：
1. variant="relationship", label="関係構築型"
2. variant="proposal", label="協業提案型"
3. variant="hypothesis", label="課題仮説型"`;

  const analysisBlock = analysis
    ? `\n\n【参考: 事前の相性判定結果】\n優先度: ${analysis.priority} / 総合スコア: ${analysis.overallScore}\n相手の課題仮説: ${analysis.painPoints.join(" / ")}\nENから提供できる価値: ${analysis.valueProps.join(" / ")}\n話題候補: ${analysis.talkingPoints.join(" / ")}`
    : "";

  const prompt = `以下のLinkedInプロフィール情報をもとに、接続後に送る初回DMを3パターン作成してください。${analysisBlock}

${formatLeadProfileBlock(lead)}`;

  return { system, prompt };
}

// ---------- 文面チェック ----------

export const CHECK_TOOL_NAME = "submit_message_check";

export const CHECK_TOOL_SCHEMA = {
  type: "object",
  properties: {
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            enum: [
              "salesy",
              "templatey",
              "specific",
              "keigo",
              "fabrication",
              "length",
              "question",
            ],
          },
          passed: { type: "boolean" },
          comment: { type: "string" },
        },
        required: ["id", "passed", "comment"],
      },
    },
    overallPassed: { type: "boolean" },
    revisedContent: { type: ["string", "null"] },
  },
  required: ["issues", "overallPassed", "revisedContent"],
} as const;

export function buildMessageCheckPrompt(params: {
  lead: LeadProfileForAI;
  messageType: "CONNECTION_REQUEST" | "FIRST_DM";
  content: string;
}) {
  const { lead, messageType, content } = params;
  const limit = messageType === "CONNECTION_REQUEST" ? 180 : 350;
  const kind =
    messageType === "CONNECTION_REQUEST" ? "つながり申請メッセージ" : "初回DM";

  const system = `あなたは株式会社ENが送るLinkedIn向け文面の品質チェック担当です。
${AI_GROUND_RULES}

以下7項目を必ずすべて判定してください（idを固定で使用すること）：
- salesy: 売り込み感が強すぎないか（強すぎなければ passed=true）
- templatey: 定型文に見えないか（定型文っぽくなければ passed=true）
- specific: 相手固有の内容が含まれているか（含まれていれば passed=true）
- keigo: 不自然な敬語がないか（自然であれば passed=true）
- fabrication: 事実を捏造していないか（プロフィールにない事実の断定がなければ passed=true）
- length: 長すぎないか（${kind}の目安${limit}文字以内なら passed=true）
- question: 返信しやすい質問があるか（あれば passed=true。つながり申請文では必須ではない）

いずれか1つでもpassed=falseがあればoverallPassed=falseとし、revisedContentに全ての問題を解消した修正版全文を入れてください。すべてpassed=trueならrevisedContentはnullで構いません。`;

  const prompt = `【対象文面種別】${kind}
【文字数目安】${limit}文字以内

【チェック対象の文面】
${content}

【文面作成に使用したプロフィール情報（事実確認用）】
${formatLeadProfileBlock(lead)}`;

  return { system, prompt };
}
