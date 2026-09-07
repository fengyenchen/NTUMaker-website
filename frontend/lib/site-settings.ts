import "server-only";

export type SiteSettings = Record<string, string>;

const defaults: SiteSettings = {
  home_badge: "2026 秋季社課進行中",
  home_title: "把想法\n做成真的。",
  home_description: "從電子、程式、設計到數位製造，和一群喜歡動手的人一起試、一起拆，再做出更好的版本。",
  weekly_courses_title: "兩條路線，自由找到你的節奏。",
  course_library_title: "每堂課的教材、影片與檔案，都收在一起。",
  home_section_order: "weekly_courses,next_event,course_library,share",
  next_event_title: "下一次，一起做什麼？",
  share_title: "做出作品，也把方法分享出去。",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/settings`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2000) });
    if (!response.ok) return defaults;
    const data = (await response.json()) as Array<{ key: string; value: string }>;
    return { ...defaults, ...Object.fromEntries(data.map((item) => [item.key, item.value])) };
  } catch {
    return defaults;
  }
}
