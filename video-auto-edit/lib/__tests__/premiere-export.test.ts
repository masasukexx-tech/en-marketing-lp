import { test } from "node:test";
import assert from "node:assert/strict";

import { generateFcpxml, generateSrt } from "../premiere-export.ts";

const video = {
  filename: "sample.mp4",
  absolutePath: "/storage/projects/p1/original/sample.mp4",
  durationSec: 12,
  width: 1920,
  height: 1080,
  fps: 30,
};

test("generateFcpxml embeds one asset-clip per timeline clip with frame-accurate offsets", () => {
  const clips = [
    { sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 },
    { sourceStart: 7, sourceEnd: 10, timelineStart: 5, timelineEnd: 8 },
  ];

  const xml = generateFcpxml(video, clips);

  assert.match(xml, /<fcpxml version="1.10">/);
  assert.match(xml, /frameDuration="1\/30s"/);
  assert.match(xml, /src="file:\/\/\/storage\/projects\/p1\/original\/sample\.mp4"/);
  // clip 1: offset 0s, duration 5*30=150 frames, start 0
  assert.match(xml, /offset="0\/30s" duration="150\/30s" start="0\/30s"/);
  // clip 2: offset 5*30=150 frames, duration 3*30=90 frames, start 7*30=210 frames
  assert.match(xml, /offset="150\/30s" duration="90\/30s" start="210\/30s"/);
});

test("generateFcpxml never references a <title>/<effect> template (Premiere rejects the whole file if the Motion template UID can't be resolved)", () => {
  const xml = generateFcpxml(video, [{ sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 }]);

  assert.doesNotMatch(xml, /<title/);
  assert.doesNotMatch(xml, /<effect/);
});

test("generateFcpxml escapes special XML characters in the filename", () => {
  const xml = generateFcpxml({ ...video, filename: `a & b <c>.mp4` }, [
    { sourceStart: 0, sourceEnd: 1, timelineStart: 0, timelineEnd: 1 },
  ]);

  assert.doesNotMatch(xml.replace(/<\?xml.*?\?>/, ""), /a & b <c>\.mp4/);
  assert.match(xml, /a &amp; b &lt;c&gt;\.mp4/);
});

test("generateSrt formats timestamps as HH:MM:SS,mmm and numbers sequentially", () => {
  const srt = generateSrt([
    { timelineStart: 0, timelineEnd: 1.5, text: "こんにちは" },
    { timelineStart: 61.25, timelineEnd: 63, text: "2番目" },
  ]);

  assert.match(srt, /^1\n00:00:00,000 --> 00:00:01,500\nこんにちは\n/);
  assert.match(srt, /2\n00:01:01,250 --> 00:01:03,000\n2番目\n/);
});
