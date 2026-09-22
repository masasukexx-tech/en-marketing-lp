"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadDetail } from "@/types";
import { Pencil, X } from "lucide-react";

export type EditableField =
  | "title"
  | "industry"
  | "location"
  | "profileText"
  | "workHistory"
  | "recentPosts"
  | "notes"
  | "source";

const FIELDS: { key: EditableField; label: string; multiline?: boolean }[] = [
  { key: "title", label: "役職" },
  { key: "industry", label: "業界" },
  { key: "location", label: "所在地" },
  { key: "source", label: "登録経路" },
  { key: "profileText", label: "プロフィール本文", multiline: true },
  { key: "workHistory", label: "職歴", multiline: true },
  { key: "recentPosts", label: "最近の投稿内容", multiline: true },
  { key: "notes", label: "メモ", multiline: true },
];

export function ProfileCard({
  lead,
  onSave,
}: {
  lead: LeadDetail;
  onSave: (patch: Partial<Record<EditableField, string>>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<EditableField, string>>({
    title: lead.title || "",
    industry: lead.industry || "",
    location: lead.location || "",
    profileText: lead.profileText || "",
    workHistory: lead.workHistory || "",
    recentPosts: lead.recentPosts || "",
    notes: lead.notes || "",
    source: lead.source || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">プロフィール情報</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setEditing((v) => !v)}>
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editing ? "キャンセル" : "編集"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="mb-1 block text-xs text-muted-foreground">{f.label}</Label>
            {editing ? (
              f.multiline ? (
                <Textarea
                  rows={3}
                  value={form[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              ) : (
                <Input value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
              )
            ) : (
              <p className="whitespace-pre-wrap text-sm">{lead[f.key] || "(未入力)"}</p>
            )}
          </div>
        ))}
        {editing && (
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
