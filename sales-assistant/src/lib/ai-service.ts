import { callClaudeJsonTool, DEFAULT_MODEL, isAnthropicConfigured } from "./anthropic";
import {
  ANALYSIS_TOOL_NAME,
  ANALYSIS_TOOL_SCHEMA,
  buildAnalysisPrompt,
  buildConnectionRequestPrompt,
  buildFirstDmPrompt,
  buildMessageCheckPrompt,
  CHECK_TOOL_NAME,
  CHECK_TOOL_SCHEMA,
  MESSAGE_TOOL_NAME,
  MESSAGE_TOOL_SCHEMA,
} from "./prompts";
import {
  AnalysisResultSchema,
  MessageCheckResultSchema,
  MessageGenerationResultSchema,
  type AnalysisResult,
  type MessageCheckResult,
  type MessageGenerationResult,
} from "./schemas";
import { buildMockAnalysis, buildMockCheck, buildMockMessages, MOCK_MODEL_LABEL } from "./mock-ai";
import type { AnalysisSummaryForAI, LeadProfileForAI } from "@/types";
import type { MessageType } from "./status";

export interface AiCallResult<T> {
  result: T;
  raw: unknown;
  mocked: boolean;
  modelUsed: string;
}

export async function analyzeLeadCompatibility(
  lead: LeadProfileForAI,
): Promise<AiCallResult<AnalysisResult>> {
  if (!isAnthropicConfigured()) {
    return { result: buildMockAnalysis(lead), raw: null, mocked: true, modelUsed: MOCK_MODEL_LABEL };
  }

  const { system, prompt } = buildAnalysisPrompt(lead);
  const raw = await callClaudeJsonTool({
    system,
    prompt,
    toolName: ANALYSIS_TOOL_NAME,
    toolDescription: "相性判定の結果を構造化データで返す",
    inputSchema: ANALYSIS_TOOL_SCHEMA as unknown as Record<string, unknown>,
  });
  const result = AnalysisResultSchema.parse(raw);
  return { result, raw, mocked: false, modelUsed: DEFAULT_MODEL };
}

export async function generateLeadMessages(params: {
  lead: LeadProfileForAI;
  type: MessageType;
  analysis?: AnalysisSummaryForAI | null;
}): Promise<AiCallResult<MessageGenerationResult>> {
  const { lead, type, analysis } = params;

  if (!isAnthropicConfigured()) {
    return {
      result: buildMockMessages(lead, type),
      raw: null,
      mocked: true,
      modelUsed: MOCK_MODEL_LABEL,
    };
  }

  const { system, prompt } =
    type === "CONNECTION_REQUEST"
      ? buildConnectionRequestPrompt(lead, analysis)
      : buildFirstDmPrompt(lead, analysis);

  const raw = await callClaudeJsonTool({
    system,
    prompt,
    toolName: MESSAGE_TOOL_NAME,
    toolDescription: "生成したメッセージ文面3パターンを構造化データで返す",
    inputSchema: MESSAGE_TOOL_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 3000,
  });
  const result = MessageGenerationResultSchema.parse(raw);
  return { result, raw, mocked: false, modelUsed: DEFAULT_MODEL };
}

export async function checkLeadMessage(params: {
  lead: LeadProfileForAI;
  type: MessageType;
  content: string;
}): Promise<AiCallResult<MessageCheckResult>> {
  if (!isAnthropicConfigured()) {
    const limit = params.type === "CONNECTION_REQUEST" ? 180 : 350;
    return {
      result: buildMockCheck(params.content, limit),
      raw: null,
      mocked: true,
      modelUsed: MOCK_MODEL_LABEL,
    };
  }

  const { system, prompt } = buildMessageCheckPrompt({
    lead: params.lead,
    messageType: params.type,
    content: params.content,
  });
  const raw = await callClaudeJsonTool({
    system,
    prompt,
    toolName: CHECK_TOOL_NAME,
    toolDescription: "文面チェック結果を構造化データで返す",
    inputSchema: CHECK_TOOL_SCHEMA as unknown as Record<string, unknown>,
  });
  const result = MessageCheckResultSchema.parse(raw);
  return { result, raw, mocked: false, modelUsed: DEFAULT_MODEL };
}

export { DEFAULT_MODEL, MOCK_MODEL_LABEL };
