import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircuitBoard,
  ExternalLink,
  Hammer,
  LockKeyhole,
  Play,
  Shapes,
  Sparkles,
} from "lucide-react";
import { BottleCapHero } from "@/components/bottle-cap-hero";
import { SiteHeader } from "@/components/site-header";
import { courseTracks } from "@/data/course-schedule";

const announcements = [
  { date: "09 / 08", type: "社課", title: "本學期第一次社課與社員說明會", detail: "一起認識課程雙軌與這學期的專案。" },
  { date: "09 / 12", type: "工作坊", title: "雷射切割入門工作坊", detail: "從向量圖檔到完成第一件切割作品。" },
  { date: "09 / 19", type: "公告", title: "社員招募與空間使用須知", detail: "加入方式、社員期限與工具借用規則。" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <SiteHeader />

      <section className="relative isolate px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid min-h-[680px] max-w-[1320px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10">
            <div className="mb-7 inline-flex rotate-[-2deg] items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm shadow-[4px_5px_0_rgba(242,106,46,0.28)]">
              <Sparkles size={16} className="text-primary" aria-hidden="true" />
              2026 秋季社課進行中
            </div>
            <h1 className="text-[clamp(3.7rem,8vw,7.8rem)] font-black leading-[0.9] tracking-[-0.075em]">
              把想法
              <span className="block text-highlight">做成真的。</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
              從電子、程式、設計到數位製造，和一群喜歡動手的人一起試、一起拆，再做出更好的版本。
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/courses" className="button-25d inline-flex min-h-12 items-center gap-3 rounded-xl px-6 font-bold">
                看本學期社課 <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/about" className="button-25d inline-flex min-h-12 items-center rounded-xl px-6 font-bold">
                認識我們
              </Link>
            </div>
          </div>

          <div className="relative min-h-[500px] lg:min-h-[640px]">
            <div className="absolute inset-[8%] rotate-3 rounded-[2.5rem] border border-foreground/10 bg-surface shadow-[18px_20px_0_rgba(36,87,214,0.82)]" aria-hidden="true" />
            <div className="absolute inset-[4%] -rotate-2 rounded-[2.5rem] border-2 border-primary/30 bg-surface-raised shadow-[10px_12px_0_rgba(23,38,63,0.18)]">
              <BottleCapHero />
            </div>
            <div className="absolute left-0 top-[12%] -rotate-6 rounded-2xl bg-secondary px-5 py-4 text-on-secondary shadow-[7px_8px_0_rgba(0,0,0,0.45)]">
              <Shapes size={24} aria-hidden="true" />
              <p className="mt-2 text-sm font-bold">從零件開始</p>
            </div>
            <div className="absolute bottom-[8%] right-0 rotate-3 rounded-2xl bg-warning px-5 py-4 text-on-primary shadow-[7px_8px_0_rgba(0,0,0,0.45)]">
              <p className="text-xs font-bold opacity-70">NEXT CLASS</p>
              <p className="mt-1 font-bold">週二 19:00</p>
              <p className="text-sm">感測器與互動</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1320px]">
          <SectionTitle label="每週社課" title="兩條路線，自由找到你的節奏。" />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <TrackCard
              day="星期二"
              kicker="基礎連貫專案"
              description="用一學期完成一個作品。每週接續前一堂的進度，練習電子、程式、機構與團隊協作。"
              icon={<CircuitBoard aria-hidden="true" />}
              color="lime"
              topics={["基礎電子", "微控制器", "機構製作", "整合展示"]}
            />
            <TrackCard
              day="星期五"
              kicker="進階模組工作坊"
              description="每次拆解一項進階技能。主題彼此獨立，可以依自己的專案需求與興趣選擇參加。"
              icon={<Hammer aria-hidden="true" />}
              color="blue"
              topics={["嵌入式系統", "數位製造", "互動設計", "AI 工具"]}
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="flex min-h-[420px] flex-col justify-between rounded-[2rem] border border-primary/40 bg-primary/15 p-8 text-foreground shadow-[12px_14px_0_rgba(36,87,214,0.78)] md:p-10">
            <div>
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/20 text-primary"><CalendarDays /></span>
              <h2 className="mt-8 text-4xl font-black leading-tight md:text-5xl">下一次，<br />一起做什麼？</h2>
            </div>
            <Link href="/announcements" className="inline-flex min-h-12 items-center gap-2 font-bold">查看所有公告 <ArrowRight size={18} /></Link>
          </div>

          <div className="space-y-4">
            {announcements.map((item, index) => (
              <Link href="/announcements" key={item.title} className="group grid gap-5 rounded-2xl border border-border bg-surface p-6 transition-transform hover:-translate-y-1 md:grid-cols-[92px_1fr_auto] md:items-center">
                <div><p className="font-mono text-sm text-primary">{item.date}</p><p className="mt-1 text-xs text-muted-foreground">{item.type}</p></div>
                <div><h3 className="text-lg font-bold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.detail}</p></div>
                <span className={`hidden size-11 items-center justify-center rounded-xl bg-surface-raised text-primary md:inline-flex ${index % 2 ? "rotate-3" : "-rotate-3"}`}><ArrowRight size={18} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1320px]">
          <SectionTitle label="課程內容" title="每堂課的教材、影片與檔案，都收在一起。" />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <CourseLibraryCard day="星期二" title={courseTracks[0].title} description="沿著循線車專案進度學習，每週課程內含講義、上課影片與實作附件。" items={courseTracks[0].sessions.slice(1, 3).map((session) => session.title)} />
            <CourseLibraryCard day="星期五" title={courseTracks[1].title} description="依主題選擇工作坊，每場的教材、示範影片與範例檔案集中整理。" items={courseTracks[1].sessions.slice(0, 2).map((session) => session.title)} blue />
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 pt-12 md:px-8 md:pb-32">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-8 overflow-hidden rounded-[2rem] bg-surface-raised p-8 text-on-secondary shadow-[12px_14px_0_rgba(242,106,46,0.28)] md:flex-row md:items-end md:justify-between md:p-12">
          <div><p className="mb-3 text-sm font-bold text-primary">BUILD · LEARN · SHARE</p><h2 className="max-w-3xl text-4xl text-secondary font-black leading-tight md:text-6xl">做出作品，也把方法分享出去。</h2></div>
          <a href="https://www.instagram.com/ntu_maker/" target="_blank" rel="noreferrer" className="button-25d inline-flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-6 font-bold">追蹤 Instagram <ExternalLink size={18} /></a>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p><strong className="text-foreground">NTUMaker</strong> · 國立臺灣大學自造者社</p>
          <p>Build. Learn. Share.</p>
        </div>
      </footer>
    </main>
  );
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return <div className="max-w-3xl"><p className="mb-3 text-sm font-bold text-primary">{label}</p><h2 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">{title}</h2></div>;
}

function TrackCard({ day, kicker, description, icon, color, topics }: { day: string; kicker: string; description: string; icon: React.ReactNode; color: "lime" | "blue"; topics: string[] }) {
  const lime = color === "lime";
  return (
    <article className={`rounded-[2rem] border border-border bg-surface p-7 md:p-10 ${lime ? "shadow-[11px_13px_0_rgba(242,106,46,0.25)]" : "shadow-[11px_13px_0_rgba(36,87,214,0.78)]"}`}>
      <div className="flex items-start justify-between"><span className={`inline-flex size-14 items-center justify-center rounded-2xl ${lime ? "border border-primary/40 bg-primary/15 text-primary" : "bg-secondary text-on-secondary"}`}>{icon}</span><span className="rounded-full border border-border px-4 py-2 text-sm font-bold">{day}</span></div>
      <h3 className="mt-9 text-3xl font-black md:text-4xl">{kicker}</h3>
      <p className="mt-5 leading-7 text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap gap-2">{topics.map((topic) => <span key={topic} className="rounded-full bg-surface-raised px-4 py-2 text-sm">{topic}</span>)}</div>
      <Link href="/courses" className="mt-8 inline-flex min-h-11 items-center gap-2 font-bold text-primary">查看課程 <ArrowRight size={18} /></Link>
    </article>
  );
}

function CourseLibraryCard({ day, title, description, items, blue = false }: { day: string; title: string; description: string; items: string[]; blue?: boolean }) {
  return (
    <article className={`rounded-[1.75rem] border border-border bg-surface p-7 ${blue ? "shadow-[10px_12px_0_rgba(36,87,214,0.76)]" : "shadow-[10px_12px_0_rgba(242,106,46,0.24)]"}`}>
      <div className="flex items-center justify-between gap-4"><span className="rounded-full bg-surface-raised px-4 py-2 text-sm font-bold">{day}</span><LockKeyhole size={18} aria-label="部分內容限社員" /></div>
      <h3 className="mt-7 text-3xl font-black leading-tight">{title}</h3>
      <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
      <div className="mt-6 space-y-2">{items.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-background p-4"><Play className="text-secondary" size={17} aria-hidden="true" /><span className="font-bold">{item}</span></div>)}</div>
      <Link href="/resources" className="mt-7 inline-flex min-h-11 items-center gap-2 font-bold text-secondary">查看這條課程的內容 <ArrowRight size={17} /></Link>
    </article>
  );
}
