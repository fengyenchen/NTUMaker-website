import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, LockKeyhole, Play, Wrench } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCourseTracks } from "@/lib/course-api";

export default async function ResourcesPage() {
  const courseTracks = await getCourseTracks();
  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow="COURSE LIBRARY / 課程內容" title="從一堂課出發，教材和影片都在一起。" description="先選星期二的循線車專案或星期五的主題工作坊，再進入單堂課查看講義、上課影片與附件。標示公開的內容不需登入，其餘內容限有效社員使用。" />
      <section className="px-5 pb-28 md:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-2">
          {courseTracks.map((track) => {
            const orange = track.id === "tuesday";
            const Icon = orange ? CalendarDays : Wrench;
            return (
              <article key={track.id} className={`rounded-2xl border border-border bg-surface p-6 md:p-9 ${orange ? "shadow-[11px_13px_0_rgba(242,106,46,0.24)]" : "shadow-[11px_13px_0_rgba(36,87,214,0.76)]"}`}>
                <div className="flex items-start justify-between gap-4"><span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${orange ? "border border-primary/40 bg-primary/15 text-primary" : "bg-secondary text-on-secondary"}`}><Icon aria-hidden="true" /></span><span className="rounded-full bg-surface-raised px-4 py-2 text-sm font-bold">{track.day} {track.time}</span></div>
                <h2 className="mt-7 text-3xl font-black">{track.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{track.description}</p>
                <div className="mt-8 space-y-4">
                  {track.sessions.map((session) => (
                    <Link href={session.isPublic ? "#" : "/login"} key={session.title} className="group block rounded-2xl border border-border bg-background p-5 transition-transform hover:-translate-y-1">
                      <div className="flex items-start gap-4">
                        <span className="min-w-16 font-mono text-xs font-bold text-secondary">{session.week}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{session.title}</h3>{session.isPublic ? <span className="shrink-0 text-xs text-success">公開</span> : <LockKeyhole className="shrink-0" size={17} aria-label="社員限定" />}</div>
                          <div className="mt-3 flex flex-wrap gap-2">{session.assets.map((asset) => <span key={asset} className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-3 py-1 text-xs"><AssetIcon label={asset} />{asset}</span>)}</div>
                        </div>
                        <ArrowRight className="mt-8 shrink-0 transition-transform group-hover:translate-x-1" size={18} aria-hidden="true" />
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function AssetIcon({ label }: { label: string }) {
  return label.includes("影片") ? <Play size={12} aria-hidden="true" /> : <BookOpen size={12} aria-hidden="true" />;
}
