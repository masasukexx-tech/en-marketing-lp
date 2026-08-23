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

test("generateFcpxml emits a Final Cut Pro 7 XML (xmeml) sequence, not modern FCPXML", () => {
  const xml = generateFcpxml(video, [{ sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 }]);

  // Premiere Pro (verified against 26.0.1) only imports this legacy xmeml format via File > Import;
  // it does not accept the modern <fcpxml> root at all.
  assert.match(xml, /<!DOCTYPE xmeml>/);
  assert.match(xml, /<xmeml version="4">/);
  assert.doesNotMatch(xml, /<fcpxml/);
});

test("generateFcpxml converts source/timeline seconds to frame counts for both video and audio tracks", () => {
  const clips = [
    { sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 },
    { sourceStart: 7, sourceEnd: 10, timelineStart: 5, timelineEnd: 8 },
  ];

  const xml = generateFcpxml(video, clips);

  assert.match(xml, /<timebase>30<\/timebase>/);
  // clip 1: in=0, out=150, start=0, end=150 (frames at 30fps)
  assert.match(xml, /<start>0<\/start>\s*<end>150<\/end>\s*<in>0<\/in>\s*<out>150<\/out>/);
  // clip 2: source 7-10s -> in=210,out=300; timeline 5-8s -> start=150,end=240
  assert.match(xml, /<start>150<\/start>\s*<end>240<\/end>\s*<in>210<\/in>\s*<out>300<\/out>/);

  const videoClipCount = (xml.match(/<clipitem id="clipitem-v/g) ?? []).length;
  const audioClipCount = (xml.match(/<clipitem id="clipitem-a/g) ?? []).length;
  assert.equal(videoClipCount, 2);
  assert.equal(audioClipCount, 2);
});

test("generateFcpxml only fully defines the <file> once and reuses the id afterwards", () => {
  const clips = [
    { sourceStart: 0, sourceEnd: 5, timelineStart: 0, timelineEnd: 5 },
    { sourceStart: 5, sourceEnd: 10, timelineStart: 5, timelineEnd: 10 },
  ];

  const xml = generateFcpxml(video, clips);

  const fullFileDefs = (xml.match(/<file id="file-1">/g) ?? []).length;
  const bareFileRefs = (xml.match(/<file id="file-1"\/>/g) ?? []).length;

  assert.equal(fullFileDefs, 1);
  // 1 video clip reuses the ref (clip 2) + 2 audio clips (both) = 3 bare refs
  assert.equal(bareFileRefs, 3);
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
