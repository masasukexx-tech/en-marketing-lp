import { buildCaptionsFromWords } from "./captions";
import { prisma } from "./db";
import { buildTimelineClips, withTimelineOffsets } from "./timeline";

/**
 * 現在の EditDecision（ユーザーによる復元操作を含む）から TimelineClip / Caption を再計算する。
 * 自動処理直後だけでなく、確認画面での復元操作のたびに呼び出す（design doc §3-4, §5-14）。
 */
export async function rebuildTimelineAndCaptions(videoAssetId: string): Promise<{
  timelineClips: number;
  captions: number;
}> {
  const [editDecisions, transcript] = await Promise.all([
    prisma.editDecision.findMany({ where: { videoAssetId } }),
    prisma.transcript.findUnique({
      where: { videoAssetId },
      include: { segments: { orderBy: { startSec: "asc" }, include: { words: { orderBy: { startSec: "asc" } } } } },
    }),
  ]);

  const clips = buildTimelineClips(editDecisions);
  const timelineClips = withTimelineOffsets(videoAssetId, clips);

  await prisma.$transaction([
    prisma.timelineClip.deleteMany({ where: { videoAssetId } }),
    prisma.caption.deleteMany({ where: { videoAssetId } }),
  ]);

  if (timelineClips.length) {
    await prisma.timelineClip.createMany({ data: timelineClips });
  }

  const words = (transcript?.segments ?? []).flatMap((seg) => seg.words);
  const captionsData = buildCaptionsFromWords(words, timelineClips).map((c) => ({ ...c, videoAssetId }));

  if (captionsData.length) {
    await prisma.caption.createMany({ data: captionsData });
  }

  return { timelineClips: timelineClips.length, captions: captionsData.length };
}
