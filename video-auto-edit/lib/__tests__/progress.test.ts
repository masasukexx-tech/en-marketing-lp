import { test } from "node:test";
import assert from "node:assert/strict";

import { overallPercent } from "../progress.ts";

test("overallPercent maps stage boundaries correctly", () => {
  assert.equal(overallPercent({ stage: "extracting_audio", stagePercent: 0 }), 0);
  assert.equal(overallPercent({ stage: "extracting_audio", stagePercent: 100 }), 5);
  assert.equal(overallPercent({ stage: "transcribing", stagePercent: 0 }), 10);
  assert.equal(overallPercent({ stage: "transcribing", stagePercent: 100 }), 85);
  assert.equal(overallPercent({ stage: "saving", stagePercent: 100 }), 100);
  assert.equal(overallPercent({ stage: "done", stagePercent: 0 }), 100);
});

test("overallPercent interpolates within a stage", () => {
  // transcribing spans 10-85, so 50% through transcription is 10 + 0.5*75 = 47.5 -> rounds to 48
  assert.equal(overallPercent({ stage: "transcribing", stagePercent: 50 }), 48);
});

test("overallPercent clamps out-of-range stagePercent", () => {
  assert.equal(overallPercent({ stage: "transcribing", stagePercent: -10 }), 10);
  assert.equal(overallPercent({ stage: "transcribing", stagePercent: 200 }), 85);
});

test("overallPercent never decreases across the stage sequence for monotonically increasing input", () => {
  const stages: Array<{ stage: Parameters<typeof overallPercent>[0]["stage"]; stagePercent: number }> = [
    { stage: "extracting_audio", stagePercent: 100 },
    { stage: "loading_model", stagePercent: 100 },
    { stage: "transcribing", stagePercent: 0 },
    { stage: "transcribing", stagePercent: 100 },
    { stage: "analyzing", stagePercent: 100 },
    { stage: "saving", stagePercent: 100 },
    { stage: "done", stagePercent: 100 },
  ];

  let last = -1;
  for (const s of stages) {
    const percent = overallPercent(s);
    assert.ok(percent >= last, `expected ${percent} >= ${last} for stage ${s.stage}`);
    last = percent;
  }
});
