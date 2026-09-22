import { GeminiProvider, DEFAULT_GEMINI_MODEL } from "./providers/gemini";
import type { AiJsonToolCall, AiProvider } from "./provider";

export {
  AiNotConfiguredError,
  AiRateLimitError,
  type AiJsonToolCall,
  type AiProvider,
} from "./provider";
export { DEFAULT_GEMINI_MODEL } from "./providers/gemini";

let cachedProvider: AiProvider | null = null;

// 将来別プロバイダー(例: OpenAI)へ切り替える場合は、ここの生成ロジックのみを差し替えればよい。
export function getAiProvider(): AiProvider {
  if (!cachedProvider) {
    cachedProvider = new GeminiProvider();
  }
  return cachedProvider;
}

export function isAiConfigured(): boolean {
  return getAiProvider().isConfigured();
}

export function getAiModelId(): string {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

export async function callAiJsonTool(params: AiJsonToolCall): Promise<unknown> {
  return getAiProvider().callJsonTool(params);
}
