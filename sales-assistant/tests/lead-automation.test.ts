import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTO_MESSAGE_SCORE_THRESHOLD,
  getAutoMessageScoreThreshold,
  hasEnoughProfileForAutoAnalysis,
  shouldAutoGenerateConnectionRequest,
} from "../src/lib/lead-automation";

describe("lead automation", () => {
  const base = { name: "山田 太郎", companyName: "株式会社サンプル" };

  it("requires profile text or work history", () => {
    expect(hasEnoughProfileForAutoAnalysis(base)).toBe(false);
    expect(hasEnoughProfileForAutoAnalysis({ ...base, profileText: "SNS責任者です" })).toBe(true);
    expect(hasEnoughProfileForAutoAnalysis({ ...base, workHistory: "マーケティング責任者" })).toBe(true);
  });

  it("uses 80 as the safe default threshold", () => {
    expect(getAutoMessageScoreThreshold()).toBe(DEFAULT_AUTO_MESSAGE_SCORE_THRESHOLD);
    expect(getAutoMessageScoreThreshold("invalid")).toBe(80);
    expect(getAutoMessageScoreThreshold("101")).toBe(80);
  });

  it("generates connection requests only at or above the threshold", () => {
    expect(shouldAutoGenerateConnectionRequest(79, 80)).toBe(false);
    expect(shouldAutoGenerateConnectionRequest(80, 80)).toBe(true);
    expect(shouldAutoGenerateConnectionRequest(95, 80)).toBe(true);
  });
});
