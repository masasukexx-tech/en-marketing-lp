import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AnthropicNotConfiguredError } from "./anthropic";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("入力内容に誤りがあります", 400, error.flatten());
  }
  if (error instanceof AnthropicNotConfiguredError) {
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
