"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CHECK_CRITERIA, type MessageCheckResult } from "@/lib/schemas";
import { linkedInAdapter } from "@/lib/linkedin-adapter";
import { cn } from "@/lib/utils";
import type { MessageDraft } from "@prisma/client";
import { Check, Copy, RefreshCcw, Save, X } from "lucide-react";

type CheckPayload = (MessageCheckResult & { autoRevised?: boolean; manualRecheck?: boolean }) | { skipped: true };

function parseCheck(json: string | null): CheckPayload | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function MessageDraftCard({
  draft,
  onSave,
  onCopied,
  onRecheck,
}: {
  draft: MessageDraft;
  onSave: (id: string, editedContent: string) => Promise<void>;
  onCopied: (id: string) => Promise<void>;
  onRecheck: (id: string) => Promise<void>;
}) {
  const initial = draft.editedContent || draft.content;
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [copyOk, setCopyOk] = useState<boolean | null>(null);

  const dirty = text !== initial;
  const limit = draft.type === "CONNECTION_REQUEST" ? 180 : 350;
  const check = useMemo(() => parseCheck(draft.checkResult), [draft.checkResult]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft.id, text);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    const ok = await linkedInAdapter.copyToClipboard(text);
    setCopyOk(ok);
    if (ok) await onCopied(draft.id);
    setTimeout(() => setCopyOk(null), 2500);
  }

  async function handleRecheck() {
    setRechecking(true);
    try {
      await onRecheck(draft.id);
    } finally {
      setRechecking(false);
    }
  }

  const overallPassed = check && "overallPassed" in check ? check.overallPassed : null;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge>{draft.label}</Badge>
          {draft.adopted && (
            <Badge variant="outline" className="border-en-orange text-en-orange">
              採用済み
            </Badge>
          )}
          {check && "autoRevised" in check && check.autoRevised && (
            <Badge variant="secondary">文面チェックで自動修正済み</Badge>
          )}
        </div>
        <span className={cn("text-xs", text.length > limit ? "text-destructive" : "text-muted-foreground")}>
          {text.length} / {limit}文字
        </span>
      </div>

      <Textarea rows={draft.type === "CONNECTION_REQUEST" ? 4 : 7} value={text} onChange={(e) => setText(e.target.value)} />

      {check && "issues" in check && (
        <div className="mt-2 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {check.issues.map((issue) => {
              const meta = CHECK_CRITERIA.find((c) => c.id === issue.id);
              return (
                <span
                  key={issue.id}
                  title={issue.comment}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                    issue.passed
                      ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
                      : "border-destructive/50 bg-destructive/10 text-destructive",
                  )}
                >
                  {issue.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {meta?.label ?? issue.id}
                </span>
              );
            })}
          </div>
          <p className={cn("text-xs", overallPassed ? "text-emerald-400" : "text-destructive")}>
            {overallPassed ? "文面チェック: 問題なし" : "文面チェック: 一部項目に注意が必要です"}
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          コピー
        </Button>
        <Button size="sm" variant="outline" onClick={handleSave} disabled={!dirty || saving}>
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : "編集内容を保存"}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleRecheck} disabled={rechecking}>
          <RefreshCcw className="h-4 w-4" />
          {rechecking ? "チェック中..." : "再チェック"}
        </Button>
        {copyOk !== null && (
          <span className={cn("text-xs", copyOk ? "text-en-orange" : "text-destructive")}>
            {copyOk ? "コピーしました" : "コピーに失敗しました"}
          </span>
        )}
      </div>
    </div>
  );
}
