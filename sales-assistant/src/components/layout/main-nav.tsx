"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ListChecks, LogOut, UserPlus } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/leads", label: "候補者一覧", icon: ListChecks },
  { href: "/leads/new", label: "候補者登録", icon: UserPlus },
];

export function MainNav() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex max-w-7xl items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-en-orange text-sm font-bold text-black">
            EN
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">LinkedIn営業支援</div>
            <div className="text-[11px] text-muted-foreground">株式会社EN</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-en-orange text-black"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </Button>
        </nav>
      </div>
    </header>
  );
}
