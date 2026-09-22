import { describe, expect, it } from "vitest";
import { LEAD_STATUS_VALUES, STATUS_BADGE_STYLE, statusLabel } from "@/lib/status";

describe("statusLabel", () => {
  it("returns the Japanese label for a known status", () => {
    expect(statusLabel("CONNECTED")).toBe("接続済み");
    expect(statusLabel("MEETING")).toBe("商談化");
  });

  it("falls back to the raw value for an unknown status", () => {
    expect(statusLabel("SOMETHING_ELSE")).toBe("SOMETHING_ELSE");
  });
});

describe("STATUS_BADGE_STYLE", () => {
  it("has a style entry for every defined status value", () => {
    for (const status of LEAD_STATUS_VALUES) {
      expect(STATUS_BADGE_STYLE[status]).toBeTruthy();
    }
  });
});
