"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadHeader } from "@/components/leads/lead-header";
import { StatusToolbar } from "@/components/leads/status-toolbar";
import { ProfileCard } from "@/components/leads/profile-card";
import { CompatibilityPanel } from "@/components/leads/compatibility-panel";
import { MessageGenerator } from "@/components/leads/message-generator";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { EngagementPanel } from "@/components/leads/engagement-panel";
import type { EditableField } from "@/components/leads/profile-card";
import type { LeadDetail } from "@/types";
import type { LeadStatus } from "@/lib/status";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "処理に失敗しました");
  return data as T;
}

export function LeadDetailClient({ initialLead }: { initialLead: LeadDetail }) {
  const [lead, setLead] = useState(initialLead);
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    const data = await api<{ lead: LeadDetail }>(`/api/leads/${lead.id}`);
    setLead(data.lead);
  }

  async function withError<T>(fn: () => Promise<T>): Promise<T | void> {
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました");
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    await withError(async () => {
      await api(`/api/leads/${lead.id}/analyze`, { method: "POST" });
      await refetch();
    });
    setAnalyzing(false);
  }

  async function handleGenerate(type: "CONNECTION_REQUEST" | "FIRST_DM") {
    return withError(async () => {
      const data = await api<{ missingInfo: string[]; suggestedInfo: string[]; genericWarning: boolean }>(
        `/api/leads/${lead.id}/messages`,
        { method: "POST", body: JSON.stringify({ type }) },
      );
      await refetch();
      return data;
    });
  }

  async function handleSaveDraft(messageId: string, editedContent: string) {
    await withError(async () => {
      await api(`/api/leads/${lead.id}/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ editedContent }),
      });
      await refetch();
    });
  }

  async function handleCopied(messageId: string) {
    await withError(async () => {
      await api(`/api/leads/${lead.id}/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ adopted: true }),
      });
      await refetch();
    });
  }

  async function handleRecheck(messageId: string) {
    await withError(async () => {
      await api(`/api/leads/${lead.id}/messages/${messageId}/check`, { method: "POST" });
      await refetch();
    });
  }

  async function handleStatusChange(status: LeadStatus, note?: string) {
    setBusy(true);
    await withError(async () => {
      await api(`/api/leads/${lead.id}/status`, { method: "POST", body: JSON.stringify({ status, note }) });
      await refetch();
    });
    setBusy(false);
  }

  async function handleReply(content: string) {
    await withError(async () => {
      await api(`/api/leads/${lead.id}/reply`, { method: "POST", body: JSON.stringify({ content }) });
      await refetch();
    });
  }

  async function handleSetFollowUp(dueDate: string, memo: string) {
    await withError(async () => {
      await api(`/api/leads/${lead.id}/followup`, { method: "POST", body: JSON.stringify({ dueDate, memo }) });
      await refetch();
    });
  }

  async function handleAddNote(content: string) {
    await withError(async () => {
      await api(`/api/leads/${lead.id}/note`, { method: "POST", body: JSON.stringify({ content }) });
      await refetch();
    });
  }

  async function handleSaveProfile(patch: Partial<Record<EditableField, string>>) {
    await withError(async () => {
      await api(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      await refetch();
    });
  }

  return (
    <div className="space-y-6">
      <LeadHeader lead={lead} />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <StatusToolbar
        lead={lead}
        onStatusChange={handleStatusChange}
        onGenerate={async (type) => {
          await handleGenerate(type);
        }}
        onReply={handleReply}
        onCopied={handleCopied}
        busy={busy}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概要・相性判定</TabsTrigger>
          <TabsTrigger value="messages">メッセージ生成</TabsTrigger>
          <TabsTrigger value="history">履歴・対応管理</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ProfileCard lead={lead} onSave={handleSaveProfile} />
            <CompatibilityPanel lead={lead} onAnalyze={handleAnalyze} analyzing={analyzing} />
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <MessageGenerator
            lead={lead}
            onGenerate={handleGenerate}
            onSaveDraft={handleSaveDraft}
            onCopied={handleCopied}
            onRecheck={handleRecheck}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <EngagementPanel lead={lead} onSetFollowUp={handleSetFollowUp} onAddNote={handleAddNote} />
          <ActivityTimeline activities={lead.activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
