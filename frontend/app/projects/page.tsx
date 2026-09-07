import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/site-settings";

const projects = [
  {
    title: "桌上型環境感測站",
    tags: ["ESP32", "感測器"],
    description: "蒐集空間溫濕度與空氣品質，顯示於自製儀表板。",
  },
  {
    title: "模組化工具收納",
    tags: ["3D 列印", "CAD"],
    description: "能依工具尺寸快速調整的桌面收納系統。",
  },
  {
    title: "互動光影裝置",
    tags: ["互動", "燈光"],
    description: "根據觀眾距離與動作改變光線和聲音的展示作品。",
  },
];

export default async function ProjectsPage() {
  const settings = await getSiteSettings();
  return (
    <main>
      <SiteHeader />
      <PageHero
        eyebrow="PROJECTS / 作品"
        title={settings.projects_title}
        description={settings.projects_description}
      />
      <section className="px-5 pb-28 md:px-8">
        <div className="mx-auto grid max-w-330 gap-7 md:grid-cols-3">
          {projects.map((item, index) => {
            return (
              <article
                key={item.title}
                className="card-interactive rounded-2xl border border-border bg-surface p-8"
              >
                <h2 className="text-3xl font-black">{item.title}</h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-raised px-3 py-1 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="card-inline-link mt-8 inline-flex min-h-11 items-center gap-2 font-bold text-accent">
                  查看紀錄{" "}
                  <ExternalLink className="card-link-arrow" size={17} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
