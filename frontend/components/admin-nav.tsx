"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, LayoutDashboard, Menu, Megaphone, Settings, Users, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  ["總覽", "/admin", LayoutDashboard],
  ["公告", "/admin/announcements", Megaphone],
  ["社課", "/admin/courses", CalendarDays],
  ["社員", "/admin/members", Users],
  ["社群發布", "/admin/social", FileText],
  ["網站設定", "/admin/settings", Settings],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="absolute right-4 top-4 grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-background lg:hidden" aria-label={open ? "收起管理選單" : "展開管理選單"} aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen((current) => !current)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav id="admin-navigation" className={`${open ? "grid" : "hidden"} mt-2 grid-cols-2 gap-1 sm:grid-cols-4 lg:mt-0 lg:grid lg:grid-cols-1`} aria-label="管理後台導覽">
      {navigation.map(([label, href, Icon]) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors hover:bg-background ${active ? "bg-background text-accent" : "text-muted-foreground"}`}><Icon size={18} />{label}</Link>;
      })}
      </nav>
    </>
  );
}
