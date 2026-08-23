import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSilenceDetectOutput } from "../ffmpeg.ts";

test("parseSilenceDetectOutput pairs silence_start/silence_end lines", () => {
  const stderr = `
[silencedetect @ 0x55f] silence_start: 1.5
[silencedetect @ 0x55f] silence_end: 3.2 | silence_duration: 1.7
[silencedetect @ 0x55f] silence_start: 10
[silencedetect @ 0x55f] silence_end: 10.4 | silence_duration: 0.4
`;

  const intervals = parseSilenceDetectOutput(stderr);

  assert.deepEqual(intervals, [
    { startSec: 1.5, endSec: 3.2 },
    { startSec: 10, endSec: 10.4 },
  ]);
});

test("parseSilenceDetectOutput ignores a dangling silence_start with no matching end", () => {
  const stderr = `
[silencedetect @ 0x55f] silence_start: 1.5
[silencedetect @ 0x55f] silence_end: 3.2 | silence_duration: 1.7
[silencedetect @ 0x55f] silence_start: 10
`;

  const intervals = parseSilenceDetectOutput(stderr);

  assert.deepEqual(intervals, [{ startSec: 1.5, endSec: 3.2 }]);
});

test("parseSilenceDetectOutput returns an empty array when there is no silence", () => {
  assert.deepEqual(parseSilenceDetectOutput(""), []);
});
