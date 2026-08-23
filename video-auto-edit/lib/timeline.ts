import type { EditDecision, TimelineClip } from "@prisma/client";

export interface TimelineClipInput {
  sourceStart: number;
  sourceEnd: number;
}

/**
 * EditDecision から実際に残す区間を組み立てる。
 * 誤削除防止のため(design doc §3-4)、"cut" 以外（keep / candidate）と、
 * 一度cutされてもユーザーが復元(restored)したものはすべて残す。
 * ソース時刻順に並べ、タイムライン上の連続クリップへ変換する（design doc §2, §5-12）。
 */
export function buildTimelineClips(
  editDecisions: Pick<EditDecision, "sourceStart" | "sourceEnd" | "decision" | "restored">[]
): TimelineClipInput[] {
  const kept = editDecisions
    .filter((d) => d.decision !== "cut" || d.restored)
    .slice()
    .sort((a, b) => a.sourceStart - b.sourceStart);

  const clips: TimelineClipInput[] = [];

  for (const decision of kept) {
    const duration = decision.sourceEnd - decision.sourceStart;
    if (duration <= 0) continue;
    clips.push({ sourceStart: decision.sourceStart, sourceEnd: decision.sourceEnd });
  }

  return clips;
}

/** buildTimelineClips() の結果に timelineStart/timelineEnd/orderIndex を付与する */
export function withTimelineOffsets(
  videoAssetId: string,
  clips: TimelineClipInput[]
): Array<Omit<TimelineClip, "id">> {
  let cursor = 0;
  return clips.map((clip, index) => {
    const duration = clip.sourceEnd - clip.sourceStart;
    const timelineStart = cursor;
    const timelineEnd = cursor + duration;
    cursor = timelineEnd;
    return {
      videoAssetId,
      sourceStart: clip.sourceStart,
      sourceEnd: clip.sourceEnd,
      timelineStart,
      timelineEnd,
      orderIndex: index,
    };
  });
}

/**
 * ソース側のタイムコード(sourceSec)を、カット後タイムライン上の表示用タイムコードへ変換する。
 * TimelineClip を唯一の真実源とし、WordTimestamp・Caption の同期に使う（design doc §2 末尾）。
 * ソースがカットされた区間内にある場合は null を返す。
 */
export function mapSourceToTimeline(
  sourceSec: number,
  clips: Pick<TimelineClip, "sourceStart" | "sourceEnd" | "timelineStart">[]
): number | null {
  for (const clip of clips) {
    if (sourceSec >= clip.sourceStart && sourceSec <= clip.sourceEnd) {
      return clip.timelineStart + (sourceSec - clip.sourceStart);
    }
  }
  return null;
}
