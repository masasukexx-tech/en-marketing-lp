import { describe, expect, it } from "vitest";
import {
  AnalysisResultSchema,
  LeadInputSchema,
  MessageCheckResultSchema,
  MessageGenerationResultSchema,
  StatusChangeSchema,
} from "@/lib/schemas";

describe("LeadInputSchema", () => {
  it("accepts a valid lead input", () => {
    const result = LeadInputSchema.safeParse({
      linkedinUrl: "https://www.linkedin.com/in/taro",
      name: "山田太郎",
      companyName: "株式会社サンプル",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-LinkedIn URL", () => {
    const result = LeadInputSchema.safeParse({
      linkedinUrl: "https://example.com/taro",
      name: "山田太郎",
      companyName: "株式会社サンプル",
    });
    expect(result.success).toBe(false);
  });

  it("requires name and companyName", () => {
    const result = LeadInputSchema.safeParse({
      linkedinUrl: "https://www.linkedin.com/in/taro",
      name: "",
      companyName: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("StatusChangeSchema", () => {
  it("accepts a known status value", () => {
    expect(StatusChangeSchema.safeParse({ status: "CONNECTED" }).success).toBe(true);
  });

  it("rejects an unknown status value", () => {
    expect(StatusChangeSchema.safeParse({ status: "NOT_A_STATUS" }).success).toBe(false);
  });
});

describe("AnalysisResultSchema", () => {
  const base = {
    overallScore: 80,
    customerScore: 85,
    partnerScore: 40,
    priority: "A",
    reasons: ["理由1"],
    painPoints: ["課題1"],
    valueProps: ["価値1"],
    talkingPoints: ["話題1"],
    cautions: null,
    missingInfo: [],
    suggestedInfo: [],
    genericWarning: false,
  };

  it("accepts a well-formed AI analysis result", () => {
    expect(AnalysisResultSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a score outside 0-100", () => {
    expect(AnalysisResultSchema.safeParse({ ...base, overallScore: 150 }).success).toBe(false);
  });

  it("rejects an invalid priority", () => {
    expect(AnalysisResultSchema.safeParse({ ...base, priority: "D" }).success).toBe(false);
  });

  it("requires at least one reason", () => {
    expect(AnalysisResultSchema.safeParse({ ...base, reasons: [] }).success).toBe(false);
  });
});

describe("MessageGenerationResultSchema", () => {
  const variant = { variant: "polite", label: "丁寧で落ち着いた文面", content: "こんにちは" };

  it("accepts three generated variants", () => {
    const result = MessageGenerationResultSchema.safeParse({
      missingInfo: [],
      suggestedInfo: [],
      genericWarning: false,
      variants: [variant, variant, variant],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty variants array", () => {
    const result = MessageGenerationResultSchema.safeParse({
      missingInfo: [],
      suggestedInfo: [],
      genericWarning: false,
      variants: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("MessageCheckResultSchema", () => {
  it("accepts a passing check result", () => {
    const result = MessageCheckResultSchema.safeParse({
      issues: [{ id: "salesy", passed: true, comment: "問題なし" }],
      overallPassed: true,
      revisedContent: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown criterion id", () => {
    const result = MessageCheckResultSchema.safeParse({
      issues: [{ id: "unknown_criterion", passed: true, comment: "" }],
      overallPassed: true,
      revisedContent: null,
    });
    expect(result.success).toBe(false);
  });
});
