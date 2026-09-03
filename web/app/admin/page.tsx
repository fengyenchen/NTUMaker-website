import { ArrowUpRight, BookOpen, CalendarDays, Plus, Users } from "lucide-react";

const stats = [
  { label: "有效社員", value: "48", icon: Users, note: "7 人將在 30 天內到期" },
  { label: "本學期社課", value: "12", icon: CalendarDays, note: "下一堂：週二 19:00" },
  { label: "已發布教材", value: "26", icon: BookOpen, note: "其中 18 篇社員限定" },
];

export default function AdminPage() {
  return <main className="px-5 py-8 md:px-10 md:py-10"><div className="mx-auto max-w-[1280px]">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm text-muted-foreground">2026 年 9 月 4 日</p><h1 className="mt-1 text-3xl font-black">早安，管理員</h1></div><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-4 font-bold text-white"><Plus size={18}/>新增內容</button></div>
    <section className="mt-9 grid gap-4 md:grid-cols-3">{stats.map((stat)=>{const Icon=stat.icon;return <article key={stat.label} className="rounded-xl border border-border bg-white p-5"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{stat.label}</p><Icon size={19} className="text-secondary"/></div><p className="mt-5 text-4xl font-black">{stat.value}</p><p className="mt-3 text-xs text-muted-foreground">{stat.note}</p></article>;})}</section>
    <section className="mt-8 rounded-xl border border-border bg-white"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="text-lg font-black">最近內容</h2><p className="mt-1 text-sm text-muted-foreground">管理公告、課程與教材的發布狀態。</p></div><button className="min-h-11 text-sm font-bold text-secondary">查看全部</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#faf8f2] text-muted-foreground"><tr><th className="px-5 py-3 font-medium">標題</th><th className="px-5 py-3 font-medium">類型</th><th className="px-5 py-3 font-medium">權限</th><th className="px-5 py-3 font-medium">狀態</th><th className="px-5 py-3 font-medium">更新時間</th><th aria-label="操作" /></tr></thead><tbody>{[
        ["感測器與互動輸入","社課","社員","已發布","今天 01:42"],["雷射切割入門工作坊","公告","公開","草稿","昨天 23:18"],["ESP32 感測資料上雲","影片","社員","已發布","09/02 20:04"]
      ].map((row)=><tr key={row[0]} className="border-t border-border"><td className="px-5 py-4 font-bold">{row[0]}</td><td className="px-5 py-4">{row[1]}</td><td className="px-5 py-4">{row[2]}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${row[3]==="草稿"?"bg-warning/40":"bg-success/15 text-success"}`}>{row[3]}</span></td><td className="px-5 py-4 text-muted-foreground">{row[4]}</td><td className="px-5 py-4"><button aria-label={`編輯 ${row[0]}`}><ArrowUpRight size={17}/></button></td></tr>)}</tbody></table></div>
    </section>
  </div></main>;
}
