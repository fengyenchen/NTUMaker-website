"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";

type HeaderUser = {
  roles: string[];
};

export function HeaderAuthAction() {
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/v1/auth/me", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          setUser(null);
          return;
        }
        setUser((await response.json()) as HeaderUser);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setUser(null);
      });

    return () => controller.abort();
  }, []);

  if (user === undefined) {
    return <span aria-label="正在確認登入狀態" className="inline-flex min-h-11 min-w-26 items-center justify-end text-sm text-muted-foreground opacity-60">確認中…</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.roles.includes("admin") ? (
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 font-bold text-accent transition-colors hover:bg-surface-raised"
          >
            後台
          </Link>
        ) : null}
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
