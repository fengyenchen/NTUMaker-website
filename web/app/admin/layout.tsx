import Link from "next/link";
import { BookOpen, CalendarDays, FileText, LayoutDashboard, Megaphone, Settings, Users } from "lucide-react";

const navigation = [
  ["總覽", "/admin", LayoutDashboard],
  ["公告", "/admin/announcements", Megaphone],
  ["社課", "/admin/courses", CalendarDays],
  ["課程內容", "/admin/resources", BookOpen],
  ["社員", "/admin/members", Users],
  ["社群草稿", "/admin/social", FileText],
  ["網站設定", "/admin/settings", Settings],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f7f4ec] text-foreground lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="border-b border-border bg-[#eee8da] p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <Link href="/" className="flex min-h-12 items-center px-3 text-xl font-black">NTUMaker</Link>
      <p className="px-3 pb-4 text-xs text-muted-foreground">管理後台</p>
      <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label="管理後台導覽">{navigation.map(([label,href,Icon],index)=><Link key={href} href={href} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors hover:bg-white/60 ${index===0?"bg-white":""}`}><Icon size={18}/>{label}</Link>)}</nav>
      <div className="mt-8 hidden rounded-xl border border-border bg-white/60 p-3 lg:block"><p className="text-sm font-bold">admin@ntumaker.tw</p><p className="mt-1 text-xs text-muted-foreground">管理員</p></div>
    </aside>
    <div>{children}</div>
  </div>;
}
