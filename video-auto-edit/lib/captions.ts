export interface CaptionWordLike {
  word: string;
  startSec: number;
  endSec: number;
}

export interface CaptionRow {
  timelineStart: number;
  timelineEnd: number;
  text: string;
}

export interface ClipForCaption {
  sourceStart: number;
  sourceEnd: number;
  timelineStart: number;
  timelineEnd: number;
}

function findClipIndex(sourceSec: number, clips: ClipForCaption[]): number | null {
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i]!;
    if (sourceSec >= clip.sourceStart && sourceSec <= clip.sourceEnd) return i;
  }
  return null;
}

/**
 * word-levelタイムスタンプから、実際にタイムライン上に残っている単語だけでキャプションを組み立てる。
 *
 * 文字起こしセグメント(文単位)をそのままキャプションにすると、セグメントの一部の単語だけが
 * フィラー/無音カットで削除された場合に、キャプションの表示時間と実際に画面に映っている尺が
 * ズレてしまう。単語ごとにどのTimelineClipへマッピングされるかを追跡し、カット（別クリップへの
 * 切り替わり）をまたぐ箇所では必ずキャプションを分割することで、表示時間を常に実際の映像と一致させる。
 */
export function buildCaptionsFromWords(
  words: CaptionWordLike[],
  clips: ClipForCaption[],
  maxDurationSec = 6,
  maxChars = 28
): CaptionRow[] {
  const captions: CaptionRow[] = [];
  let current: { clipIndex: number; timelineStart: number; timelineEnd: number; text: string } | null = null;

  for (const w of words) {
    const clipIndex = findClipIndex(w.startSec, clips);
    if (clipIndex === null) {
      // 単語自体がカットされた区間に含まれている(=生き残っていない)
      if (current) {
        captions.push({ timelineStart: current.timelineStart, timelineEnd: current.timelineEnd, text: current.text });
        current = null;
      }
      continue;
    }

    const clip = clips[clipIndex]!;
    const start = clip.timelineStart + (w.startSec - clip.sourceStart);
    // 単語の終端がこのクリップの範囲をわずかに超える場合は、クリップの終端に丸める
    const end = w.endSec <= clip.sourceEnd ? clip.timelineStart + (w.endSec - clip.sourceStart) : clip.timelineEnd;

    const canExtend =
      current !== null &&
      current.clipIndex === clipIndex &&
      current.text.length < maxChars &&
      end - current.timelineStart <= maxDurationSec;

    if (canExtend && current) {
      current.text += w.word;
      current.timelineEnd = end;
    } else {
      if (current) {
        captions.push({ timelineStart: current.timelineStart, timelineEnd: current.timelineEnd, text: current.text });
      }
      current = { clipIndex, timelineStart: start, timelineEnd: end, text: w.word };
    }
  }

  if (current) {
    captions.push({ timelineStart: current.timelineStart, timelineEnd: current.timelineEnd, text: current.text });
  }

  return captions;
}
