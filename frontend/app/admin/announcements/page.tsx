"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Edit3, Eye, ImagePlus, LoaderCircle, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";

type PublishStatus = "draft" | "published" | "archived";

type Announcement = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: PublishStatus;
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AnnouncementForm = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: Exclude<PublishStatus, "archived">;
  is_pinned: boolean;
  published_at: string;
};

const emptyForm: AnnouncementForm = {
  slug: "",
  title: "",
  summary: "",
  body: "",
  status: "draft",
  is_pinned: false,
  published_at: "",
};

const statusLabels: Record<PublishStatus, string> = {
  draft: "草稿",
  published: "已發布",
  archived: "已封存",
};

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [previewBody, setPreviewBody] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/announcements", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法讀取公告");
      setItems(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法讀取公告");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadItems(); }, [loadItems]);

  function openNew() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replaceAll("-", "");
    setEditingId(null);
    setForm({ ...emptyForm, slug: `announcement-${date}` });
    setShowForm(true);
    setPreviewBody(false);
    setError("");
  }

  function openEdit(item: Announcement) {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      body: item.body,
      status: item.status === "published" ? "published" : "draft",
      is_pinned: item.is_pinned,
      published_at: item.published_at ? toLocalDateTime(item.published_at) : "",
    });
    setShowForm(true);
    setPreviewBody(false);
    setError("");
  }

  async function saveAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
    };
    try {
      const response = await fetch(editingId ? `/api/v1/admin/announcements/${editingId}` : "/api/v1/admin/announcements", {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(readError(data.detail, "無法儲存公告"));
      setItems((current) => editingId ? current.map((item) => item.id === editingId ? data : item) : [data, ...current]);
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法儲存公告");
    } finally {
      setSaving(false);
    }
  }

  async function uploadBodyImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/v1/admin/uploads/images", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(readError(data.detail, "圖片上傳失敗"));
      const markdown = `![${data.image_name ?? file.name}](${data.url})`;
      const textarea = bodyRef.current;
      const start = textarea?.selectionStart ?? form.body.length;
      const end = textarea?.selectionEnd ?? start;
      const nextBody = `${form.body.slice(0, start)}${markdown}${form.body.slice(end)}`;
      setForm((current) => ({ ...current, body: nextBody }));
      requestAnimationFrame(() => {
        textarea?.focus();
        const cursor = start + markdown.length;
        textarea?.setSelectionRange(cursor, cursor);
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "圖片上傳失敗");
    } finally {
      setUploadingImage(false);
    }
  }

  async function deleteAnnouncement(item: Announcement) {
    if (!window.confirm(`確定要刪除「${item.title}」嗎？刪除後無法復原。`)) return;
    setError("");
    try {
      const response = await fetch(`/api/v1/admin/announcements/${item.id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail ?? "無法刪除公告");
      }
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法刪除公告");
    }
  }

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">管理後台</p>
            <h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">公告管理</h1>
            <p className="mt-2 text-sm text-muted-foreground">撰寫、排程及發布所有訪客都能閱讀的社團公告。</p>
          </div>
          <button onClick={openNew} className="button-25d inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-bold"><Plus size={18} />新增公告</button>
        </div>

        {error && <div role="alert" className="mt-6 border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive">{error}</div>}

        {showForm && (
          <section className="mt-7 border border-border bg-surface p-5 shadow-[4px_5px_0_var(--color-shadow-soft)] md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-black">{editingId ? "編輯公告" : "新增公告"}</h2><p className="mt-1 text-sm text-muted-foreground">先存成草稿，確認內容後再發布。</p></div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="關閉公告表單" className="grid size-11 place-items-center"><X size={19} /></button>
            </div>
            <form onSubmit={saveAnnouncement} className="mt-6 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="公告標題"><input required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="min-h-11 w-full rounded-lg border border-border bg-background px-3" /></Field>
                <Field label="網址代稱" hint="只能使用小寫英文、數字與連字號"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase() })} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 font-mono" /></Field>
              </div>
              <Field label="摘要" hint={`${form.summary.length} / 500`}><textarea required maxLength={500} rows={2} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} className="w-full rounded-lg border border-border bg-background p-3 leading-6" /></Field>
              <Field label="公告內容" hint="支援 Markdown"><div className="markdown-editor-shell overflow-hidden border border-border bg-background"><div className="flex flex-wrap items-center justify-between border-b border-border"><div className="flex"><button type="button" onClick={() => setPreviewBody(false)} className={`inline-flex min-h-10 items-center gap-2 px-3 text-sm font-bold ${!previewBody ? "bg-surface-raised" : "text-muted-foreground"}`}><Pencil size={15} />編輯</button><button type="button" onClick={() => setPreviewBody(true)} className={`inline-flex min-h-10 items-center gap-2 px-3 text-sm font-bold ${previewBody ? "bg-surface-raised" : "text-muted-foreground"}`}><Eye size={15} />預覽</button></div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 px-3 text-sm font-bold text-accent hover:bg-surface-raised has-disabled:cursor-not-allowed has-disabled:opacity-50"><ImagePlus size={15} />{uploadingImage ? "上傳中…" : "上傳圖片"}<input type="file" accept="image/*" disabled={uploadingImage} onChange={(event) => void uploadBodyImage(event)} className="sr-only" /></label></div>{previewBody ? <MarkdownContent content={form.body || "尚未輸入公告內容。"} className="min-h-48 p-4" /> : <textarea ref={bodyRef} required rows={8} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} className="markdown-editor w-full bg-transparent p-3 leading-7" />}</div></Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="發布狀態"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AnnouncementForm["status"] })} className="min-h-11 w-full rounded-lg border border-border bg-background px-3"><option value="draft">草稿</option><option value="published">發布</option></select></Field>
                <Field label="發布時間" hint="發布狀態下留空會立即發布"><input type="datetime-local" value={form.published_at} onChange={(event) => setForm({ ...form, published_at: event.target.value })} className="min-h-11 w-full rounded-lg border border-border bg-background px-3" /></Field>
              </div>
              <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.is_pinned} onChange={(event) => setForm({ ...form, is_pinned: event.target.checked })} className="size-4 accent-primary" />置頂這則公告<span className="font-normal text-muted-foreground">前台會優先顯示</span></label>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="min-h-11 px-4 font-bold">取消</button><button disabled={saving} className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{editingId ? "儲存變更" : "建立公告"}</button></div>
            </form>
          </section>
        )}

        <section className="mt-8 overflow-hidden border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-black">所有公告</h2><p className="mt-1 text-xs text-muted-foreground">共 {items.length} 則</p></div><button onClick={() => void loadItems()} className="inline-flex min-h-11 items-center gap-2 px-3 font-bold"><RefreshCw size={17} />重新整理</button></div>
          {loading ? <div className="flex min-h-52 items-center justify-center gap-3 text-muted-foreground"><LoaderCircle className="animate-spin" />正在讀取公告…</div> : items.length === 0 ? <div className="min-h-52 p-8 text-center text-muted-foreground">目前沒有公告，可以從右上角建立第一則公告。</div> : (
            <div className="divide-y divide-border">{items.map((item) => <article key={item.id} className="grid gap-4 p-5 md:grid-cols-[1fr_9rem_11rem] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.title}</h3><StatusBadge status={item.status} />{item.is_pinned && <span className="border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">置頂</span>}</div><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.summary}</p><p className="mt-2 font-mono text-xs text-muted-foreground">/{item.slug}</p></div><div className="text-sm"><p className="text-xs text-muted-foreground">發布時間</p><p className="mt-1">{item.published_at ? formatDate(item.published_at) : "尚未設定"}</p></div><div className="flex justify-end gap-2"><button onClick={() => openEdit(item)} className="inline-flex min-h-11 items-center gap-1 border border-border px-3 font-bold"><Edit3 size={16} />編輯</button><button onClick={() => void deleteAnnouncement(item)} className="inline-flex min-h-11 items-center gap-1 border border-border px-3 font-bold text-destructive"><Trash2 size={16} />刪除</button></div></article>)}</div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold"><span className="flex justify-between gap-4"><span>{label}</span>{hint && <span className="font-normal text-muted-foreground">{hint}</span>}</span>{children}</label>;
}

function StatusBadge({ status }: { status: PublishStatus }) {
  const style = status === "published" ? "bg-success/15 text-success" : status === "archived" ? "bg-surface-raised text-muted-foreground" : "bg-warning/30 text-foreground";
  return <span className={`border border-border px-2 py-1 text-xs font-bold ${style}`}>{statusLabels[status]}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function readError(detail: unknown, fallback: string) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg as string;
  return fallback;
}
