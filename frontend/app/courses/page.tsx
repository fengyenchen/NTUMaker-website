import { CalendarDays, Check, MapPin, WalletCards } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { courseInfo, type CourseTrack } from "@/data/course-schedule";
import { getCourseTracks } from "@/lib/course-api";
import { getSiteSettings } from "@/lib/site-settings";

export default async function CoursesPage() {
  const courseTracks = await getCourseTracks();
  const settings = await getSiteSettings();
  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={`${courseInfo.semester} / 社課`} title={settings.courses_title} description={settings.courses_description} />
      <section className="px-5 pb-12 md:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-4 md:grid-cols-3">
          <InfoCard icon={<CalendarDays />} label="時間" value={settings.courses_time_value} />
          <InfoCard icon={<MapPin />} label="地點" value={settings.courses_location_value} />
          <InfoCard icon={<WalletCards />} label="社費" value={settings.courses_fee_value} />
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
  return (
    <article className="rounded-2xl border border-border bg-surface p-7 shadow-[6px_7px_0_var(--color-shadow-soft)] md:p-10">
      <div className="flex justify-end"><span className="rounded-full bg-surface-raised px-4 py-2 text-sm font-bold">{track.day} {track.time}</span></div>
      <h2 className="mt-8 text-3xl font-black">{track.title}</h2>
      <p className="mt-3 leading-7 text-muted-foreground">{track.description}</p>
      <ol className="mt-8 space-y-3">
        {track.sessions.map((session, index) => (
          <li key={session.title} className="grid min-h-28 grid-cols-[6.25rem_minmax(0,1fr)_1.25rem] items-start gap-x-4 gap-y-2 rounded-xl bg-background p-4">
            <span className="grid min-h-9 w-full place-items-center self-start rounded-lg border border-accent/40 bg-accent/10 px-2 text-xs font-bold text-accent">{session.week}</span>
            <span className="self-center font-bold">{session.title}</span>
            {session.startsAt && isSessionEnded(session.startsAt) ? <Check className="self-center text-success" size={18} aria-label="已結束" /> : <span aria-hidden="true" />}
            <p className="col-start-2 col-end-4 text-sm leading-6 text-muted-foreground">{session.summary}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}

function isSessionEnded(startsAt: string) {
  const endOfDate = new Date(startsAt);
  endOfDate.setHours(23, 59, 59, 999);
  return endOfDate.getTime() <= Date.now();
}
