import { test } from "node:test";
import assert from "node:assert/strict";

import { buildCaptionsFromWords } from "../captions.ts";

test("buildCaptionsFromWords groups consecutive surviving words in the same clip into one caption", () => {
  const clips = [{ sourceStart: 0, sourceEnd: 10, timelineStart: 0, timelineEnd: 10 }];
  const words = [
    { word: "お疲れ", startSec: 1, endSec: 1.5 },
    { word: "様です", startSec: 1.5, endSec: 2 },
  ];

  const captions = buildCaptionsFromWords(words, clips);

  assert.deepEqual(captions, [{ timelineStart: 1, timelineEnd: 2, text: "お疲れ様です" }]);
});

test("buildCaptionsFromWords splits into a new caption when a cut boundary is crossed", () => {
  // clip 1 covers source [0,5] -> timeline [0,5]; clip 2 covers source [8,12] -> timeline [5,9]
  // (source 5-8 was cut out as e.g. a filler word/silence)
  const clips = [
    { sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 },
    { sourceStart: 8, sourceEnd: 12, timelineStart: 5, timelineEnd: 9 },
  ];
  const words = [
    { word: "お疲れ様です", startSec: 4, endSec: 5 },
    { word: "ありがとう", startSec: 9, endSec: 10 },
  ];

  const captions = buildCaptionsFromWords(words, clips);

  assert.equal(captions.length, 2);
  assert.deepEqual(captions[0], { timelineStart: 4, timelineEnd: 5, text: "お疲れ様です" });
  // clip 2 timeline position: 5 + (9 - 8) = 6, end: 5 + (10 - 8) = 7
  assert.deepEqual(captions[1], { timelineStart: 6, timelineEnd: 7, text: "ありがとう" });
});

test("buildCaptionsFromWords drops words that were entirely cut and does not stretch the caption to cover the gap", () => {
  const clips = [
    { sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 },
    { sourceStart: 8, sourceEnd: 12, timelineStart: 5, timelineEnd: 9 },
  ];
  const words = [
    { word: "これは", startSec: 3, endSec: 4 },
    { word: "えっと", startSec: 6, endSec: 7 }, // falls in the cut gap [5,8] -> dropped
    { word: "続きです", startSec: 9, endSec: 10 },
  ];

  const captions = buildCaptionsFromWords(words, clips);

  assert.equal(captions.length, 2);
  assert.equal(captions[0]!.text, "これは");
  assert.equal(captions[1]!.text, "続きです");
});

test("buildCaptionsFromWords clamps a word's end to the clip boundary when the word straddles a cut", () => {
  const clips = [{ sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 }];
  // word starts inside the clip but its endSec (5.5) is past the clip's sourceEnd (5)
  const words = [{ word: "はみ出し", startSec: 4.8, endSec: 5.5 }];

  const captions = buildCaptionsFromWords(words, clips);

  assert.equal(captions.length, 1);
  assert.equal(captions[0]!.timelineEnd, 5);
});

test("buildCaptionsFromWords starts a new caption once the character or duration cap is exceeded", () => {
  const clips = [{ sourceStart: 0, sourceEnd: 100, timelineStart: 0, timelineEnd: 100 }];
  const words = Array.from({ length: 5 }, (_, i) => ({
    word: "あ".repeat(10),
    startSec: i * 2,
    endSec: i * 2 + 1,
  }));

  const captions = buildCaptionsFromWords(words, clips, 6, 28);

  assert.ok(captions.length > 1, "expected the long run of words to be split into multiple captions");
  for (const c of captions) {
    assert.ok(c.text.length <= 30, `caption text too long: ${c.text.length} chars`);
  }
});
