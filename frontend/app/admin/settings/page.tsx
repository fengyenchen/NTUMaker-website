"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, Save } from "lucide-react";

type SiteSetting = {
  key: string;
  label: string;
  value: string;
  description: string;
};

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/settings", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法讀取網站設定");
      setSettings(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法讀取網站設定");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

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
      setSettings((current) => current.map((item) => item.key === setting.key ? data : item));
      setSavedKey(setting.key);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法儲存網站設定");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-sm text-muted-foreground">管理後台</p><h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">網站設定</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">集中編輯各頁的大標、小標與介紹文字，儲存後會套用到網站前台。</p></div>
          <button onClick={() => void loadSettings()} className="inline-flex min-h-11 items-center justify-center gap-2 px-3 font-bold"><RefreshCw size={17} />重新整理</button>
        </div>
        {error && <div role="alert" className="mt-6 border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive">{error}</div>}
        {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground"><LoaderCircle className="animate-spin" />正在讀取網站設定…</div> : <div className="mt-8 grid gap-5 lg:grid-cols-2">{settings.map((setting) => <section key={setting.key} className="border border-border bg-surface p-5"><label className="grid gap-2"><span className="font-bold">{setting.label}</span><span className="text-xs leading-5 text-muted-foreground">{setting.description}</span><textarea rows={setting.key === "home_title" ? 3 : 2} value={setting.value} onChange={(event) => setSettings((current) => current.map((item) => item.key === setting.key ? { ...item, value: event.target.value } : item))} className="input-admin min-h-24 py-3" /></label><div className="mt-4 flex justify-end"><button disabled={savingKey === setting.key} onClick={() => void saveSetting(setting)} className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-50">{savingKey === setting.key ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{savedKey === setting.key ? "已儲存" : "儲存設定"}</button></div></section>)}</div>}
      </div>
    </main>
  );
}
