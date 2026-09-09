"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";

type HeaderUser = {
  roles: string[];
};

type HeaderLink = readonly [string, string];

export function HeaderAuthAction({ links }: { links: readonly HeaderLink[] }) {
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [menuOpen]);

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
      <div ref={menuRef} className="relative">
        <div className="hidden items-center gap-2 lg:flex">
          {user.roles.includes("admin") ? (
            <Link href="/admin" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 font-bold text-accent transition-colors hover:bg-surface-raised">後台</Link>
          ) : null}
          <Link href="/setting" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 font-bold text-accent transition-colors hover:bg-surface-raised">設定</Link>
          <LogoutButton redirectTo="/" className="justify-center rounded-lg border border-border px-3 transition-colors hover:bg-surface-raised" />
        </div>
        <button type="button" className="grid size-11 place-items-center rounded-lg text-foreground transition-colors hover:bg-surface-raised lg:hidden" aria-label={menuOpen ? "收起社員選單" : "展開社員選單"} aria-expanded={menuOpen} aria-controls="member-mobile-navigation" onClick={() => setMenuOpen((current) => !current)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        {menuOpen ? (
          <div id="member-mobile-navigation" className="absolute right-0 top-18 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-surface/95 p-2 shadow-[4px_5px_0_var(--color-shadow-soft)] backdrop-blur-md lg:hidden">
            <nav aria-label="社員手機導覽" className="grid gap-1">
              {links.map(([label, href]) => {
                const active = href === "/" ? pathname === href : pathname.startsWith(href);
                return <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex min-h-11 items-center px-3 font-bold hover:bg-surface-raised ${active ? "bg-accent/10 text-accent" : "text-muted-foreground"}`}>{label}</Link>;
              })}
              {user.roles.includes("admin") ? <Link href="/admin" onClick={() => setMenuOpen(false)} className={`flex min-h-11 items-center px-3 font-bold hover:bg-surface-raised ${pathname.startsWith("/admin") ? "bg-accent/10 text-accent" : "text-accent"}`}>後台</Link> : null}
              <Link href="/setting" onClick={() => setMenuOpen(false)} className={`flex min-h-11 items-center px-3 font-bold hover:bg-surface-raised ${pathname.startsWith("/setting") ? "bg-accent/10 text-accent" : "text-muted-foreground"}`}>設定</Link>
              <div className="mt-1 border-t border-border pt-1"><LogoutButton redirectTo="/" className="w-full justify-start gap-3 rounded-lg px-3 text-base text-muted-foreground hover:bg-surface-raised" /></div>
            </nav>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`} className="inline-flex min-h-11 items-center gap-2 font-bold">
      社員入口 <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}
