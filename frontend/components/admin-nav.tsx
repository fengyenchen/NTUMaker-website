"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, LayoutDashboard, Megaphone, Settings, Users } from "lucide-react";

const navigation = [
  ["總覽", "/admin", LayoutDashboard],
  ["公告", "/admin/announcements", Megaphone],
  ["社課", "/admin/courses", CalendarDays],
  ["社員", "/admin/members", Users],
  ["社群草稿", "/admin/social", FileText],
  ["網站設定", "/admin/settings", Settings],
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label="管理後台導覽">
      {navigation.map(([label, href, Icon]) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors hover:bg-background ${active ? "bg-background text-accent" : "text-muted-foreground"}`}><Icon size={18} />{label}</Link>;
      })}
    </nav>
  );
}
