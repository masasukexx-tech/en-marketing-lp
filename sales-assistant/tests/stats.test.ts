import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "@/lib/stats";
import { safeRate } from "@/lib/status";

describe("safeRate", () => {
  it("returns 0 when the denominator is 0", () => {
    expect(safeRate(5, 0)).toBe(0);
  });

  it("rounds to one decimal place", () => {
    expect(safeRate(1, 3)).toBe(33.3);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(safeRate(4, 4)).toBe(100);
  });
});

describe("computeDashboardStats", () => {
  it("computes connection/reply/meeting rates from cumulative counts", () => {
    const stats = computeDashboardStats({
      totalLeads: 100,
      reviewedCount: 80,
      requestSentCount: 50,
      connectedCount: 25,
      dmSentCount: 20,
      repliedCount: 10,
      meetingCount: 4,
    });

    expect(stats.connectionRate).toBe(50); // 25/50
    expect(stats.replyRate).toBe(50); // 10/20
    expect(stats.meetingRate).toBe(40); // 4/10
  });

  it("does not divide by zero when a funnel stage has no entries yet", () => {
    const stats = computeDashboardStats({
      totalLeads: 3,
      reviewedCount: 0,
      requestSentCount: 0,
      connectedCount: 0,
      dmSentCount: 0,
      repliedCount: 0,
      meetingCount: 0,
    });

    expect(stats.connectionRate).toBe(0);
    expect(stats.replyRate).toBe(0);
    expect(stats.meetingRate).toBe(0);
  });
});
