"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderAuthAction } from "@/components/header-auth-action";

const links = [
  ["首頁", "/"],
  ["公告", "/announcements"],
  ["社課", "/courses"],
  ["資源", "/resources"],
  ["關於", "/about"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-360 items-center justify-between px-5 md:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center text-xl font-black tracking-[-0.04em]"
        >
          NTUMaker
        </Link>
        <nav
          aria-label="主要導覽"
          className="hidden items-center gap-7 lg:flex"
        >
          {links.map(([label, href]) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 items-center text-sm transition-colors hover:text-foreground ${active ? "font-bold text-accent" : "text-muted-foreground"}`}
            >
              {label}
            </Link>
            );
          })}
        </nav>
        <HeaderAuthAction links={links} />
      </div>
    </header>
  );
}
