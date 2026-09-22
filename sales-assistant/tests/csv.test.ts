import { describe, expect, it } from "vitest";
import { parseCsv, parseLeadsCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses simple comma separated rows", () => {
    const rows = parseCsv("a,b,c\n1,2,3");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields containing commas and newlines", () => {
    const csv = 'name,note\n"山田 太郎","改行あり\nカンマ,あり"';
    const rows = parseCsv(csv);
    expect(rows).toEqual([
      ["name", "note"],
      ["山田 太郎", "改行あり\nカンマ,あり"],
    ]);
  });

  it("handles escaped double quotes", () => {
    const csv = 'name\n"田中""次郎"""';
    const rows = parseCsv(csv);
    expect(rows[1][0]).toBe('田中"次郎"');
  });

  it("strips a leading BOM", () => {
    const rows = parseCsv("﻿a,b\n1,2");
    expect(rows[0]).toEqual(["a", "b"]);
  });

  it("handles CRLF line endings", () => {
    const rows = parseCsv("a,b\r\n1,2\r\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseLeadsCsv", () => {
  const header = "LinkedInプロフィールURL,氏名,会社名,役職,業界,所在地,プロフィール本文,職歴,最近の投稿内容,メモ,登録経路";

  it("parses valid rows into CsvLeadRow objects", () => {
    const csv = `${header}\nhttps://www.linkedin.com/in/taro,山田太郎,株式会社サンプル,代表取締役,IT,東京都,自己紹介文,職歴,投稿,メモ,紹介`;
    const { leads, errors } = parseLeadsCsv(csv);
    expect(errors).toHaveLength(0);
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      linkedinUrl: "https://www.linkedin.com/in/taro",
      name: "山田太郎",
      companyName: "株式会社サンプル",
      title: "代表取締役",
    });
  });

  it("reports missing required columns in a row", () => {
    const csv = `${header}\n,山田太郎,,代表取締役,IT,東京都,,,,,紹介`;
    const { leads, errors } = parseLeadsCsv(csv);
    expect(leads).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(2);
  });

  it("reports an error when required headers are missing", () => {
    const csv = "会社名,役職\n株式会社サンプル,代表取締役";
    const { leads, errors } = parseLeadsCsv(csv);
    expect(leads).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns an error for empty input", () => {
    const { errors } = parseLeadsCsv("");
    expect(errors).toHaveLength(1);
  });

  it("accepts English header aliases", () => {
    const csv = "url,name,company\nhttps://www.linkedin.com/in/x,Taro Yamada,Sample Inc.";
    const { leads, errors } = parseLeadsCsv(csv);
    expect(errors).toHaveLength(0);
    expect(leads[0].companyName).toBe("Sample Inc.");
  });
});
