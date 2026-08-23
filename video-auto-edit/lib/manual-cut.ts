export interface DecisionLike {
  sourceStart: number;
  sourceEnd: number;
  decision: "keep" | "cut" | "candidate";
  reason: "filler" | "silence" | "retake" | "manual";
  reasonDetail: string | null;
  confidence: number;
  restored: boolean;
}

/**
 * 既存のEditDecision群に、ユーザーが手動指定した任意の区間[cutStart,cutEnd]をカットとして割り込ませる。
 *
 * ルールベースのAIでは「そもそも不要な冒頭部分」のような主観的な範囲は判断できないため、
 * 確認画面から任意区間を直接カット指定できるようにする。既存の行と重なる部分は分割し、
 * 重なった区間そのものは手動カット行(reason="manual", confidence=1)に置き換える。
 */
export function splitDecisionsWithManualCut(
  decisions: DecisionLike[],
  cutStart: number,
  cutEnd: number
): DecisionLike[] {
  const result: DecisionLike[] = [];

  for (const d of decisions) {
    const overlapStart = Math.max(d.sourceStart, cutStart);
    const overlapEnd = Math.min(d.sourceEnd, cutEnd);

    if (overlapStart >= overlapEnd) {
      result.push(d);
      continue;
    }

    if (d.sourceStart < overlapStart) {
      result.push({ ...d, sourceEnd: overlapStart });
    }
    if (overlapEnd < d.sourceEnd) {
      result.push({ ...d, sourceStart: overlapEnd });
    }
    // overlap部分は破棄し、後段でまとめて手動カット行に置き換える
  }

  result.push({
    sourceStart: cutStart,
    sourceEnd: cutEnd,
    decision: "cut",
    reason: "manual",
    reasonDetail: "手動カット",
    confidence: 1,
    restored: false,
  });

  return result.sort((a, b) => a.sourceStart - b.sourceStart);
}
