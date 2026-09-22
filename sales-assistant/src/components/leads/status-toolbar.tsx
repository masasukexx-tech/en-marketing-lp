"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { linkedInAdapter } from "@/lib/linkedin-adapter";
import type { LeadStatus } from "@/lib/status";
import type { LeadDetail } from "@/types";
import { Check, Copy, ExternalLink, MessageSquareText, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

function latestDraft(lead: LeadDetail, type: "CONNECTION_REQUEST" | "FIRST_DM") {
  const ofType = lead.messages.filter((m) => m.type === type);
  const adopted = ofType.find((m) => m.adopted);
  return adopted || ofType[0] || null;
}

export function StatusToolbar({
  lead,
  onStatusChange,
  onGenerate,
  onReply,
  onCopied,
  busy,
}: {
  lead: LeadDetail;
  onStatusChange: (status: LeadStatus, note?: string) => Promise<void>;
  onGenerate: (type: "CONNECTION_REQUEST" | "FIRST_DM") => Promise<void>;
  onReply: (content: string) => Promise<void>;
  onCopied: (messageId: string) => Promise<void>;
  busy: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const connReq = latestDraft(lead, "CONNECTION_REQUEST");
  const firstDm = latestDraft(lead, "FIRST_DM");

  async function copyDraft(draft: ReturnType<typeof latestDraft>, label: string) {
    if (!draft) return;
    const content = draft.editedContent || draft.content;
    const ok = await linkedInAdapter.copyToClipboard(content);
    setCopyFeedback(ok ? `${label}をコピーしました` : "コピーに失敗しました");
    if (ok) await onCopied(draft.id);
    setTimeout(() => setCopyFeedback(null), 3000);
  }

  async function submitReply() {
    if (!replyText.trim()) return;
    await onReply(replyText.trim());
    setReplyText("");
    setReplyOpen(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => linkedInAdapter.openProfile(lead.linkedinUrl)}>
          <ExternalLink className="h-4 w-4" />
          LinkedInを開く
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          size="sm"
          disabled={!connReq}
          onClick={() => copyDraft(connReq, "つながり申請文")}
        >
          <Copy className="h-4 w-4" />
          申請文をコピー
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => onStatusChange("REQUEST_SENT")}>
          申請済みに変更
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => onStatusChange("CONNECTED")}>
          接続済みに変更
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline" size="sm" disabled={busy} onClick={() => onGenerate("FIRST_DM")}>
          <Sparkles className="h-4 w-4" />
          初回DMを生成
        </Button>
        <Button variant="outline" size="sm" disabled={!firstDm} onClick={() => copyDraft(firstDm, "初回DM")}>
          <Copy className="h-4 w-4" />
          初回DMをコピー
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => onStatusChange("DM_SENT")}>
          DM送信済みに変更
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline" size="sm" onClick={() => setReplyOpen(true)}>
          <MessageSquareText className="h-4 w-4" />
          返信内容を記録
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="default"
          size="sm"
          disabled={busy}
          onClick={() => onStatusChange("MEETING")}
          className="bg-en-orange text-black hover:bg-en-orange-soft"
        >
          <ThumbsUp className="h-4 w-4" />
          商談化に変更
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => {
            if (confirm("この候補者を見送りにしますか？")) onStatusChange("PASSED");
          }}
        >
          <ThumbsDown className="h-4 w-4" />
          見送りに変更
        </Button>
      </div>

      {copyFeedback && (
        <p className="mt-2 flex items-center gap-1 text-xs text-en-orange">
          <Check className="h-3 w-3" />
          {copyFeedback}
        </p>
      )}

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>返信内容を記録</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder="相手からの返信内容を貼り付けてください"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={submitReply} disabled={!replyText.trim()}>
              記録する（返信ありに変更）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
