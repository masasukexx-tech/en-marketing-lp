// 依存パッケージなしで動くシンプルなCSVパーサー（RFC4180準拠: カンマ/改行を含むダブルクォート値、""エスケープに対応）

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // BOM除去
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // \r\n は次のループの \n 側で行確定するのでスキップ
      if (next !== "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // 末尾の空行を除去
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

// CSVヘッダー(日本語/英語どちらでも)から内部フィールド名へのマッピング
const HEADER_ALIASES: Record<string, string> = {
  "linkedinプロフィールurl": "linkedinUrl",
  "linkedin url": "linkedinUrl",
  "linkedinurl": "linkedinUrl",
  "url": "linkedinUrl",
  "氏名": "name",
  "name": "name",
  "会社名": "companyName",
  "company": "companyName",
  "companyname": "companyName",
  "役職": "title",
  "title": "title",
  "position": "title",
  "業界": "industry",
  "industry": "industry",
  "所在地": "location",
  "location": "location",
  "プロフィール本文": "profileText",
  "profile": "profileText",
  "profiletext": "profileText",
  "職歴": "workHistory",
  "workhistory": "workHistory",
  "最近の投稿内容": "recentPosts",
  "recentposts": "recentPosts",
  "メモ": "notes",
  "notes": "notes",
  "memo": "notes",
  "登録経路": "source",
  "source": "source",
};

export interface CsvLeadRow {
  linkedinUrl: string;
  name: string;
  companyName: string;
  title?: string;
  industry?: string;
  location?: string;
  profileText?: string;
  workHistory?: string;
  recentPosts?: string;
  notes?: string;
  source?: string;
}

export interface CsvParseResult {
  leads: CsvLeadRow[];
  errors: { row: number; message: string }[];
}

export function parseLeadsCsv(text: string): CsvParseResult {
  const rows = parseCsv(text);
  const errors: CsvParseResult["errors"] = [];
  const leads: CsvLeadRow[] = [];

  if (rows.length === 0) {
    return { leads, errors: [{ row: 0, message: "CSVが空です" }] };
  }

  const headerRow = rows[0].map((h) => h.trim());
  const fieldKeys = headerRow.map((h) => HEADER_ALIASES[h.toLowerCase()] ?? null);

  if (!fieldKeys.includes("linkedinUrl") || !fieldKeys.includes("name") || !fieldKeys.includes("companyName")) {
    errors.push({
      row: 1,
      message:
        "必須列（LinkedInプロフィールURL / 氏名 / 会社名）がヘッダーに見つかりません",
    });
    return { leads, errors };
  }

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    if (cols.length === 1 && cols[0].trim() === "") continue;

    const obj: Record<string, string> = {};
    fieldKeys.forEach((key, idx) => {
      if (key) obj[key] = (cols[idx] ?? "").trim();
    });

    if (!obj.linkedinUrl || !obj.name || !obj.companyName) {
      errors.push({
        row: r + 1,
        message: "LinkedInプロフィールURL・氏名・会社名は必須です",
      });
      continue;
    }

    leads.push({
      linkedinUrl: obj.linkedinUrl,
      name: obj.name,
      companyName: obj.companyName,
      title: obj.title || undefined,
      industry: obj.industry || undefined,
      location: obj.location || undefined,
      profileText: obj.profileText || undefined,
      workHistory: obj.workHistory || undefined,
      recentPosts: obj.recentPosts || undefined,
      notes: obj.notes || undefined,
      source: obj.source || "CSV一括登録",
    });
  }

  return { leads, errors };
}

export const CSV_TEMPLATE_HEADER =
  "LinkedInプロフィールURL,氏名,会社名,役職,業界,所在地,プロフィール本文,職歴,最近の投稿内容,メモ,登録経路";

export const CSV_TEMPLATE_EXAMPLE = `${CSV_TEMPLATE_HEADER}
https://www.linkedin.com/in/example-taro,山田 太郎,株式会社サンプル,代表取締役,IT・Web,東京都,"新規事業とSNS集客に力を入れています。",前職はWeb広告代理店で営業責任者,"先日、採用ブランディングについて投稿していました",紹介経由で接点あり,紹介`;
