import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AiNotConfiguredError, AiRateLimitError, AiTemporaryUnavailableError } from "./ai";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("入力内容に誤りがあります", 400, error.flatten());
  }
  if (error instanceof AiNotConfiguredError) {
    return jsonError(error.message, 503);
  }
  if (error instanceof AiRateLimitError) {
    return jsonError(error.message, 429);
  }
  if (error instanceof AiTemporaryUnavailableError) {
    return jsonError(error.message, 503);
  }
  if (error instanceof Error) {
    console.error(error);
    return jsonError(error.message || "サーバーエラーが発生しました", 500);
  }
  console.error(error);
  return jsonError("サーバーエラーが発生しました", 500);
}

export function parseJsonArray<T = unknown>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
