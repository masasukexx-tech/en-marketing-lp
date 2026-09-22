import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_STYLE, STATUS_BADGE_STYLE, statusLabel, type Priority } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { LeadRow } from "@/lib/leads";

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        条件に一致する候補者がいません。
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名 / 会社名</TableHead>
            <TableHead>役職 / 業界</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>優先度</TableHead>
            <TableHead>総合スコア</TableHead>
            <TableHead>顧客 / 協業</TableHead>
            <TableHead>次回対応日</TableHead>
            <TableHead>登録日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const overdue =
              lead.nextActionDate &&
              new Date(lead.nextActionDate) < new Date() &&
              lead.status !== "MEETING" &&
              lead.status !== "PASSED";
            return (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                    {lead.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{lead.companyName}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div>{lead.title || "-"}</div>
                  <div className="text-xs">{lead.industry || "-"}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_BADGE_STYLE[lead.status as never]}>
                    {statusLabel(lead.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.priority ? (
                    <Badge variant="outline" className={PRIORITY_STYLE[lead.priority as Priority]}>
                      {lead.priority}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">未判定</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {lead.overallScore ?? <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-xs">
                  {lead.isCustomerLead && <Badge variant="secondary" className="mr-1">顧客</Badge>}
                  {lead.isPartnerLead && <Badge variant="secondary">協業</Badge>}
                  {!lead.isCustomerLead && !lead.isPartnerLead && <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className={overdue ? "text-sm font-semibold text-destructive" : "text-sm"}>
                  {formatDate(lead.nextActionDate)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
