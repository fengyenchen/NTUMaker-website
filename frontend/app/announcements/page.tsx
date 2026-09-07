import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/site-settings";

type Announcement = { id: string; slug: string; title: string; summary: string; published_at: string | null };

async function getAnnouncements(): Promise<Announcement[]> {
  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/announcements`, { cache: "no-store" });
    if (!response.ok) return [];
    return await response.json() as Announcement[];
  } catch { return []; }
}

export default async function AnnouncementsPage() {
  const settings = await getSiteSettings();
  const posts = await getAnnouncements();
  return <main><SiteHeader /><PageHero eyebrow="ANNOUNCEMENTS / 公告" title={settings.announcements_title} description={settings.announcements_description} />
    <section className="px-5 pb-24 md:px-8"><div className="mx-auto max-w-[1320px] space-y-5">{posts.map((post, index) => (
      <a href={`/announcements/${post.slug}`} key={post.id} className={`card-interactive grid gap-6 rounded-2xl border border-border bg-surface p-7 md:grid-cols-[150px_1fr_auto] md:items-center md:p-9 ${index === 0 ? "shadow-[4px_5px_0_var(--color-shadow-soft)]" : ""}`}>
        <div><p className="font-mono text-sm text-primary">{post.published_at ? formatDate(post.published_at) : "未設定日期"}</p><span className="mt-3 inline-block rounded-full bg-surface-raised px-3 py-1 text-sm">公告</span></div>
        <div><h2 className="text-2xl font-black">{post.title}</h2><p className="mt-2 text-muted-foreground">{post.summary}</p></div><span className="font-bold text-accent">閱讀公告 →</span>
      </a>
    ))}</div></section><SiteFooter /></main>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium" }).format(new Date(value)); }
