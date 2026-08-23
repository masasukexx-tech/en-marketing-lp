import { NextRequest, NextResponse } from "next/server";

import { overallPercent, readProgress } from "@/lib/progress";

export const runtime = "nodejs";

/**
 * 処理中の進捗をポーリング取得する。
 * まだ一度も処理を実行していない/progress.jsonが無い場合は stage: null を返す。
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const state = await readProgress(params.id);
  if (!state) {
    return NextResponse.json({ stage: null, percent: 0 });
  }
  return NextResponse.json({ ...state, percent: overallPercent(state) });
}
