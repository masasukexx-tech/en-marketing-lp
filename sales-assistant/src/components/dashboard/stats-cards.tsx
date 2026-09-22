import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold tabular-nums">{value.toLocaleString("ja-JP")}</div>
      </CardContent>
    </Card>
  );
}

function RateTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-en-orange/40 bg-gradient-to-br from-en-charcoal to-black">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="en-gradient-text text-2xl font-bold tabular-nums">{value.toFixed(1)}%</div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full bg-en-orange")}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <CountTile label="登録候補数" value={stats.totalLeads} />
        <CountTile label="審査済み数" value={stats.reviewedCount} />
        <CountTile label="つながり申請済み数" value={stats.requestSentCount} />
        <CountTile label="接続済み数" value={stats.connectedCount} />
        <CountTile label="初回DM送信済み数" value={stats.dmSentCount} />
        <CountTile label="返信数" value={stats.repliedCount} />
        <CountTile label="商談数" value={stats.meetingCount} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RateTile label="接続率（接続済み / つながり申請済み）" value={stats.connectionRate} />
        <RateTile label="返信率（返信 / 初回DM送信済み）" value={stats.replyRate} />
        <RateTile label="商談化率（商談 / 返信）" value={stats.meetingRate} />
      </div>
    </div>
  );
}
