import fs from "node:fs";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    case "mkv":
      return "video/x-matroska";
    default:
      return "application/octet-stream";
  }
}

/**
 * 元動画を HTTP Range 対応でストリーミング配信する。
 * storage/ 配下は Next.js の静的配信対象外のため、確認画面(design doc §5-14)の
 * <video> プレビュー再生・シークにはこのルートを使う。
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const videoAsset = await prisma.videoAsset.findUnique({ where: { id: params.id } });
  if (!videoAsset) {
    return NextResponse.json({ error: "video asset not found" }, { status: 404 });
  }

  const stat = await fs.promises.stat(videoAsset.storagePath);
  const fileSize = stat.size;
  const contentType = contentTypeFor(videoAsset.filename);
  const range = request.headers.get("range");

  if (!range) {
    const nodeStream = fs.createReadStream(videoAsset.storagePath);
    return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Accept-Ranges": "bytes",
      },
    });
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const rangeStart = match?.[1] ? Number(match[1]) : 0;
  const rangeEnd = match?.[2] ? Number(match[2]) : fileSize - 1;
  const start = Math.max(0, rangeStart);
  const end = Math.min(fileSize - 1, rangeEnd);
  const chunkSize = end - start + 1;

  const nodeStream = fs.createReadStream(videoAsset.storagePath, { start, end });
  return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": String(chunkSize),
      "Accept-Ranges": "bytes",
    },
  });
}
