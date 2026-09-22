import { describe, expect, it } from "vitest";
import { sortLeads, type LeadRow } from "@/lib/leads";

function makeLead(overrides: Partial<LeadRow>): LeadRow {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    overallScore: null,
    nextActionDate: null,
    status: "CANDIDATE",
    priority: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  } as LeadRow;
}

describe("sortLeads", () => {
  it("sorts by overallScore descending for score_desc", () => {
    const leads = [
      makeLead({ id: "low", overallScore: 30 }),
      makeLead({ id: "high", overallScore: 90 }),
      makeLead({ id: "mid", overallScore: 60 }),
    ];
    const sorted = sortLeads(leads, "score_desc").map((l) => l.id);
    expect(sorted).toEqual(["high", "mid", "low"]);
  });

  it("sorts by createdAt descending for created_desc", () => {
    const leads = [
      makeLead({ id: "old", createdAt: new Date("2024-01-01") }),
      makeLead({ id: "new", createdAt: new Date("2024-06-01") }),
    ];
    const sorted = sortLeads(leads, "created_desc").map((l) => l.id);
    expect(sorted).toEqual(["new", "old"]);
  });

  it("puts leads without a nextActionDate last for next_action_asc", () => {
    const leads = [
      makeLead({ id: "none", nextActionDate: null }),
      makeLead({ id: "soon", nextActionDate: new Date("2024-01-05") }),
      makeLead({ id: "later", nextActionDate: new Date("2024-02-01") }),
    ];
    const sorted = sortLeads(leads, "next_action_asc").map((l) => l.id);
    expect(sorted).toEqual(["soon", "later", "none"]);
  });

  it("prioritizes overdue next-action leads for unhandled_first", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const leads = [
      makeLead({ id: "future", nextActionDate: future, status: "CONNECTED" }),
      makeLead({ id: "overdue", nextActionDate: past, status: "DM_SENT" }),
      makeLead({ id: "none", nextActionDate: null, status: "CANDIDATE" }),
    ];
    const sorted = sortLeads(leads, "unhandled_first").map((l) => l.id);
    expect(sorted[0]).toBe("overdue");
  });
});
