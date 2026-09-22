import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE.name)?.value;
  const authenticated = await verifySessionToken(token).catch(() => false);

  if (authenticated) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// /login, /api/auth/* (ログイン・ログアウトそのもの)、静的アセットは認証チェックの対象外。
// それ以外の全ページ・全APIルート(ダッシュボード・候補者情報を含む)は未ログインでは一切アクセスできない。
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)"],
};
