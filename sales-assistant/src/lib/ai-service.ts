import { callClaudeJsonTool, DEFAULT_MODEL } from "./anthropic";
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
import type { AnalysisSummaryForAI, LeadProfileForAI } from "@/types";
import type { MessageType } from "./status";

export async function analyzeLeadCompatibility(
  lead: LeadProfileForAI,
): Promise<{ result: AnalysisResult; raw: unknown }> {
  const { system, prompt } = buildAnalysisPrompt(lead);
  const raw = await callClaudeJsonTool({
    system,
    prompt,
    toolName: ANALYSIS_TOOL_NAME,
    toolDescription: "相性判定の結果を構造化データで返す",
    inputSchema: ANALYSIS_TOOL_SCHEMA as unknown as Record<string, unknown>,
  });
  const result = AnalysisResultSchema.parse(raw);
  return { result, raw };
}

export async function generateLeadMessages(params: {
  lead: LeadProfileForAI;
  type: MessageType;
  analysis?: AnalysisSummaryForAI | null;
}): Promise<{ result: MessageGenerationResult; raw: unknown }> {
  const { lead, type, analysis } = params;
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
  return { result, raw };
}

export async function checkLeadMessage(params: {
  lead: LeadProfileForAI;
  type: MessageType;
  content: string;
}): Promise<{ result: MessageCheckResult; raw: unknown }> {
  const { system, prompt } = buildMessageCheckPrompt(params);
  const raw = await callClaudeJsonTool({
    system,
    prompt,
    toolName: CHECK_TOOL_NAME,
    toolDescription: "文面チェック結果を構造化データで返す",
    inputSchema: CHECK_TOOL_SCHEMA as unknown as Record<string, unknown>,
  });
  const result = MessageCheckResultSchema.parse(raw);
  return { result, raw };
}

export { DEFAULT_MODEL };
