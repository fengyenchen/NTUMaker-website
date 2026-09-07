"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";

export function HeaderAuthAction() {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/v1/auth/me", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => setAuthenticated(response.ok))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAuthenticated(false);
      });

    return () => controller.abort();
  }, []);

  if (authenticated === null) {
    return <span aria-label="正在確認登入狀態" className="inline-flex min-h-11 min-w-26 items-center justify-end text-sm text-muted-foreground opacity-60">確認中…</span>;
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/setting"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 font-bold text-accent transition-colors hover:bg-surface-raised"
        >
          設定
        </Link>
        <LogoutButton
          redirectTo="/"
          className="justify-center rounded-lg border border-border px-3 transition-colors hover:bg-surface-raised"
        />
      </div>
    );
  }

  return (
    <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`} className="inline-flex min-h-11 items-center gap-2 font-bold">
      社員入口 <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}
