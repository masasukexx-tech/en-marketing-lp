import { safeRate } from "./status";

export interface DashboardCounts {
  totalLeads: number; // 登録候補数
  reviewedCount: number; // 審査済み数（相性判定を実施したリード数）
  requestSentCount: number; // つながり申請済み数（累計・見送り後も含む）
  connectedCount: number; // 接続済み数
  dmSentCount: number; // 初回DM送信済み数
  repliedCount: number; // 返信数
  meetingCount: number; // 商談数
}

export interface DashboardStats extends DashboardCounts {
  connectionRate: number; // 接続率 = 接続済み / つながり申請済み
  replyRate: number; // 返信率 = 返信 / 初回DM送信済み
  meetingRate: number; // 商談化率 = 商談 / 返信
}

/**
 * 各ステータス到達の「累計人数」からダッシュボード指標を計算する純粋関数。
 * 累計人数は「そのステータスに一度でも到達したリード数」であり、
 * その後 見送り 等になっても減算しない（過去の実績として扱う）。
 */
export function computeDashboardStats(counts: DashboardCounts): DashboardStats {
  return {
    ...counts,
    connectionRate: safeRate(counts.connectedCount, counts.requestSentCount),
    replyRate: safeRate(counts.repliedCount, counts.dmSentCount),
    meetingRate: safeRate(counts.meetingCount, counts.repliedCount),
  };
}
