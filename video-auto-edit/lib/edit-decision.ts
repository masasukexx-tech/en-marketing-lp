import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { detectSilence, type SilenceInterval } from "./ffmpeg";

export type CutStrength = "weak" | "standard" | "strong";

/**
 * confidence がこの閾値以上なら自動で "cut"、未満なら "candidate"（誤削除防止, design doc §3-4）。
 * strong ほど積極的にカットする。
 */
const CUT_CONFIDENCE_THRESHOLD: Record<CutStrength, number> = {
  weak: 0.9,
  standard: 0.75,
  strong: 0.6,
};

const THINKING_WORDS = new Set(["えっと", "えー", "えーと", "そうですね", "うーん"]);
const SENTENCE_END_PUNCTUATION = /[。！？!?]\s*$/;

export interface TranscriptWordLike {
  word: string;
  startSec: number;
  endSec: number;
  confidence: number;
}

export interface TranscriptSegmentLike {
  text: string;
  startSec: number;
  endSec: number;
  confidence: number;
  words: TranscriptWordLike[];
}

export interface EditDecisionCandidate {
  sourceStart: number;
  sourceEnd: number;
  decision: "cut" | "candidate";
  reason: "filler" | "silence" | "retake";
  reasonDetail: string | null;
  confidence: number;
}

export interface EditDecisionRow extends Omit<EditDecisionCandidate, "decision"> {
  decision: "keep" | "cut" | "candidate";
  restored: boolean;
}

interface TextAnalysisResult {
  filler: Array<{ sourceStart: number; sourceEnd: number; reason: string; reasonDetail: string; confidence: number }>;
  retake: Array<{ sourceStart: number; sourceEnd: number; reason: string; reasonDetail: string; confidence: number }>;
}

/** Python の analyze_text.py を child_process で実行し、フィラー/言い直し候補を取得する */
export async function runTextAnalysis(
  transcriptJsonPath: string,
  outputJsonPath: string,
  pythonBin = process.env.PYTHON_BIN ?? "python3"
): Promise<TextAnalysisResult> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(pythonBin, [
      path.join(process.cwd(), "scripts", "analyze_text.py"),
      transcriptJsonPath,
      outputJsonPath,
    ]);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`analyze_text.py exited with code ${code}: ${stderr}`));
    });
  });

  const raw = await fs.readFile(outputJsonPath, "utf-8");
  return JSON.parse(raw) as TextAnalysisResult;
}

function findPrecedingWord(atSec: number, segments: TranscriptSegmentLike[]): string | null {
  let closest: { word: string; endSec: number } | null = null;
  for (const seg of segments) {
    for (const w of seg.words) {
      if (w.endSec <= atSec && (!closest || w.endSec > closest.endSec)) {
        closest = { word: w.word, endSec: w.endSec };
      }
    }
  }
  return closest?.word ?? null;
}

function endsAtSentenceBoundary(atSec: number, segments: TranscriptSegmentLike[]): boolean {
  for (const seg of segments) {
    if (Math.abs(seg.endSec - atSec) < 0.05) {
      return SENTENCE_END_PUNCTUATION.test(seg.text);
    }
  }
  return false;
}

/** 無音区間を3階層に分類する（design doc §3-1） */
export function classifySilenceIntervals(
  intervals: SilenceInterval[],
  segments: TranscriptSegmentLike[],
  cutStrength: CutStrength = "standard"
): EditDecisionCandidate[] {
  const threshold = CUT_CONFIDENCE_THRESHOLD[cutStrength];
  const candidates: EditDecisionCandidate[] = [];

  for (const interval of intervals) {
    const duration = interval.endSec - interval.startSec;
    if (duration < 0.3) continue; // 短すぎる間は常にkeep(候補化しない)

    const precedingWord = findPrecedingWord(interval.startSec, segments);
    const isThinking = precedingWord ? THINKING_WORDS.has(precedingWord) : false;
    const atSentenceEnd = endsAtSentenceBoundary(interval.startSec, segments);

    let confidence: number;
    let reasonDetail: string;

    if (duration < 1.5) {
      confidence = atSentenceEnd ? 0.3 : 0.55;
      reasonDetail = `${duration.toFixed(2)}s gap${atSentenceEnd ? " at sentence end" : " mid-sentence"}`;
    } else {
      confidence = isThinking ? 0.5 : 0.85;
      reasonDetail = `${duration.toFixed(2)}s gap${isThinking ? ` after thinking word "${precedingWord}"` : ""}`;
    }

    candidates.push({
      sourceStart: interval.startSec,
      sourceEnd: interval.endSec,
      decision: confidence >= threshold ? "cut" : "candidate",
      reason: "silence",
      reasonDetail,
      confidence,
    });
  }

  return candidates;
}

function applyThreshold(
  raw: Array<{ sourceStart: number; sourceEnd: number; reason: string; reasonDetail: string; confidence: number }>,
  reason: "filler" | "retake",
  cutStrength: CutStrength
): EditDecisionCandidate[] {
  const threshold = CUT_CONFIDENCE_THRESHOLD[cutStrength];
  return raw.map((c) => ({
    sourceStart: c.sourceStart,
    sourceEnd: c.sourceEnd,
    reason,
    reasonDetail: c.reasonDetail,
    confidence: c.confidence,
    decision: c.confidence >= threshold ? "cut" : "candidate",
  }));
}

/** 重なり合う候補区間をマージする（cutが1つでもあればcut優先） */
function mergeOverlapping(candidates: EditDecisionCandidate[]): EditDecisionCandidate[] {
  const sorted = candidates.slice().sort((a, b) => a.sourceStart - b.sourceStart);
  const merged: EditDecisionCandidate[] = [];

  for (const c of sorted) {
    const last = merged[merged.length - 1];
    if (last && c.sourceStart <= last.sourceEnd) {
      last.sourceEnd = Math.max(last.sourceEnd, c.sourceEnd);
      last.confidence = Math.max(last.confidence, c.confidence);
      last.decision = last.decision === "cut" || c.decision === "cut" ? "cut" : "candidate";
      last.reasonDetail = `${last.reasonDetail ?? ""}; ${c.reason}:${c.reasonDetail ?? ""}`;
    } else {
      merged.push({ ...c });
    }
  }

  return merged;
}

/** [0, durationSec] のうち問題区間(cut/candidate)に含まれない部分を "keep" として埋める */
function fillKeptGaps(durationSec: number, problemSpans: EditDecisionCandidate[]): EditDecisionRow[] {
  const sorted = problemSpans.slice().sort((a, b) => a.sourceStart - b.sourceStart);
  const rows: EditDecisionRow[] = [];
  let cursor = 0;

  for (const span of sorted) {
    if (span.sourceStart > cursor) {
      rows.push({
        sourceStart: cursor,
        sourceEnd: span.sourceStart,
        decision: "keep",
        reason: "silence",
        reasonDetail: null,
        confidence: 1,
        restored: false,
      });
    }
    rows.push({ ...span, restored: false });
    cursor = Math.max(cursor, span.sourceEnd);
  }

  if (cursor < durationSec) {
    rows.push({
      sourceStart: cursor,
      sourceEnd: durationSec,
      decision: "keep",
      reason: "silence",
      reasonDetail: null,
      confidence: 1,
      restored: false,
    });
  }

  return rows;
}

/**
 * 音声解析(silencedetect)・文字起こし・テキスト解析(filler/retake)の結果を統合し、
 * ビデオ全体をカバーする EditDecision の配列を生成する。
 */
export async function generateEditDecisions(params: {
  audioPath: string;
  durationSec: number;
  segments: TranscriptSegmentLike[];
  transcriptJsonPath: string;
  analysisOutputJsonPath: string;
  cutStrength: CutStrength;
}): Promise<EditDecisionRow[]> {
  const { audioPath, durationSec, segments, transcriptJsonPath, analysisOutputJsonPath, cutStrength } = params;

  const [silenceIntervals, textAnalysis] = await Promise.all([
    detectSilence(audioPath),
    runTextAnalysis(transcriptJsonPath, analysisOutputJsonPath),
  ]);

  const silenceCandidates = classifySilenceIntervals(silenceIntervals, segments, cutStrength);
  const fillerCandidates = applyThreshold(textAnalysis.filler, "filler", cutStrength);
  const retakeCandidates = applyThreshold(textAnalysis.retake, "retake", cutStrength);

  const merged = mergeOverlapping([...silenceCandidates, ...fillerCandidates, ...retakeCandidates]);
  return fillKeptGaps(durationSec, merged);
}
