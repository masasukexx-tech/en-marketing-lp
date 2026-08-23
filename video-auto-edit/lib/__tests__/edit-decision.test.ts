import { test } from "node:test";
import assert from "node:assert/strict";

import { classifySilenceIntervals, type TranscriptSegmentLike } from "../edit-decision.ts";

function segment(text: string, startSec: number, endSec: number, words: string[]): TranscriptSegmentLike {
  const step = (endSec - startSec) / words.length;
  return {
    text,
    startSec,
    endSec,
    confidence: 0.9,
    words: words.map((word, i) => ({
      word,
      startSec: startSec + i * step,
      endSec: startSec + (i + 1) * step,
      confidence: 0.9,
    })),
  };
}

test("classifySilenceIntervals ignores gaps shorter than 0.3s", () => {
  const result = classifySilenceIntervals([{ startSec: 1, endSec: 1.2 }], []);
  assert.deepEqual(result, []);
});

test("classifySilenceIntervals treats a mid-length gap at a sentence end as low confidence", () => {
  const segments = [segment("こんにちは。", 0, 1, ["こんにちは", "。"])];
  const result = classifySilenceIntervals([{ startSec: 1, endSec: 1.8 }], segments);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.reason, "silence");
  assert.ok(result[0]!.confidence < 0.75, "sentence-end gaps should stay low-confidence (kept as candidate)");
  assert.equal(result[0]?.decision, "candidate");
});

test("classifySilenceIntervals cuts a long gap not preceded by a thinking word", () => {
  const segments = [segment("これは普通の発話です", 0, 2, ["これは", "普通の", "発話です"])];
  const result = classifySilenceIntervals([{ startSec: 2, endSec: 4 }], segments);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.decision, "cut");
  assert.ok(result[0]!.confidence >= 0.75);
});

test("classifySilenceIntervals downgrades a long gap after a thinking word to candidate", () => {
  const segments = [segment("えっと", 0, 1, ["えっと"])];
  const result = classifySilenceIntervals([{ startSec: 1, endSec: 3 }], segments, "standard");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.decision, "candidate");
  assert.match(result[0]!.reasonDetail ?? "", /thinking word/);
});

test("classifySilenceIntervals with strong cutStrength cuts more aggressively than weak", () => {
  const segments = [segment("これは普通の発話です", 0, 2, ["これは", "普通の", "発話です"])];
  // 2.0s long gap not preceded by a thinking word => confidence 0.85 (between the weak and strong thresholds)
  const interval = [{ startSec: 2, endSec: 4 }];

  const weak = classifySilenceIntervals(interval, segments, "weak");
  const strong = classifySilenceIntervals(interval, segments, "strong");

  assert.equal(weak[0]?.decision, "candidate");
  assert.equal(strong[0]?.decision, "cut");
});
