import { GoogleGenAI } from "@google/genai";
import {
  AiNotConfiguredError,
  AiRateLimitError,
  AiTemporaryUnavailableError,
  type AiJsonToolCall,
  type AiProvider,
} from "../provider";
import { toGeminiSchema } from "./gemini-schema";

// 現時点で無料枠が利用できるFlash系モデル。GEMINI_MODEL環境変数で上書き可能。
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\b429\b|RESOURCE_EXHAUSTED|rate.?limit|quota/i.test(message);
}

function isTemporaryUnavailableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /\b503\b|UNAVAILABLE|high demand|temporar/i.test(message);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini APIからのエラーにプロフィール本文等が含まれることは想定していないが、
// 念のためエラーメッセージのみを再利用し、リクエスト内容(個人情報を含み得る)は一切ログに残さない。
function toSafeError(err: unknown): Error {
  if (err instanceof Error) return new Error(err.message);
  return new Error("Gemini APIの呼び出しに失敗しました");
}

export class GeminiProvider implements AiProvider {
  readonly name = "gemini";

  private client: GoogleGenAI | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AiNotConfiguredError(
        "GEMINI_API_KEYが設定されていません。.envファイルに設定してからお試しください。",
      );
    }
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  async callJsonTool({ system, prompt, inputSchema, maxTokens }: AiJsonToolCall): Promise<unknown> {
    const client = this.getClient();
    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const schema = toGeminiSchema(inputSchema);

    const attempt = async (): Promise<unknown> => {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseSchema: schema,
          ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Geminiから構造化出力が得られませんでした。");
      }
      return JSON.parse(text);
    };

    // 429/503のみ2秒・5秒待って再試行する（初回を含め最大3回）。
    const delays = [0, 2_000, 5_000];
    let lastError: unknown;
    for (const delay of delays) {
      if (delay) await wait(delay);
      try {
        return await attempt();
      } catch (error) {
        lastError = error;
        if (!isRateLimitError(error) && !isTemporaryUnavailableError(error)) break;
      }
    }

    if (isRateLimitError(lastError)) throw new AiRateLimitError();
    if (isTemporaryUnavailableError(lastError)) throw new AiTemporaryUnavailableError();
    throw toSafeError(lastError);
  }
}
