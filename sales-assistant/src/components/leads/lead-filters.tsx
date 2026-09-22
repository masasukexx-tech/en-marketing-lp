"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LEAD_STATUSES, PRIORITIES } from "@/lib/status";
import { X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "created_desc", label: "登録日の新しい順" },
  { value: "score_desc", label: "相性スコア順" },
  { value: "next_action_asc", label: "次回対応日の近い順" },
  { value: "unhandled_first", label: "未対応優先" },
];

export function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [local, setLocal] = useState({
    q: searchParams.get("q") || "",
    industry: searchParams.get("industry") || "",
    title: searchParams.get("title") || "",
    minScore: searchParams.get("minScore") || "",
  });

  const status = searchParams.get("status") || "ALL";
  const priority = searchParams.get("priority") || "ALL";
  const sort = searchParams.get("sort") || "created_desc";
  const customerOnly = searchParams.get("customerCandidate") === "true";
  const partnerOnly = searchParams.get("partnerCandidate") === "true";

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "ALL") params.delete(key);
        else params.set(key, value);
      });
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  function applyText() {
    pushParams({
      q: local.q || null,
      industry: local.industry || null,
      title: local.title || null,
      minScore: local.minScore || null,
    });
  }

  function reset() {
    setLocal({ q: "", industry: "", title: "", minScore: "" });
    router.push(pathname);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <Label className="mb-1 block text-xs">ステータス</Label>
          <Select value={status} onValueChange={(v) => pushParams({ status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">すべて</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">優先度</Label>
          <Select value={priority} onValueChange={(v) => pushParams({ priority: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">すべて</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">並び替え</Label>
          <Select value={sort} onValueChange={(v) => pushParams({ sort: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 block text-xs">総合スコア(以上)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={local.minScore}
            onChange={(e) => setLocal((p) => ({ ...p, minScore: e.target.value }))}
            onBlur={applyText}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">業界</Label>
          <Input
            value={local.industry}
            onChange={(e) => setLocal((p) => ({ ...p, industry: e.target.value }))}
            onBlur={applyText}
          />
        </div>
        <div>
          <Label className="mb-1 block text-xs">役職</Label>
          <Input
            value={local.title}
            onChange={(e) => setLocal((p) => ({ ...p, title: e.target.value }))}
            onBlur={applyText}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={customerOnly}
            onChange={(e) => pushParams({ customerCandidate: e.target.checked ? "true" : null })}
          />
          顧客候補のみ
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={partnerOnly}
            onChange={(e) => pushParams({ partnerCandidate: e.target.checked ? "true" : null })}
          />
          協業候補のみ
        </label>
        <Input
          placeholder="氏名・会社名・プロフィールで検索"
          className="max-w-xs"
          value={local.q}
          onChange={(e) => setLocal((p) => ({ ...p, q: e.target.value }))}
          onBlur={applyText}
          onKeyDown={(e) => e.key === "Enter" && applyText()}
        />
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          <X className="h-4 w-4" />
          条件をリセット
        </Button>
      </div>
    </div>
  );
}
