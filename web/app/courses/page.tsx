import { CalendarDays, Check, MapPin, WalletCards, Wrench } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { courseInfo, courseTracks, type CourseTrack } from "@/data/course-schedule";

export default function CoursesPage() {
  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={`${courseInfo.semester} / 社課`} title="週二完成一台車，週五帶走一項新技能。" description="星期二以 Arduino 循線車為連貫專案；星期五安排四場獨立主題工作坊。以下先使用社博課程表作為假資料，之後會改由資料庫載入。" />
      <section className="px-5 pb-12 md:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-4 md:grid-cols-3">
          <InfoCard icon={<CalendarDays />} label="時間" value={`週二、週五 ${courseInfo.time}`} />
          <InfoCard icon={<MapPin />} label="地點" value={courseInfo.location} />
          <InfoCard icon={<WalletCards />} label="社費" value={courseInfo.fee} />
        </div>
      </section>
      <section className="px-5 pb-28 pt-8 md:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-2">
          {courseTracks.map((track) => <CourseTimeline key={track.id} track={track} />)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">{icon}</span><div><p className="text-xs font-bold text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div></div>;
}

function CourseTimeline({ track }: { track: CourseTrack }) {
  const orange = track.id === "tuesday";
  const Icon = orange ? CalendarDays : Wrench;
  return (
    <article className={`rounded-[2rem] border border-border bg-surface p-7 md:p-10 ${orange ? "shadow-[11px_13px_0_rgba(242,106,46,0.24)]" : "shadow-[11px_13px_0_rgba(36,87,214,0.76)]"}`}>
      <div className="flex items-start justify-between gap-4"><span className={`inline-flex size-14 items-center justify-center rounded-2xl ${orange ? "border border-primary/40 bg-primary/15 text-primary" : "bg-secondary text-on-secondary"}`}><Icon /></span><span className="rounded-full bg-surface-raised px-4 py-2 text-sm font-bold">{track.day} {track.time}</span></div>
      <h2 className="mt-8 text-3xl font-black">{track.title}</h2>
      <p className="mt-3 leading-7 text-muted-foreground">{track.description}</p>
      <ol className="mt-8 space-y-3">
        {track.sessions.map((session, index) => (
          <li key={session.title} className="rounded-xl bg-background p-4">
            <div className="flex items-center gap-4"><span className={`grid min-h-8 min-w-16 shrink-0 place-items-center rounded-lg px-2 text-xs font-bold ${orange ? "border border-primary/40 bg-primary/15 text-primary" : "bg-secondary text-on-secondary"}`}>{session.week}</span><span className="font-bold">{session.title}</span>{index < 2 && <Check className="ml-auto shrink-0 text-success" size={18} aria-label="已規劃" />}</div>
            <p className="ml-20 mt-2 text-sm leading-6 text-muted-foreground">{session.summary}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
