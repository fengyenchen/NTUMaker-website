"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, Save } from "lucide-react";

type SiteSetting = {
  key: string;
  label: string;
  value: string;
  description: string;
  category: string;
  sort_order: number;
};

const settingTabs = [
  {
    id: "home",
    label: "首頁",
    keys: [
      "home_badge",
      "home_title",
      "home_description",
      "weekly_courses_title",
      "course_library_title",
      "next_event_title",
      "share_title",
    ],
  },
  {
    id: "announcements",
    label: "公告",
    keys: ["announcements_title", "announcements_description"],
  },
  {
    id: "courses",
    label: "社課",
    keys: ["courses_title", "courses_description"],
  },
  {
    id: "projects",
    label: "作品",
    keys: ["projects_title", "projects_description"],
  },
  { id: "about", label: "關於", keys: ["about_title", "about_description"] },
  {
    id: "resources",
    label: "資源",
    keys: ["resources_title", "resources_description"],
  },
] as const;

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] =
    useState<(typeof settingTabs)[number]["id"]>("home");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/settings", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法讀取網站設定");
      setSettings(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "無法讀取網站設定",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveSetting(setting: SiteSetting) {
    setSavingKey(setting.key);
    setSavedKey(null);
    setError("");
    try {
      const response = await fetch(`/api/v1/admin/settings/${setting.key}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: setting.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法儲存網站設定");
      setSettings((current) =>
        current.map((item) => (item.key === setting.key ? data : item)),
      );
      setSavedKey(setting.key);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "無法儲存網站設定",
      );
    } finally {
      setSavingKey(null);
    }
  }

  function moveHomeSection(sectionKey: string, direction: -1 | 1) {
    const setting = settings.find((item) => item.key === "home_section_order");
    if (!setting) return;
    const order = setting.value.split(",");
    const index = order.indexOf(sectionKey);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    setSettings((current) => current.map((item) => item.key === setting.key ? { ...item, value: order.join(",") } : item));
  }

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">管理後台</p>
            <h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">
              網站設定
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              集中編輯各頁的大標、小標與介紹文字，儲存後會套用到網站前台。
            </p>
          </div>
          <button
            onClick={() => void loadSettings()}
            className="inline-flex min-h-11 items-center justify-center gap-2 px-3 font-bold"
          >
            <RefreshCw size={17} />
            重新整理
          </button>
        </div>
        {error && (
          <div
            role="alert"
            className="mt-6 border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive"
          >
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
            <LoaderCircle className="animate-spin" />
            正在讀取網站設定…
          </div>
        ) : (
          <>
            <nav
              aria-label="網站設定頁籤"
              className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3"
              role="tablist"
            >
              {settingTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-11 border px-4 font-bold transition-colors ${activeTab === tab.id ? "border-secondary bg-secondary text-on-secondary" : "border-border bg-surface hover:bg-surface-raised"}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            {activeTab === "home" && (() => {
              const orderSetting = settings.find((item) => item.key === "home_section_order");
              const labels: Record<string, string> = { weekly_courses: "每週社課", next_event: "下一次活動", course_library: "課程內容", share: "分享區塊" };
              const order = orderSetting?.value.split(",") ?? [];
              return orderSetting ? <section className="mt-6 border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-black">首頁區塊排序</h2><p className="mt-1 text-xs text-muted-foreground">調整首頁各區塊上下順序，儲存後前台會套用。</p></div><button disabled={savingKey === orderSetting.key} onClick={() => void saveSetting(orderSetting)} className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-50">{savingKey === orderSetting.key ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{savedKey === orderSetting.key ? "已儲存" : "儲存順序"}</button></div><div className="mt-5 grid gap-2">{order.map((key, index) => <div key={key} className="flex items-center justify-between gap-3 border border-border bg-background px-4 py-3"><span className="font-bold">{index + 1}. {labels[key] ?? key}</span><div className="flex gap-2"><button type="button" disabled={index === 0} onClick={() => moveHomeSection(key, -1)} className="min-h-10 border border-border px-3 text-sm font-bold disabled:opacity-30">上移</button><button type="button" disabled={index === order.length - 1} onClick={() => moveHomeSection(key, 1)} className="min-h-10 border border-border px-3 text-sm font-bold disabled:opacity-30">下移</button></div></div>)}</div></section> : null;
            })()}
            <div className="mt-6 grid gap-5 lg:grid-cols-2" role="tabpanel">
              {settings
                .filter((setting) =>
                  settingTabs
                    .find((tab) => tab.id === activeTab)
                    ?.keys.includes(setting.key as never),
                )
                .map((setting) => (
                  <section
                    key={setting.key}
                    className="border border-border bg-surface p-5"
                  >
                    <label className="grid gap-2">
                      <span className="font-bold">{setting.label}</span>
                      <span className="text-xs leading-5 text-muted-foreground">
                        {setting.description}
                      </span>
                      <textarea
                        rows={setting.key === "home_title" ? 3 : 2}
                        value={setting.value}
                        onChange={(event) =>
                          setSettings((current) =>
                            current.map((item) =>
                              item.key === setting.key
                                ? { ...item, value: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="input-admin min-h-24 py-3"
                      />
                    </label>
                    <div className="mt-4 flex justify-end">
                      <button
                        disabled={savingKey === setting.key}
                        onClick={() => void saveSetting(setting)}
                        className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingKey === setting.key ? (
                          <LoaderCircle className="animate-spin" size={17} />
                        ) : (
                          <Save size={17} />
                        )}
                        {savedKey === setting.key ? "已儲存" : "儲存設定"}
                      </button>
                    </div>
                  </section>
                ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
