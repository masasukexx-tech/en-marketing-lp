import { test } from "node:test";
import assert from "node:assert/strict";

import { buildTimelineClips, mapSourceToTimeline, withTimelineOffsets } from "../timeline.ts";

test("buildTimelineClips keeps non-cut spans and restored cuts, drops unrestored cuts", () => {
  const decisions = [
    { sourceStart: 0, sourceEnd: 5, decision: "keep" as const, restored: false },
    { sourceStart: 5, sourceEnd: 7, decision: "cut" as const, restored: false },
    { sourceStart: 7, sourceEnd: 9, decision: "cut" as const, restored: true },
    { sourceStart: 9, sourceEnd: 12, decision: "candidate" as const, restored: false },
  ];

  const clips = buildTimelineClips(decisions);

  assert.deepEqual(clips, [
    { sourceStart: 0, sourceEnd: 5 },
    { sourceStart: 7, sourceEnd: 9 },
    { sourceStart: 9, sourceEnd: 12 },
  ]);
});

test("withTimelineOffsets lays clips back-to-back with no gaps", () => {
  const clips = [
    { sourceStart: 0, sourceEnd: 5 },
    { sourceStart: 7, sourceEnd: 9 },
    { sourceStart: 9, sourceEnd: 12 },
  ];

  const offsets = withTimelineOffsets("video-1", clips);

  assert.deepEqual(
    offsets.map((c) => ({ timelineStart: c.timelineStart, timelineEnd: c.timelineEnd, orderIndex: c.orderIndex })),
    [
      { timelineStart: 0, timelineEnd: 5, orderIndex: 0 },
      { timelineStart: 5, timelineEnd: 7, orderIndex: 1 },
      { timelineStart: 7, timelineEnd: 10, orderIndex: 2 },
    ]
  );
  assert.equal(offsets.every((c) => c.videoAssetId === "video-1"), true);
});

test("mapSourceToTimeline converts a source timestamp inside a kept clip", () => {
  const clips = [
    { sourceStart: 0, sourceEnd: 5, timelineStart: 0 },
    { sourceStart: 7, sourceEnd: 9, timelineStart: 5 },
  ];

  assert.equal(mapSourceToTimeline(2, clips), 2);
  assert.equal(mapSourceToTimeline(8, clips), 6);
});

test("mapSourceToTimeline returns null for a timestamp inside a cut gap", () => {
  const clips = [
    { sourceStart: 0, sourceEnd: 5, timelineStart: 0 },
    { sourceStart: 7, sourceEnd: 9, timelineStart: 5 },
  ];

  assert.equal(mapSourceToTimeline(6, clips), null);
});
