import Anthropic from "@anthropic-ai/sdk";

export class AnthropicNotConfiguredError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEYが設定されていません。.envファイルに設定してからお試しください。",
    );
    this.name = "AnthropicNotConfiguredError";
  }
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnthropicNotConfiguredError();
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

interface CallJsonToolOptions {
  system: string;
  prompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}

/**
 * Claudeにtool_use(強制JSON出力)でリクエストし、パース済みJSON(unknown)を返す。
 * 呼び出し側でzodスキーマによる検証を行うこと。
 */
export async function callClaudeJsonTool({
  system,
  prompt,
  toolName,
  toolDescription,
  inputSchema,
  maxTokens = 2500,
}: CallJsonToolOptions): Promise<unknown> {
  const anthropic = getClient();

  // Anthropic SDKのバージョン間でtools/tool_choiceの型定義が変わることがあるため、
  // ここではAPI仕様(name/description/input_schema, tool_choice={type:"tool",name})に
  // 忠実な素のオブジェクトを渡し、型はunknown経由でキャストする。
  const requestParams = {
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: inputSchema,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
  };

  const response = (await anthropic.messages.create(
    requestParams as unknown as Parameters<typeof anthropic.messages.create>[0],
  )) as unknown as { content: Array<{ type: string; input?: unknown }> };

  const toolUse = response.content.find((block) => block.type === "tool_use");

  if (!toolUse) {
    throw new Error("Claudeから構造化出力(tool_use)が得られませんでした。");
  }

  return toolUse.input;
}
