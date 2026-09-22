import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

const BodySchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

// 既知の(無効な)ダミーハッシュ。APP_PASSWORD_HASH未設定時やメール不一致時にも
// bcrypt.compareを必ず実行し、応答時間からメールアドレスの正誤を推測されないようにする。
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8i6Q4Yl0oCsGyKe3D3tG6RXQGZfN7O";

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容が不正です" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const expectedEmail = process.env.APP_LOGIN_EMAIL;
    const passwordHash = process.env.APP_PASSWORD_HASH;

    if (!expectedEmail || !passwordHash) {
      console.error("認証環境変数(APP_LOGIN_EMAIL / APP_PASSWORD_HASH)が未設定です");
      return NextResponse.json({ error: "認証設定が完了していません" }, { status: 503 });
    }

    const emailOk = email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
    // メールが一致しない場合もダミーハッシュに対してbcrypt.compareを実行し、処理時間を揃える。
    const passwordOk = await bcrypt.compare(password, emailOk ? passwordHash : DUMMY_HASH);

    if (!emailOk || !passwordOk) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 },
      );
    }

    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE.maxAgeSeconds,
    });
    return res;
  } catch (error) {
    console.error("ログイン処理でエラーが発生しました", error);
    return NextResponse.json({ error: "ログイン処理でエラーが発生しました" }, { status: 500 });
  }
}
