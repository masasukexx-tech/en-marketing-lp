import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const token = cookies().get(SESSION_COOKIE.name)?.value;
  const authenticated = await verifySessionToken(token).catch(() => false);
  if (authenticated) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-en-orange text-lg font-bold text-black">
            EN
          </span>
          <h1 className="mt-4 text-lg font-bold">LinkedIn営業支援ツール</h1>
          <p className="text-sm text-muted-foreground">株式会社EN 社内専用</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
