import { describe, expect, it } from "vitest";
import { toGeminiSchema } from "@/lib/ai/providers/gemini-schema";
import { ANALYSIS_TOOL_SCHEMA, CHECK_TOOL_SCHEMA, MESSAGE_TOOL_SCHEMA } from "@/lib/prompts";

describe("toGeminiSchema", () => {
  it("converts lowercase JSON schema types to Gemini's UPPERCASE types", () => {
    const result = toGeminiSchema({ type: "object", properties: { a: { type: "string" } } }) as any;
    expect(result.type).toBe("OBJECT");
    expect(result.properties.a.type).toBe("STRING");
  });

  it("converts a nullable type array into {type, nullable:true}", () => {
    const result = toGeminiSchema({ type: ["string", "null"] }) as any;
    expect(result.type).toBe("STRING");
    expect(result.nullable).toBe(true);
  });

  it("preserves enum, required, minItems/maxItems", () => {
    const result = toGeminiSchema({
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string", enum: ["A", "B", "C"] },
    }) as any;
    expect(result.type).toBe("ARRAY");
    expect(result.minItems).toBe(3);
    expect(result.maxItems).toBe(3);
    expect(result.items.type).toBe("STRING");
    expect(result.items.enum).toEqual(["A", "B", "C"]);
  });

  it("converts the real ANALYSIS_TOOL_SCHEMA without throwing and keeps nullable cautions", () => {
    const result = toGeminiSchema(ANALYSIS_TOOL_SCHEMA) as any;
    expect(result.type).toBe("OBJECT");
    expect(result.properties.overallScore.type).toBe("INTEGER");
    expect(result.properties.priority.enum).toEqual(["A", "B", "C"]);
    expect(result.properties.cautions.type).toBe("STRING");
    expect(result.properties.cautions.nullable).toBe(true);
    expect(result.required).toContain("overallScore");
  });

  it("converts the real MESSAGE_TOOL_SCHEMA variants array", () => {
    const result = toGeminiSchema(MESSAGE_TOOL_SCHEMA) as any;
    expect(result.properties.variants.type).toBe("ARRAY");
    expect(result.properties.variants.minItems).toBe(3);
    expect(result.properties.variants.maxItems).toBe(3);
    expect(result.properties.variants.items.type).toBe("OBJECT");
    expect(result.properties.variants.items.properties.content.type).toBe("STRING");
  });

  it("converts the real CHECK_TOOL_SCHEMA revisedContent as nullable", () => {
    const result = toGeminiSchema(CHECK_TOOL_SCHEMA) as any;
    expect(result.properties.revisedContent.type).toBe("STRING");
    expect(result.properties.revisedContent.nullable).toBe(true);
    expect(result.properties.issues.items.properties.id.enum).toContain("salesy");
  });
});
