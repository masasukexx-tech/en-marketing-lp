"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { LeadDetail } from "@/types";

export function EngagementPanel({
  lead,
  onSetFollowUp,
  onAddNote,
}: {
  lead: LeadDetail;
  onSetFollowUp: (dueDate: string, memo: string) => Promise<void>;
  onAddNote: (content: string) => Promise<void>;
}) {
  const [dueDate, setDueDate] = useState("");
  const [memo, setMemo] = useState("");
  const [note, setNote] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  async function submitFollowUp() {
    if (!dueDate) return;
    setSavingFollowUp(true);
    try {
      await onSetFollowUp(dueDate, memo);
      setDueDate("");
      setMemo("");
    } finally {
      setSavingFollowUp(false);
    }
  }

  async function submitNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await onAddNote(note.trim());
      setNote("");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">次回対応日</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            現在の設定: <span className="font-medium text-foreground">{formatDate(lead.nextActionDate)}</span>
          </p>
          <div>
            <Label className="mb-1 block text-xs">次回対応日</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">メモ（任意）</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例: 提案資料を準備する" />
          </div>
          <Button size="sm" onClick={submitFollowUp} disabled={!dueDate || savingFollowUp}>
            {savingFollowUp ? "設定中..." : "次回対応日を設定"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">営業メモを追加</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            placeholder="商談メモや気づきを記録してください"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button size="sm" onClick={submitNote} disabled={!note.trim() || savingNote}>
            {savingNote ? "保存中..." : "メモを追加"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
