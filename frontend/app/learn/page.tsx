import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CalendarClock, ExternalLink, FileText, Play } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, getMemberResources, type MemberResource } from "@/lib/auth-api";

export default async function LearnPage() {
  const [user, resources] = await Promise.all([getCurrentUser(), getMemberResources()]);
  if (!user) redirect("/login");

  const expiresAt = user.membership_expires_at
    ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "long" }).format(new Date(`${user.membership_expires_at}T00:00:00+08:00`))
    : "未設定";

  return (
    <main>
      <SiteHeader />
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="text-sm font-bold text-primary">社員學習區</p><h1 className="mt-3 text-5xl font-black tracking-tight">{user.display_name ? `${user.display_name}，繼續動手做。` : "歡迎回來，繼續動手做。"}</h1><p className="mt-4 text-sm text-muted-foreground">{user.email}</p></div>
            <div className="flex items-center gap-4 border border-border bg-surface px-5 py-4"><div><p className="text-xs text-muted-foreground">社員資格</p><p className="mt-1 font-bold text-success">有效至 {expiresAt}</p></div><LogoutButton className="border-l border-border pl-4 text-sm" /></div>
          </div>

          <div className="mt-12 grid gap-7 lg:grid-cols-[1.35fr_.65fr]">
            <section className="rounded-2xl bg-secondary p-8 text-on-secondary shadow-[6px_7px_0_var(--color-shadow-soft)] md:p-10"><p className="text-sm font-bold text-white/70">星期二 · 基礎連貫專案</p><h2 className="mt-4 text-4xl font-black">03 感測器與互動輸入</h2><p className="mt-4 max-w-xl leading-7 text-white/75">認識類比與數位輸入，將感測數值整理成可以控制作品狀態的訊號。</p><div className="mt-10 h-3 overflow-hidden rounded-full bg-black/20"><div className="h-full w-[38%] rounded-full bg-warning" /></div><div className="mt-3 flex justify-between text-sm"><span>本學期進度</span><span>3 / 8</span></div><Link href="/resources" className="card-inline-link mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-background px-5 font-bold text-foreground">進入本週課程 <ArrowRight className="card-link-arrow" size={18} aria-hidden="true" /></Link></section>
            <section className="rounded-2xl border border-border bg-surface p-8"><CalendarClock className="text-primary" aria-hidden="true" /><h2 className="mt-8 text-2xl font-black">下一堂社課</h2><p className="mt-2 text-muted-foreground">星期五 19:00</p><p className="mt-6 text-xl font-bold">雷射切割與向量設計</p><p className="mt-2 text-sm leading-6 text-muted-foreground">請自備筆電，軟體安裝方式在課前通知。</p></section>
          </div>

          <div className="mt-16 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-primary">已解鎖</p><h2 className="mt-2 text-3xl font-black">社員教材與影片</h2></div><p className="text-sm text-muted-foreground">共 {resources.length} 項可用內容</p></div>
          {resources.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{resources.slice(0, 9).map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div> : <div className="mt-6 border border-border bg-surface p-8 text-muted-foreground"><BookOpen aria-hidden="true" /><p className="mt-5 font-bold text-foreground">目前還沒有可用教材</p><p className="mt-2 text-sm">管理員發布社員內容後，會自動出現在這裡。</p></div>}
        </div>
      </section>
    </main>
  );
}

function ResourceCard({ resource }: { resource: MemberResource }) {
  const href = resource.youtube_url ?? resource.url;
  const Icon = resource.resource_type === "video" ? Play : resource.resource_type === "article" ? FileText : BookOpen;
  const content = <><div className="flex items-start justify-between gap-4"><Icon className="text-primary" aria-hidden="true" /><span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-bold">{resource.visibility === "member" ? "社員限定" : "公開"}</span></div><p className="mt-10 text-sm text-muted-foreground">{resource.resource_type === "video" ? "課程影片" : resource.resource_type === "article" ? "文章" : "教材檔案"}</p><h3 className="mt-2 text-xl font-black">{resource.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{resource.description}</p>{href && <span className="card-inline-link mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-accent">開啟內容 <ExternalLink className="card-link-arrow" size={16} aria-hidden="true" /></span>}</>;

  return href
    ? <a href={href} target="_blank" rel="noreferrer" className="card-interactive border border-border bg-surface p-6">{content}</a>
    : <article className="border border-border bg-surface p-6">{content}<p className="mt-6 text-xs font-bold text-muted-foreground">內容連結待管理員補上</p></article>;
}
