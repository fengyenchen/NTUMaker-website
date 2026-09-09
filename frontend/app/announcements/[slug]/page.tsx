import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/site-settings";

type Announcement = { title: string; summary: string; body: string; published_at: string | null };

async function getAnnouncement(slug: string): Promise<Announcement | null> {
  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/announcements/${encodeURIComponent(slug)}`, { next: { revalidate: 15 } });
    if (!response.ok) return null;
    return await response.json() as Announcement;
  } catch { return null; }
}

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, announcement] = await Promise.all([getSiteSettings(), getAnnouncement(slug)]);
  if (!announcement) notFound();
  return <main><SiteHeader /><PageHero eyebrow="ANNOUNCEMENTS / 公告" title={announcement.title} description={announcement.summary} />
    <section className="px-5 pb-24 md:px-8"><article className="mx-auto max-w-205 border border-border bg-surface p-7 shadow-[4px_5px_0_var(--color-shadow-soft)] md:p-10">
      <p className="font-mono text-sm text-primary">{announcement.published_at ? formatDate(announcement.published_at) : "未設定日期"}</p>
      <MarkdownContent content={announcement.body} className="mt-7 border-t border-border pt-7" />
      <Link href="/announcements" className="mt-10 inline-flex min-h-11 items-center gap-2 font-bold text-accent"><ArrowLeft size={17} />返回公告列表</Link>
    </article></section><SiteFooter /></main>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium" }).format(new Date(value)); }
