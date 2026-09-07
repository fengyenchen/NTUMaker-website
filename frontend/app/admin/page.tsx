"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  LoaderCircle,
  Users,
} from "lucide-react";

type Overview = {
  active_members: number;
  expiring_members: number;
  current_semester: string;
  semester_sessions: number;
  published_resources: number;
  member_resources: number;
  next_session: { title: string; starts_at: string } | null;
  recent: Array<{
    title: string;
    type: string;
    visibility: string;
    status: string;
    updated_at: string;
  }>;
};

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/v1/admin/overview", { credentials: "include" })
      .then(async (response) => {
        const body = await response.text();
        const data = body ? JSON.parse(body) : {};
        if (!response.ok) throw new Error(data.detail ?? "無法讀取總覽資料");
        setOverview(data);
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "無法讀取總覽資料",
        ),
      );
  }, []);

  const stats = overview
    ? [
        {
          label: "有效社員",
          value: overview.active_members,
          icon: Users,
          note: `${overview.expiring_members} 人將在 30 天內到期`,
        },
        {
          label: "社課",
          value: overview.semester_sessions,
          icon: CalendarDays,
          note: overview.next_session
            ? `下一堂：${formatDateTime(overview.next_session.starts_at)}`
            : "目前沒有未來課堂",
        },
        {
          label: "已發布教材",
          value: overview.published_resources,
          icon: BookOpen,
          note: `其中 ${overview.member_resources} 篇社員限定`,
        },
      ]
    : [];

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("zh-TW")}
          </p>
          <h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">
            你好，管理員
          </h1>
        </div>
        {error ? (
          <div
            role="alert"
            className="mt-6 border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive"
          >
            {error}
          </div>
        ) : null}
        <section className="mt-9 grid gap-4 md:grid-cols-3">
          {overview ? (
            stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article
                  key={stat.label}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <Icon size={19} className="text-accent" />
                  </div>
                  <p className="mt-5 text-4xl font-black">{stat.value}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {stat.note}
                  </p>
                </article>
              );
            })
          ) : (
            <div className="flex min-h-40 items-center gap-3 text-muted-foreground md:col-span-3">
              <LoaderCircle className="animate-spin" />
              正在讀取總覽…
            </div>
          )}
        </section>
        <section className="mt-8 rounded-xl border border-border bg-surface">
          <div className="border-b border-border p-5">
            <div>
              <h2 className="text-lg font-black">最近內容</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                管理公告、課程與教材的發布狀態。
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-background text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">標題</th>
                  <th className="px-5 py-3 font-medium">類型</th>
                  <th className="px-5 py-3 font-medium">權限</th>
                  <th className="px-5 py-3 font-medium">狀態</th>
                  <th className="px-5 py-3 font-medium">更新時間</th>
                </tr>
              </thead>
              <tbody>
                {overview?.recent.map((row, index) => (
                  <tr
                    key={`${row.type}-${row.title}-${row.updated_at}-${index}`}
                    className="border-t border-border"
                  >
                    <td className="px-5 py-4 font-bold">{row.title}</td>
                    <td className="px-5 py-4">{row.type}</td>
                    <td className="px-5 py-4">{row.visibility}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDateTime(row.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClassName(status: string) {
  if (status === "草稿") return "bg-warning/40";
  if (status === "已封存") return "bg-surface-raised text-muted-foreground";
  return "bg-success/15 text-success";
}
