"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageDraftCard } from "@/components/leads/message-draft-card";
import type { LeadDetail } from "@/types";
import { AlertTriangle, Sparkles } from "lucide-react";

type MessageType = "CONNECTION_REQUEST" | "FIRST_DM";

interface GenerationInfo {
  missingInfo: string[];
  suggestedInfo: string[];
  genericWarning: boolean;
}

export function MessageGenerator({
  lead,
  onGenerate,
  onSaveDraft,
  onCopied,
  onRecheck,
}: {
  lead: LeadDetail;
  onGenerate: (type: MessageType) => Promise<GenerationInfo | void>;
  onSaveDraft: (id: string, editedContent: string) => Promise<void>;
  onCopied: (id: string) => Promise<void>;
  onRecheck: (id: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<MessageType>("CONNECTION_REQUEST");
  const [generating, setGenerating] = useState<MessageType | null>(null);
  const [info, setInfo] = useState<Record<MessageType, GenerationInfo | null>>({
    CONNECTION_REQUEST: null,
    FIRST_DM: null,
  });

  async function handleGenerate(type: MessageType) {
    setGenerating(type);
    try {
      const result = await onGenerate(type);
      if (result) setInfo((prev) => ({ ...prev, [type]: result }));
    } finally {
      setGenerating(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">メッセージ生成</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as MessageType)}>
          <TabsList>
            <TabsTrigger value="CONNECTION_REQUEST">つながり申請文</TabsTrigger>
            <TabsTrigger value="FIRST_DM">初回DM</TabsTrigger>
          </TabsList>

          {(["CONNECTION_REQUEST", "FIRST_DM"] as MessageType[]).map((type) => {
            const drafts = lead.messages.filter((m) => m.type === type);
            const batches = groupLatestBatch(drafts);
            const warn = info[type];

            return (
              <TabsContent key={type} value={type} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {type === "CONNECTION_REQUEST"
                      ? "180文字以内・自然につながることを目的とした3パターンを生成します。"
                      : "接続後に送る初回DMを3パターン生成します（350文字以内が目安）。"}
                  </p>
                  <Button size="sm" onClick={() => handleGenerate(type)} disabled={generating !== null}>
                    <Sparkles className="h-4 w-4" />
                    {generating === type ? "生成中..." : drafts.length > 0 ? "再生成する" : "生成する"}
                  </Button>
                </div>

                {warn?.genericWarning && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      情報が不足しているため汎用的な文面になっている可能性があります。
                      {warn.missingInfo.length > 0 && <div>不足情報: {warn.missingInfo.join(" / ")}</div>}
                      {warn.suggestedInfo.length > 0 && (
                        <div>追加すると精度が上がる項目: {warn.suggestedInfo.join(" / ")}</div>
                      )}
                    </div>
                  </div>
                )}

                {batches.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    まだ生成していません。「生成する」をクリックしてください。
                  </p>
                ) : (
                  <div className="space-y-3">
                    {batches.map((draft) => (
                      <MessageDraftCard
                        key={draft.id}
                        draft={draft}
                        onSave={onSaveDraft}
                        onCopied={onCopied}
                        onRecheck={onRecheck}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// 直近生成された1バッチ(3パターン)のみを表示する
function groupLatestBatch<T extends { createdAt: Date | string }>(drafts: T[]): T[] {
  if (drafts.length === 0) return [];
  const sorted = [...drafts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latestTime = new Date(sorted[0].createdAt).getTime();
  return sorted.filter((d) => Math.abs(new Date(d.createdAt).getTime() - latestTime) < 60_000);
}
