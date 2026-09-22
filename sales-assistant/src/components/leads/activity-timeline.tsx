import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabel } from "@/lib/status";
import { formatDateTime } from "@/lib/utils";
import type { Activity } from "@prisma/client";

const TYPE_LABEL: Record<string, string> = {
  STATUS_CHANGE: "ステータス変更",
  NOTE: "メモ",
  REPLY: "返信記録",
  MESSAGE_GENERATED: "メッセージ生成",
  MESSAGE_COPIED: "メッセージコピー",
  ANALYSIS: "相性判定",
  FOLLOW_UP: "次回対応日設定",
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">対応履歴</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">履歴はまだありません。</p>
        ) : (
          <ol className="space-y-3 border-l border-border pl-4">
            {activities.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-en-orange" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-semibold text-en-orange">{TYPE_LABEL[a.type] ?? a.type}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                </div>
                {a.type === "STATUS_CHANGE" && (
                  <p className="text-sm">
                    {a.fromStatus ? `${statusLabel(a.fromStatus)} → ` : ""}
                    {a.toStatus ? statusLabel(a.toStatus) : ""}
                  </p>
                )}
                {a.content && <p className="text-sm text-muted-foreground">{a.content}</p>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
