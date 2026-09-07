import Link from "next/link";

import { HeaderAuthAction } from "@/components/header-auth-action";

const links = [
  ["公告", "/announcements"],
  ["社課", "/courses"],
  ["資源", "/resources"],
  ["作品", "/projects"],
  ["關於", "/about"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 md:px-8">
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
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <HeaderAuthAction />
      </div>
    </header>
  );
}
