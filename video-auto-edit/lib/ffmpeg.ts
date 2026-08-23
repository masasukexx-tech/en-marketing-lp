import { spawn } from "node:child_process";

export interface VideoMetadata {
  durationSec: number;
  width: number;
  height: number;
  fps: number;
}

export interface SilenceInterval {
  startSec: number;
  endSec: number;
}

class ProcessExitError extends Error {
  stderr: string;

  constructor(message: string, stderr: string) {
    super(message);
    this.stderr = stderr;
  }
}

function runCapture(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new ProcessExitError(`${cmd} exited with code ${code}`, stderr));
    });
  });
}

/** ffprobe で動画の尺・解像度・fps を取得する（design doc §5-4） */
export async function probeVideo(filePath: string): Promise<VideoMetadata> {
  const { stdout } = await runCapture("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,r_frame_rate:format=duration",
    "-of",
    "json",
    filePath,
  ]);

  const parsed = JSON.parse(stdout);
  const stream = parsed.streams?.[0];
  if (!stream) {
    throw new Error(`ffprobe found no video stream in ${filePath}`);
  }

  const [num, den] = String(stream.r_frame_rate ?? "0/1").split("/").map(Number);
  const fps = den ? num / den : num;

  return {
    durationSec: Number(parsed.format?.duration ?? 0),
    width: Number(stream.width ?? 0),
    height: Number(stream.height ?? 0),
    fps,
  };
}

/**
 * 音声トラックを wav (16kHz mono) として抽出する。
 * faster-whisper への入力に必要な最小限の変換のみ行う（映像は触らない＝非破壊）。
 */
export async function extractAudio(inputPath: string, outputWavPath: string): Promise<void> {
  await runCapture("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-acodec",
    "pcm_s16le",
    outputWavPath,
  ]);
}

/**
 * silencedetect フィルタで無音区間を検出する（design doc §3-1）。
 * noiseDb: 無音とみなす閾値(dB)、minDurationSec: 最小無音長。
 */
export async function detectSilence(
  audioPath: string,
  noiseDb = -30,
  minDurationSec = 0.3
): Promise<SilenceInterval[]> {
  let stderr = "";
  try {
    const result = await runCapture("ffmpeg", [
      "-i",
      audioPath,
      "-af",
      `silencedetect=noise=${noiseDb}dB:d=${minDurationSec}`,
      "-f",
      "null",
      "-",
    ]);
    stderr = result.stderr;
  } catch (err) {
    // ffmpeg -f null は非ゼロ終了しないはずだが、念のためstderrを拾う
    if (err instanceof ProcessExitError) {
      stderr = err.stderr;
    } else {
      throw err;
    }
  }

  return parseSilenceDetectOutput(stderr);
}

/** silencedetect の stderr ログを {start, end} の配列にパースする */
export function parseSilenceDetectOutput(stderr: string): SilenceInterval[] {
  const starts: number[] = [];
  const intervals: SilenceInterval[] = [];

  const startRe = /silence_start:\s*(-?\d+(?:\.\d+)?)/g;
  const endRe = /silence_end:\s*(-?\d+(?:\.\d+)?)/g;

  const lines = stderr.split("\n");
  let pendingStart: number | null = null;

  for (const line of lines) {
    startRe.lastIndex = 0;
    endRe.lastIndex = 0;
    const startMatch = startRe.exec(line);
    if (startMatch) {
      pendingStart = Number(startMatch[1]);
      starts.push(pendingStart);
      continue;
    }
    const endMatch = endRe.exec(line);
    if (endMatch && pendingStart !== null) {
      intervals.push({ startSec: pendingStart, endSec: Number(endMatch[1]) });
      pendingStart = null;
    }
  }

  return intervals;
}
