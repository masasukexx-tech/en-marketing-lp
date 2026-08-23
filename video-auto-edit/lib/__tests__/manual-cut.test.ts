import { test } from "node:test";
import assert from "node:assert/strict";

import { splitDecisionsWithManualCut, type DecisionLike } from "../manual-cut.ts";

function keep(sourceStart: number, sourceEnd: number): DecisionLike {
  return { sourceStart, sourceEnd, decision: "keep", reason: "silence", reasonDetail: null, confidence: 1, restored: false };
}

test("splitDecisionsWithManualCut inserts a manual cut into a single keep span, splitting it in two", () => {
  const result = splitDecisionsWithManualCut([keep(0, 10)], 3, 5);

  assert.equal(result.length, 3);
  assert.deepEqual(
    result.map((r) => [r.sourceStart, r.sourceEnd, r.decision]),
    [
      [0, 3, "keep"],
      [3, 5, "cut"],
      [5, 10, "keep"],
    ]
  );
  assert.equal(result[1]!.reason, "manual");
});

test("splitDecisionsWithManualCut at the exact start of a span only trims it (no empty leading piece)", () => {
  const result = splitDecisionsWithManualCut([keep(0, 10)], 0, 3);

  assert.deepEqual(
    result.map((r) => [r.sourceStart, r.sourceEnd, r.decision]),
    [
      [0, 3, "cut"],
      [3, 10, "keep"],
    ]
  );
});

test("splitDecisionsWithManualCut spanning multiple existing rows trims/removes each appropriately", () => {
  const decisions = [keep(0, 5), keep(5, 10), keep(10, 15)];
  const result = splitDecisionsWithManualCut(decisions, 3, 12);

  assert.deepEqual(
    result.map((r) => [r.sourceStart, r.sourceEnd, r.decision]),
    [
      [0, 3, "keep"],
      [3, 12, "cut"],
      [12, 15, "keep"],
    ]
  );
});

test("splitDecisionsWithManualCut does not touch rows outside the cut range", () => {
  const decisions = [keep(0, 5), keep(20, 25)];
  const result = splitDecisionsWithManualCut(decisions, 10, 15);

  assert.equal(result.length, 3);
  assert.deepEqual(result[0], decisions[0]);
  assert.deepEqual(result[2], decisions[1]);
});
