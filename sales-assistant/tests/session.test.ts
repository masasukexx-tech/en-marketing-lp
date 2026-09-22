import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-value-not-used-in-production";
});

describe("session token", () => {
  it("verifies a freshly created token", async () => {
    const token = await createSessionToken(60);
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("rejects an expired token", async () => {
    const token = await createSessionToken(-10);
    expect(await verifySessionToken(token)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await createSessionToken(60);
    const [payload, sig] = token.split(".");
    const tampered = `${payload}.${sig.slice(0, -1)}x`;
    expect(await verifySessionToken(tampered)).toBe(false);
  });

  it("rejects a forged payload reusing the original signature", async () => {
    const token = await createSessionToken(60);
    const [payload, sig] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    decoded.exp += 100000;
    const forgedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    expect(await verifySessionToken(`${forgedPayload}.${sig}`)).toBe(false);
  });

  it("rejects missing or malformed tokens", async () => {
    expect(await verifySessionToken(null)).toBe(false);
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken("")).toBe(false);
    expect(await verifySessionToken("not-a-valid-token")).toBe(false);
  });
});
