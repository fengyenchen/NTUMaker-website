import { notFound } from "next/navigation";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { courseTracks } from "@/data/course-schedule";

const sectionMeta = {
  announcements: {
    title: "公告管理",
    description: "撰寫、排程與發布所有人都能閱讀的社團公告。",
    action: "新增公告",
  },
  courses: {
    title: "社課管理",
    description: "管理星期二連貫專案與星期五主題工作坊的學期安排。",
    action: "新增課堂",
  },
  resources: {
    title: "課程內容",
    description: "進入一堂課管理它的教材、影片、程式與附件。",
    action: "新增課程內容",
  },
  articles: {
    title: "文章管理",
    description: "撰寫教學文章、活動紀錄與可重複使用的文字頁面。",
    action: "新增文章",
  },
  projects: {
    title: "作品管理",
    description: "整理社員作品的說明、圖片、標籤與製作紀錄。",
    action: "新增作品",
  },
  members: {
    title: "社員管理",
    description: "管理社員 Email、身分、有效期限與帳號狀態。",
    action: "新增社員",
  },
  social: {
    title: "社群發布",
    description:
      "自動發布貼文至 Instagram、Facebook 與 Threads。",
    action: "新增貼文",
  },
  settings: {
    title: "網站設定",
    description: "管理學期、上課地點、社費與首頁顯示資訊。",
    action: "儲存設定",
  },
} as const;

type Section = keyof typeof sectionMeta;

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!(section in sectionMeta)) notFound();
  const key = section as Section;
  const meta = sectionMeta[key];

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">管理後台</p>
            <h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">
              {meta.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {meta.description}
            </p>
          </div>
          <button className="button-25d inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 font-bold">
            <Plus size={18} />
            {meta.action}
          </button>
        </div>
        {key === "resources" || key === "courses" ? (
          <CourseManager resources={key === "resources"} />
        ) : (
          <GenericManager section={key} />
        )}
      </div>
    </main>
  );
}

function CourseManager({ resources }: { resources: boolean }) {
  return (
    <div className="mt-9 grid gap-6 xl:grid-cols-2">
      {courseTracks.map((track) => (
        <section
          key={track.id}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                {track.day} · {track.time}
              </p>
              <h2 className="mt-1 text-xl font-black">{track.title}</h2>
            </div>
            <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-bold">
              {track.sessions.length} 堂
            </span>
          </div>
          <div className="mt-5 divide-y divide-border border-y border-border">
            {track.sessions.map((session) => (
              <button
                key={session.title}
                className="flex min-h-16 w-full items-center gap-4 py-3 text-left"
              >
                <span className="min-w-16 font-mono text-xs text-muted-foreground">
                  {session.week}
                </span>
                <span className="flex-1 font-bold">{session.title}</span>
                <span className="text-xs text-muted-foreground">
                  {resources ? `${session.assets.length} 項內容` : "編輯"}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function GenericManager({ section }: { section: Section }) {
  const rows =
    section === "members"
      ? [
          ["maker@ntu.edu.tw", "社員", "2027/01/31"],
          ["admin@ntumaker.tw", "管理員", "永久"],
        ]
      : section === "announcements"
        ? [
            ["迎新社課公告", "已發布", "2026/09/15"],
            ["社員招募資訊", "草稿", "尚未發布"],
          ]
        : [["目前尚未建立內容", "—", "—"]];
  return (
    <section className="mt-9 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
          <Search size={17} />
          <span className="sr-only">搜尋</span>
          <input
            className="w-full bg-transparent outline-none"
            placeholder="搜尋…"
          />
        </label>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 font-bold">
          <SlidersHorizontal size={17} />
          篩選
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-155 text-left text-sm">
          <thead className="bg-background text-muted-foreground">
            <tr>
              <th className="px-5 py-3">名稱</th>
              <th className="px-5 py-3">狀態</th>
              <th className="px-5 py-3">日期／期限</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t border-border">
                <td className="px-5 py-4 font-bold">{row[0]}</td>
                <td className="px-5 py-4">{row[1]}</td>
                <td className="px-5 py-4 text-muted-foreground">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
