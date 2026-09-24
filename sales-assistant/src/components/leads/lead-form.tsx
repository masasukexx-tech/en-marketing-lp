"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface FormState {
  linkedinUrl: string;
  name: string;
  companyName: string;
  title: string;
  industry: string;
  location: string;
  profileText: string;
  workHistory: string;
  recentPosts: string;
  notes: string;
  source: string;
}

const EMPTY: FormState = {
  linkedinUrl: "",
  name: "",
  companyName: "",
  title: "",
  industry: "",
  location: "",
  profileText: "",
  workHistory: "",
  recentPosts: "",
  notes: "",
  source: "",
};

export function LeadForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setProgress("候補者を登録しています...");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "登録に失敗しました");
      }
      const leadId = data.lead.id as string;
      if (!data.automation?.eligible) {
        router.push(`/leads/${leadId}?automation=insufficient`);
        return;
      }

      setProgress("相性を自動判定しています...");
      const analysisRes = await fetch(`/api/leads/${leadId}/analyze?auto=1`, { method: "POST" });
      const analysisData = await analysisRes.json();
      if (!analysisRes.ok) {
        router.push(`/leads/${leadId}?automation=analysis_failed`);
        return;
      }

      if (analysisData.analysis.overallScore >= analysisData.autoMessageThreshold) {
        setProgress("80点以上のため、つながり申請文を自動生成しています...");
        const messageRes = await fetch(`/api/leads/${leadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "CONNECTION_REQUEST", automatic: true }),
        });
        if (!messageRes.ok) {
          router.push(`/leads/${leadId}?automation=message_failed`);
          return;
        }
        router.push(`/leads/${leadId}?automation=complete`);
        return;
      }

      router.push(`/leads/${leadId}?automation=below_threshold`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedInプロフィールURL" required className="sm:col-span-2">
              <Input
                required
                placeholder="https://www.linkedin.com/in/..."
                value={form.linkedinUrl}
                onChange={update("linkedinUrl")}
              />
            </Field>
            <Field label="氏名" required>
              <Input required value={form.name} onChange={update("name")} />
            </Field>
            <Field label="会社名" required>
              <Input required value={form.companyName} onChange={update("companyName")} />
            </Field>
            <Field label="役職">
              <Input value={form.title} onChange={update("title")} />
            </Field>
            <Field label="業界">
              <Input value={form.industry} onChange={update("industry")} />
            </Field>
            <Field label="所在地">
              <Input value={form.location} onChange={update("location")} />
            </Field>
            <Field label="登録経路">
              <Input
                placeholder="例: 紹介 / LinkedIn検索 / イベント名刺交換"
                value={form.source}
                onChange={update("source")}
              />
            </Field>
          </div>

          <Field label="プロフィール本文">
            <Textarea
              rows={4}
              placeholder="LinkedInプロフィールの自己紹介文などを手動でコピー＆ペーストしてください"
              value={form.profileText}
              onChange={update("profileText")}
            />
          </Field>
          <Field label="職歴">
            <Textarea rows={3} value={form.workHistory} onChange={update("workHistory")} />
          </Field>
          <Field label="最近の投稿内容">
            <Textarea
              rows={3}
              placeholder="直近の投稿内容の要約や引用を貼り付けてください"
              value={form.recentPosts}
              onChange={update("recentPosts")}
            />
          </Field>
          <Field label="メモ">
            <Textarea rows={2} value={form.notes} onChange={update("notes")} />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {progress && !error && (
            <p className="rounded-md border border-en-orange/40 bg-orange-950/30 px-3 py-2 text-sm text-orange-200">
              {progress} 画面を閉じずにお待ちください。
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "自動処理中..." : "登録して自動判定"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">
        {label}
        {required && <span className="ml-1 text-en-orange">*</span>}
      </Label>
      {children}
    </div>
  );
}
