// AIプロバイダー抽象化レイヤー。
// 現在はGemini APIのみ実装しているが、将来別プロバイダー(例: OpenAI)へ
// 差し替えられるよう、呼び出し側(ai-service.ts)はこのインターフェースにのみ依存する。

export interface AiJsonToolCall {
  system: string;
  prompt: string;
  /** 呼び出し内容の識別名。関数呼び出し方式のプロバイダー向け（Geminiでは未使用）。 */
  toolName: string;
  toolDescription: string;
  /** JSON Schema風の出力形式定義（lowercase type: "object"|"string"|"integer"|"array"|"boolean"、
   *  nullable許容は type: [x, "null"] で表現する）。各プロバイダーが自身の形式へ変換する。 */
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}

export interface AiProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** 構造化JSON出力を1回のAPI呼び出しで取得する。パース済みJSON(unknown)を返す。 */
  callJsonTool(params: AiJsonToolCall): Promise<unknown>;
}

export class AiNotConfiguredError extends Error {
  constructor(message = "AIプロバイダーのAPIキーが設定されていません") {
    super(message);
    this.name = "AiNotConfiguredError";
  }
}

export class AiRateLimitError extends Error {
  constructor(
    message = "Gemini APIの無料利用上限に達しました。時間を置いて再実行してください",
  ) {
    super(message);
    this.name = "AiRateLimitError";
  }
}

export class AiTemporaryUnavailableError extends Error {
  constructor(message = "Geminiが一時的に混雑しています。少し時間を置いて再実行してください") {
    super(message);
    this.name = "AiTemporaryUnavailableError";
  }
}
