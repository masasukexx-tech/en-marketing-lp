"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_STYLE, type Priority } from "@/lib/status";
import type { LeadDetail } from "@/types";
import { AlertTriangle, Sparkles } from "lucide-react";

function parseList(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function CompatibilityPanel({
  lead,
  onAnalyze,
  analyzing,
}: {
  lead: LeadDetail;
  onAnalyze: () => Promise<void>;
  analyzing: boolean;
}) {
  const latest = lead.analyses[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">相性判定</CardTitle>
        <Button size="sm" onClick={onAnalyze} disabled={analyzing}>
          <Sparkles className="h-4 w-4" />
          {analyzing ? "判定中..." : latest ? "再判定する" : "相性を判定する"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!latest && (
          <p className="text-sm text-muted-foreground">
            まだ相性判定を実施していません。「相性を判定する」をクリックしてください。
          </p>
        )}

        {latest && (
          <>
            {latest.modelUsed === "mock" && (
              <div className="rounded-md border border-sky-800 bg-sky-950/50 px-3 py-2 text-xs text-sky-300">
                モック生成結果です（GEMINI_API_KEY未設定）。実際のAI判定ではありません。
              </div>
            )}
            {latest.genericWarning && (
              <div className="flex items-start gap-2 rounded-md border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  情報が不足しているため、汎用的な内容になっている可能性があります。プロフィール本文・職歴・最近の投稿内容を追加登録すると精度が上がります。
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreTile label="総合スコア" value={latest.overallScore} highlight />
              <ScoreTile label="顧客候補スコア" value={latest.customerScore} />
              <ScoreTile label="協業候補スコア" value={latest.partnerScore} />
              <div className="rounded-md border border-border p-3 text-center">
                <div className="text-xs text-muted-foreground">優先度</div>
                <Badge variant="outline" className={`${PRIORITY_STYLE[latest.priority as Priority]} mt-1`}>
                  {latest.priority}
                </Badge>
              </div>
            </div>

            <ListSection title="相性がよい理由" items={parseList(latest.reasons)} />
            <ListSection title="相手が抱えていそうな課題" items={parseList(latest.painPoints)} />
            <ListSection title="ENから提供できる価値" items={parseList(latest.valueProps)} />
            <ListSection title="最初の会話で触れるべき話題" items={parseList(latest.talkingPoints)} />

            {latest.cautions && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <span className="font-semibold">見送りを検討すべき理由: </span>
                {latest.cautions}
              </div>
            )}

            {parseList(latest.missingInfo).length > 0 && (
              <ListSection title="不足している情報" items={parseList(latest.missingInfo)} muted />
            )}
            {parseList(latest.suggestedInfo).length > 0 && (
              <ListSection title="追加すると精度が上がる項目" items={parseList(latest.suggestedInfo)} muted />
            )}

            <p className="text-xs text-muted-foreground">
              判定日時: {new Date(latest.createdAt).toLocaleString("ja-JP")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-border p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={highlight ? "text-2xl font-bold text-en-orange" : "text-xl font-semibold"}>{value}</div>
    </div>
  );
}

function ListSection({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <ul className={`list-inside list-disc space-y-0.5 text-sm ${muted ? "text-muted-foreground" : ""}`}>
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
