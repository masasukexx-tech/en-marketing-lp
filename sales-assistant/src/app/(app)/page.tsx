import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_STYLE, STATUS_BADGE_STYLE, statusLabel, type Priority } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getAttentionLeads() {
  const leads = await prisma.lead.findMany({
    where: {
      status: { notIn: ["MEETING", "PASSED"] },
      nextActionDate: { not: null },
    },
    orderBy: { nextActionDate: "asc" },
    take: 6,
  });
  return leads;
}

export default async function DashboardPage() {
  const [stats, attentionLeads] = await Promise.all([getDashboardStats(), getAttentionLeads()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">
          LinkedIn営業パイプライン全体の状況を確認できます。
        </p>
      </div>

      <StatsCards stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">次回対応が近い候補者</CardTitle>
        </CardHeader>
        <CardContent>
          {attentionLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              次回対応日が設定されている候補者はいません。
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {attentionLeads.map((lead) => {
                const overdue = lead.nextActionDate && new Date(lead.nextActionDate) < new Date();
                return (
                  <li key={lead.id} className="flex items-center justify-between py-2.5">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-sm text-muted-foreground">{lead.companyName}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      {lead.priority && (
                        <Badge
                          variant="outline"
                          className={PRIORITY_STYLE[lead.priority as Priority]}
                        >
                          {lead.priority}
                        </Badge>
                      )}
                      <Badge variant="outline" className={STATUS_BADGE_STYLE[lead.status as never]}>
                        {statusLabel(lead.status)}
                      </Badge>
                      <span className={overdue ? "text-sm font-semibold text-destructive" : "text-sm text-muted-foreground"}>
                        {formatDate(lead.nextActionDate)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
