import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileText,
  LockKeyhole,
  Play,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getCurrentUser,
  getMemberResources,
  type MemberResource,
} from "@/lib/auth-api";
import {
  getCourseTracks,
  getPublicResources,
  getSessionResourcePath,
  type PublicResource,
} from "@/lib/course-api";

type ResourceItem = PublicResource | MemberResource;

export default async function SessionResourcePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const courseTracks = await getCourseTracks();
  const entry = courseTracks
    .flatMap((track) =>
      track.sessions.map((session, index) => ({ track, session, index })),
    )
    .find(({ session }) => session.id === sessionId);
  if (!entry) notFound();

  const { track, session, index: sessionIndex } = entry;

  const user = await getCurrentUser();
  const resources = user ? await getMemberResources() : await getPublicResources();
  const sessionResources = resources.filter(
    (resource) => resource.session_id === session.id,
  );
  const hasLockedContent = !user && session.assets.length > sessionResources.length;

  return (
    <main>
      <SiteHeader />
      <section className="px-5 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/resources"
            className="card-inline-link inline-flex min-h-11 items-center gap-2 font-bold text-accent"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            返回資源列表
          </Link>

          <div className="mt-10 border-b border-border pb-10">
            <p className="font-mono text-sm font-bold text-accent">
              {track.day} · {session.week}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-[1.15] tracking-tight md:text-6xl">
              {session.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              {session.summary}
            </p>
          </div>

          {hasLockedContent && (
            <section className="mt-8 flex flex-col gap-5 border border-accent/40 bg-accent/10 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <LockKeyhole className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <h2 className="font-black">登入後取得完整資源</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    這堂課的部分資源與影片限社員使用。
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="button-25d inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 font-bold"
              >
                社員登入
              </Link>
            </section>
          )}

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-accent">COURSE MATERIALS</p>
                <h2 className="mt-2 text-3xl font-black">開始製作</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {sessionResources.length} 項可用內容
              </p>
            </div>
            {sessionResources.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {sessionResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="mt-6 border border-border bg-surface p-7">
                <BookOpen className="text-accent" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-black">資源準備中</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  管理員尚未為這堂課發布可開啟的資源或影片。
                </p>
              </div>
            )}
          </section>

          <nav aria-label="同一路線的其他課程" className="mt-16 border-t border-border pt-8">
            <p className="text-sm font-bold text-muted-foreground">同一路線的其他課程</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {track.sessions
                .map((item, index) => ({ item, index }))
                .filter(({ index }) => index !== sessionIndex)
                .map(({ item, index }) => (
                  <Link
                    key={item.title}
                    href={item.id ? getSessionResourcePath(item.id) : "/resources"}
                    className="card-interactive inline-flex min-h-11 items-center border border-border bg-surface px-4 text-sm font-bold"
                  >
                    {item.week} · {item.title}
                  </Link>
                ))}
            </div>
          </nav>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function ResourceCard({ resource }: { resource: ResourceItem }) {
  const href = resource.youtube_url ?? resource.url;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(resource.youtube_url);
  const Icon =
    resource.resource_type === "video"
      ? Play
      : resource.resource_type === "article"
        ? FileText
        : BookOpen;
  const content = (
    <>
      {resource.resource_type === "image" && resource.url ? (
        <img src={resource.url} alt={resource.title} loading="lazy" className="mb-5 aspect-[5/4] w-full object-contain border border-border bg-background" />
      ) : (
        <Icon className="text-accent" aria-hidden="true" />
      )}
      <p className="mt-7 text-sm text-muted-foreground">
        {resource.resource_type === "video" ? "課程影片" : "資源"}
      </p>
      <h3 className="mt-2 text-xl font-black">{resource.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {resource.description}
      </p>
    </>
  );

  return youtubeEmbedUrl ? (
    <article className="border border-border bg-surface p-6">
      <div className="mb-6 overflow-hidden border border-border bg-black">
        <iframe
          src={youtubeEmbedUrl}
          title={`${resource.title} YouTube 影片`}
          loading="lazy"
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {content}
      <a
        href={resource.youtube_url ?? "#"}
        target="_blank"
        rel="noreferrer"
        className="card-inline-link mt-7 inline-flex min-h-11 items-center gap-2 font-bold text-accent"
      >
        在 YouTube 開啟
        <ExternalLink className="card-link-arrow" size={16} aria-hidden="true" />
      </a>
    </article>
  ) : href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="card-interactive block border border-border bg-surface p-6"
    >
      {content}
      <span className="card-inline-link mt-7 inline-flex min-h-11 items-center gap-2 font-bold text-accent">
        開啟內容
        <ExternalLink className="card-link-arrow" size={16} aria-hidden="true" />
      </span>
    </a>
  ) : (
    <article className="border border-border bg-surface p-6">
      {content}
      <p className="mt-7 text-sm font-bold text-muted-foreground">內容連結待補</p>
    </article>
  );
}

function getYouTubeEmbedUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const videoId =
      parsed.hostname === "youtu.be"
        ? parsed.pathname.slice(1)
        : parsed.hostname.endsWith("youtube.com")
          ? parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).pop()
          : null;
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}
