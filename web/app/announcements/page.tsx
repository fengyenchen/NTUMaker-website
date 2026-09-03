import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const posts = [
  { date: "2026.09.08", tag: "社課", title: "本學期第一次社課與社員說明會", summary: "認識 NTUMaker、本學期的社課雙軌，以及如何使用 Maker Space。" },
  { date: "2026.09.12", tag: "工作坊", title: "雷射切割入門工作坊", summary: "從向量圖、材料設定到實際切割，完成第一件自己的作品。" },
  { date: "2026.09.19", tag: "公告", title: "社員招募與空間使用須知", summary: "社員資格、工具借用、場地開放時間與安全規範整理。" },
];

export default function AnnouncementsPage() {
  return <main><SiteHeader /><PageHero eyebrow="ANNOUNCEMENTS / 公告" title="社團最近在做什麼。" description="社課異動、工作坊報名、社員招募與空間開放資訊都會整理在這裡。" />
    <section className="px-5 pb-24 md:px-8"><div className="mx-auto max-w-[1320px] space-y-5">{posts.map((post, index) => (
      <article key={post.title} className={`grid gap-6 rounded-2xl border border-border bg-surface p-7 md:grid-cols-[150px_1fr_auto] md:items-center md:p-9 ${index === 0 ? "shadow-[9px_10px_0_rgba(242,106,46,0.24)]" : ""}`}>
        <div><p className="font-mono text-sm text-primary">{post.date}</p><span className="mt-3 inline-block rounded-full bg-surface-raised px-3 py-1 text-sm">{post.tag}</span></div>
        <div><h2 className="text-2xl font-black">{post.title}</h2><p className="mt-2 text-muted-foreground">{post.summary}</p></div>
        <button className="inline-flex min-h-11 items-center gap-2 font-bold text-secondary">閱讀公告 <ArrowUpRight size={17} /></button>
      </article>
    ))}</div></section><SiteFooter /></main>;
}
