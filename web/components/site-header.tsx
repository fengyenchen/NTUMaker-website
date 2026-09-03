import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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
        <Link href="/" className="flex min-h-11 items-center gap-3 font-mono font-bold tracking-tight">
          <span className="grid size-9 -rotate-3 place-items-center bg-primary text-lg text-on-primary">M</span>
          <span>NTUMaker</span>
        </Link>
        <nav aria-label="主要導覽" className="hidden items-center gap-7 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/login" className="inline-flex min-h-11 items-center gap-2 bg-primary px-5 font-bold text-on-primary transition-transform hover:-translate-y-0.5 active:translate-y-0">
          社員登入 <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
