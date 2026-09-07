import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircuitBoard,
  ExternalLink,
  Hammer,
  LockKeyhole,
  Play,
} from "lucide-react";
import { BottleCapHero } from "@/components/bottle-cap-hero";
import { HomeMotion } from "@/components/home-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { courseTracks } from "@/data/course-schedule";
import { getSiteSettings } from "@/lib/site-settings";

type Announcement = { id: string; title: string; summary: string; published_at: string | null };

async function getAnnouncements(): Promise<Announcement[]> {
  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/announcements`, { cache: "no-store" });
    if (!response.ok) return [];
    return await response.json() as Announcement[];
  } catch { return []; }
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const announcements = await getAnnouncements();
  const [titleFirstLine, titleSecondLine = ""] = settings.home_title.split("\n");
  const sectionOrder = settings.home_section_order.split(",");
  const sectionPosition = (key: string) => ({ order: Math.max(sectionOrder.indexOf(key), 0) });
  return (
    <HomeMotion>
      <main className="min-h-screen overflow-hidden bg-background">
      <SiteHeader />

      <section className="relative isolate px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid min-h-170 max-w-330 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10" data-hero-copy>
            <div className="mb-7 inline-flex -rotate-2 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm shadow-[2px_3px_0_var(--color-shadow-soft)]">
              {settings.home_badge}
            </div>
            <h1 className="text-[clamp(3.25rem,7vw,6.75rem)] font-black leading-[1.1] tracking-tight">
              {titleFirstLine}
              <span className="block text-highlight">{titleSecondLine}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
              {settings.home_description}
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

          <div className="relative min-h-125 lg:min-h-160" data-hero-model>
            <div className="absolute inset-[8%] rotate-3 rounded-[1.25rem] border border-accent/35 bg-surface shadow-[8px_9px_0_var(--color-accent)]" aria-hidden="true" />
            <div className="absolute inset-[4%] -rotate-2 rounded-[1.25rem] border border-border bg-surface-raised shadow-[4px_5px_0_var(--color-shadow-soft)]">
              <BottleCapHero />
            </div>
            <div className="absolute left-0 top-[12%] -rotate-6 rounded-2xl bg-secondary px-5 py-4 text-on-secondary shadow-[4px_4px_0_var(--color-shadow-soft)]">
              <p className="text-sm font-bold">MAKE IT REAL</p>
            </div>
            <div className="absolute bottom-[8%] right-0 rotate-3 rounded-2xl border border-warm-accent bg-surface px-5 py-4 text-foreground shadow-[3px_3px_0_var(--color-warm-accent)]">
              <p className="text-xs font-bold opacity-70">NEXT CLASS</p>
              <p className="mt-1 font-bold">週二 19:00</p>
              <p className="text-sm">感測器與互動</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col">
      <section style={sectionPosition("weekly_courses")} className="px-5 py-20 md:px-8 md:py-28" data-reveal>
        <div className="mx-auto max-w-330">
          <SectionTitle label="每週社課" title={settings.weekly_courses_title} />
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

      <section style={sectionPosition("next_event")} className="px-5 py-20 md:px-8 md:py-28" data-reveal>
        <div className="mx-auto grid max-w-330 gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="flex min-h-105 flex-col justify-between rounded-2xl border border-border bg-surface-raised p-8 text-foreground shadow-[6px_7px_0_var(--color-shadow-soft)] md:p-10">
            <div>
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/20 text-primary"><CalendarDays /></span>
              <h2 className="mt-8 whitespace-pre-line text-4xl font-black leading-tight md:text-5xl">{settings.next_event_title}</h2>
            </div>
            <Link href="/announcements" className="card-inline-link inline-flex min-h-12 items-center gap-2 font-bold">查看所有公告 <ArrowRight className="card-link-arrow" size={18} /></Link>
          </div>

          <div className="space-y-4">
            {announcements.slice(0, 3).map((item, index) => (
              <Link href="/announcements" key={item.id} className="card-interactive card-inline-link group grid gap-5 rounded-2xl border border-border bg-surface p-6 md:grid-cols-[92px_1fr_auto] md:items-center">
                <div><p className="font-mono text-sm text-primary">{item.published_at ? formatShortDate(item.published_at) : "未設定"}</p><p className="mt-1 text-xs text-muted-foreground">公告</p></div>
                <div><h3 className="text-lg font-bold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.summary}</p></div>
                <span className={`hidden size-11 items-center justify-center rounded-xl bg-surface-raised text-primary md:inline-flex ${index % 2 ? "rotate-3" : "-rotate-3"}`}><ArrowRight className="card-link-arrow" size={18} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={sectionPosition("course_library")} className="px-5 py-20 md:px-8 md:py-28" data-reveal>
        <div className="mx-auto max-w-330">
          <SectionTitle label="課程內容" title={settings.course_library_title} />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <CourseLibraryCard day="星期二" title={courseTracks[0].title} description="沿著循線車專案進度學習，每週課程內含講義、上課影片與實作附件。" items={courseTracks[0].sessions.slice(1, 3).map((session) => session.title)} />
            <CourseLibraryCard day="星期五" title={courseTracks[1].title} description="依主題選擇工作坊，每場的教材、示範影片與範例檔案集中整理。" items={courseTracks[1].sessions.slice(0, 2).map((session) => session.title)} blue />
          </div>
        </div>
      </section>

      <section style={sectionPosition("share")} className="px-5 pb-24 pt-12 md:px-8 md:pb-32" data-reveal>
        <div className="mx-auto flex max-w-330 flex-col gap-8 overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-[6px_7px_0_var(--color-shadow-soft)] md:flex-row md:items-end md:justify-between md:p-12">
          <div><p className="mb-3 text-sm font-bold text-primary">BUILD · LEARN · SHARE</p><h2 className="max-w-3xl text-4xl text-foreground font-black leading-tight md:text-6xl">{settings.share_title}</h2></div>
          <div className="flex shrink-0 flex-wrap gap-4">
            <a href="https://www.instagram.com/ntu_maker/" target="_blank" rel="noreferrer" className="button-25d inline-flex min-h-12 items-center gap-3 rounded-xl px-6 font-bold">Instagram <ExternalLink size={18} aria-hidden="true" /></a>
            <a href="https://www.facebook.com/ntumaker2018" target="_blank" rel="noreferrer" className="button-25d inline-flex min-h-12 items-center gap-3 rounded-xl px-6 font-bold">Facebook <ExternalLink size={18} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      </div>
      <SiteFooter />
      </main>
    </HomeMotion>
  );
}

function formatShortDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit" }).format(new Date(value)).replace("/", " / "); }

function SectionTitle({ label, title }: { label: string; title: string }) {
  return <div className="max-w-205"><p className="mb-3 text-sm font-bold text-primary">{label}</p><h2 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">{title}</h2></div>;
}

function TrackCard({ day, kicker, description, icon, color, topics }: { day: string; kicker: string; description: string; icon: React.ReactNode; color: "lime" | "blue"; topics: string[] }) {
  const lime = color === "lime";
  return (
    <article className="card-interactive rounded-2xl border border-border bg-surface p-7 shadow-[6px_7px_0_var(--color-shadow-soft)] md:p-10">
      <div className="flex items-start justify-between"><span className={`inline-flex size-14 items-center justify-center rounded-2xl ${lime ? "border border-primary/40 bg-primary/10 text-primary" : "border border-accent/40 bg-accent/10 text-accent"}`}>{icon}</span><span className="rounded-full border border-border px-4 py-2 text-sm font-bold">{day}</span></div>
      <h3 className="mt-9 text-3xl font-black md:text-4xl">{kicker}</h3>
      <p className="mt-5 leading-7 text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap gap-2">{topics.map((topic) => <span key={topic} className="rounded-full bg-surface-raised px-4 py-2 text-sm">{topic}</span>)}</div>
      <Link href="/courses" className="card-inline-link mt-8 inline-flex min-h-11 items-center gap-2 font-bold text-primary">查看課程 <ArrowRight className="card-link-arrow" size={18} /></Link>
    </article>
  );
}

function CourseLibraryCard({ day, title, description, items, blue = false }: { day: string; title: string; description: string; items: string[]; blue?: boolean }) {
  return (
    <article className={`card-interactive rounded-2xl border bg-surface p-7 shadow-[5px_6px_0_var(--color-shadow-soft)] ${blue ? "border-accent/45" : "border-border"}`}>
      <div className="flex items-center justify-between gap-4"><span className="rounded-full bg-surface-raised px-4 py-2 text-sm font-bold">{day}</span><LockKeyhole size={18} aria-label="部分內容限社員" /></div>
      <h3 className="mt-7 text-3xl font-black leading-tight">{title}</h3>
      <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
      <div className="mt-6 space-y-2">{items.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-background p-4"><Play className="text-accent" size={17} aria-hidden="true" /><span className="font-bold">{item}</span></div>)}</div>
      <Link href="/resources" className="card-inline-link mt-7 inline-flex min-h-11 items-center gap-2 font-bold text-accent">查看這條課程的內容 <ArrowRight className="card-link-arrow" size={17} /></Link>
    </article>
  );
}
