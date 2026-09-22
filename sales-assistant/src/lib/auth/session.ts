// 単一ユーザー用セッションCookieの署名・検証。
// Next.jsのMiddleware(Edge runtime)とAPI Route(Node runtime)の両方で動く必要があるため、
// Node固有のBufferや"base64url"エンコーディングには依存せず、
// 両ランタイムで確実に利用可能な Web Crypto API (crypto.subtle) と btoa/atob のみを使う。
// bcryptによるパスワード照合はここでは行わない（Node runtime専用。login routeでのみ使用）。

const SESSION_COOKIE_NAME = "en_sales_session";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 12; // 12時間

export const SESSION_COOKIE = {
  name: SESSION_COOKIE_NAME,
  maxAgeSeconds: DEFAULT_MAX_AGE_SECONDS,
};

export interface SessionPayload {
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRETが設定されていません");
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

function base64UrlToText(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64Url(new Uint8Array(sigBuffer));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken(
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadB64 = textToBase64Url(JSON.stringify(payload));
  const signature = await hmacSign(payloadB64, getSecret());
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;

  try {
    const expectedSignature = await hmacSign(payloadB64, getSecret());
    if (!timingSafeEqual(signature, expectedSignature)) return false;

    const payload = JSON.parse(base64UrlToText(payloadB64)) as SessionPayload;

    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
