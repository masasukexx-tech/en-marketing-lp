"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CSV_TEMPLATE_EXAMPLE, parseLeadsCsv } from "@/lib/csv";
import { Download, Upload } from "lucide-react";

export function CsvImport() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ createdCount: number; errors: { row: number; message: string }[] } | null>(
    null,
  );

  const preview = useMemo(() => (csvText.trim() ? parseLeadsCsv(csvText) : null), [csvText]);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_EXAMPLE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setResult(null);
  }

  async function handleImport() {
    if (!csvText.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "インポートに失敗しました");
      setResult({ createdCount: data.createdCount, errors: data.errors });
      if (data.createdCount > 0) {
        router.refresh();
      }
    } catch (err) {
      setResult({
        createdCount: 0,
        errors: [{ row: 0, message: err instanceof Error ? err.message : "インポートに失敗しました" }],
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            CSVテンプレートをダウンロード
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm hover:bg-secondary">
            <Upload className="h-4 w-4" />
            CSVファイルを選択
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
        </div>

        <Textarea
          rows={8}
          placeholder="CSVの内容をここに貼り付けることもできます"
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setResult(null);
          }}
          className="font-mono text-xs"
        />

        {preview && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              取り込み対象: {preview.leads.length}件
              {preview.errors.length > 0 && (
                <span className="ml-2 text-destructive">エラー: {preview.errors.length}件</span>
              )}
            </p>
            {preview.leads.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>氏名</TableHead>
                      <TableHead>会社名</TableHead>
                      <TableHead>役職</TableHead>
                      <TableHead>LinkedIn URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.leads.slice(0, 20).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.companyName}</TableCell>
                        <TableCell>{row.title || "-"}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{row.linkedinUrl}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {preview.errors.length > 0 && (
              <ul className="space-y-1 text-xs text-destructive">
                {preview.errors.map((err, idx) => (
                  <li key={idx}>
                    {err.row > 0 ? `${err.row}行目: ` : ""}
                    {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleImport}
            disabled={submitting || !preview || preview.leads.length === 0}
          >
            {submitting ? "取り込み中..." : "この内容で一括登録する"}
          </Button>
        </div>

        {result && (
          <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
            {result.createdCount}件を登録しました。
            {result.errors.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-destructive">
                {result.errors.map((err, idx) => (
                  <li key={idx}>
                    {err.row > 0 ? `${err.row}行目: ` : ""}
                    {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
