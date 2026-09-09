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
  about_title: "Build. Learn. Share.",
  about_description: "NTUMaker 致力於推廣創客文化。這裡不要求你一開始就會，而是希望每個人都能找到一起做東西、交換方法和完成作品的夥伴。",
  announcements_title: "社團最近在做什麼。",
  announcements_description: "社課異動、工作坊報名、社員招募與空間開放資訊都會整理在這裡。",
  courses_title: "週二完成一台車，週五帶走一項新技能。",
  courses_description: "星期二以 Arduino 循線車為連貫專案；星期五安排四場獨立主題工作坊。",
  courses_time_label: "時間",
  courses_time_value: "週二、週五 19:00–21:00",
  courses_location_label: "地點",
  courses_location_value: "學新館 523",
  courses_fee_label: "社費",
  courses_fee_value: "500 元",
  projects_title: "完成的作品，和還在長大的點子。",
  projects_description: "記錄社員專案的目標、做法、失敗與下一版，讓作品不只停在成果照。",
  resources_title: "從一堂課出發，教材和影片都在一起。",
  resources_description: "先選星期二的循線車專案或星期五的主題工作坊，再進入單堂課查看講義、上課影片與附件。",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/settings`, { next: { revalidate: 15 }, signal: AbortSignal.timeout(2000) });
    if (!response.ok) return defaults;
    const data = (await response.json()) as Array<{ key: string; value: string }>;
    return { ...defaults, ...Object.fromEntries(data.map((item) => [item.key, item.value])) };
  } catch {
    return defaults;
  }
}
