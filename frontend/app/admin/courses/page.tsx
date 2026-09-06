"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarPlus, Edit3, ExternalLink, Film, LoaderCircle, Plus, RefreshCw, Save, X } from "lucide-react";

type Track = "tuesday" | "friday";
type Visibility = "public" | "member" | "admin";

type Resource = {
  id: string;
  session_id: string;
  title: string;
  description: string;
  resource_type: string;
  url: string | null;
  youtube_url: string | null;
  visibility: Visibility;
};

type CourseSession = {
  id: string;
  series_id: string;
  title: string;
  week_label: string;
  summary: string;
  starts_at: string;
  order_index: number;
  visibility: Visibility;
  resources: Resource[];
};

type CourseSeries = {
  id: string;
  title: string;
  semester: string;
  track: Track;
  description: string;
  sessions: CourseSession[];
};

type Editor = "series" | "session" | "resource" | null;

const emptySeries = { title: "", semester: "115-1", track: "tuesday" as Track, description: "" };
const emptySession = { series_id: "", title: "", week_label: "", summary: "", starts_at: "", order_index: 0, visibility: "public" as Visibility };
const emptyResource = { session_id: "", title: "", description: "", resource_type: "article", url: "", youtube_url: "", visibility: "member" as Visibility };

export default function CoursesAdminPage() {
  const [seriesList, setSeriesList] = useState<CourseSeries[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [seriesForm, setSeriesForm] = useState(emptySeries);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/course-library", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(readError(data.detail, "無法讀取課程資料"));
      const next = data as CourseSeries[];
      setSeriesList(next);
      setSelectedSessionId((current) => next.some((series) => series.sessions.some((session) => session.id === current)) ? current : next[0]?.sessions[0]?.id ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法讀取課程資料");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLibrary(); }, [loadLibrary]);

  const selectedSession = useMemo(() => seriesList.flatMap((series) => series.sessions).find((session) => session.id === selectedSessionId) ?? null, [seriesList, selectedSessionId]);
  const selectedSeries = selectedSession ? seriesList.find((series) => series.id === selectedSession.series_id) ?? null : null;

  function openNewSeries() {
    setEditingId(null);
    setSeriesForm(emptySeries);
    setEditor("series");
    setError("");
  }

  function openEditSeries(series: CourseSeries) {
    setEditingId(series.id);
    setSeriesForm({ title: series.title, semester: series.semester, track: series.track, description: series.description });
    setEditor("series");
    setError("");
  }

  function openNewSession(series: CourseSeries) {
    setEditingId(null);
    setSessionForm({ ...emptySession, series_id: series.id, order_index: series.sessions.length + 1 });
    setEditor("session");
    setError("");
  }

  function openEditSession(session: CourseSession) {
    setEditingId(session.id);
    setSessionForm({ ...session, starts_at: toLocalDateTime(session.starts_at) });
    setEditor("session");
    setError("");
  }

  function openNewResource(session: CourseSession) {
    setEditingId(null);
    setResourceForm({ ...emptyResource, session_id: session.id });
    setEditor("resource");
    setError("");
  }

  function openEditResource(resource: Resource) {
    setEditingId(resource.id);
    setResourceForm({ ...resource, url: resource.url ?? "", youtube_url: resource.youtube_url ?? "" });
    setEditor("resource");
    setError("");
  }

  async function submitSeries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEditor(editingId ? `/api/v1/admin/course-series/${editingId}` : "/api/v1/admin/course-series", editingId ? "PUT" : "POST", seriesForm);
  }

  async function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEditor(editingId ? `/api/v1/admin/course-sessions/${editingId}` : "/api/v1/admin/course-sessions", editingId ? "PUT" : "POST", { ...sessionForm, starts_at: new Date(sessionForm.starts_at).toISOString() });
  }

  async function submitResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEditor(editingId ? `/api/v1/admin/resources/${editingId}` : "/api/v1/admin/resources", editingId ? "PUT" : "POST", { ...resourceForm, url: resourceForm.url || null, youtube_url: resourceForm.youtube_url || null });
  }

  async function saveEditor(url: string, method: "POST" | "PUT", payload: object) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(readError(data.detail, "無法儲存課程資料"));
      setEditor(null);
      setEditingId(null);
      await loadLibrary();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法儲存課程資料");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-sm text-muted-foreground">管理後台</p><h1 className="mt-1 text-3xl font-black">社課與教材</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">以每堂社課為單位管理教材、影片、程式與附件；星期二與星期五各自保有完整內容。</p></div>
          <button onClick={openNewSeries} className="button-25d inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 font-bold"><Plus size={18} />新增課程路線</button>
        </div>

        {error && <div role="alert" className="mt-6 border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive">{error}</div>}

        {editor === "series" && <EditorShell title={editingId ? "編輯課程路線" : "新增課程路線"} onClose={() => setEditor(null)}><form onSubmit={submitSeries} className="grid gap-5 md:grid-cols-2"><Field label="路線名稱"><input required maxLength={200} value={seriesForm.title} onChange={(event) => setSeriesForm({ ...seriesForm, title: event.target.value })} className="input-admin" /></Field><Field label="學期"><input required maxLength={30} value={seriesForm.semester} onChange={(event) => setSeriesForm({ ...seriesForm, semester: event.target.value })} className="input-admin" /></Field><Field label="上課日"><select value={seriesForm.track} onChange={(event) => setSeriesForm({ ...seriesForm, track: event.target.value as Track })} className="input-admin"><option value="tuesday">星期二</option><option value="friday">星期五</option></select></Field><Field label="路線簡介"><textarea required rows={3} value={seriesForm.description} onChange={(event) => setSeriesForm({ ...seriesForm, description: event.target.value })} className="input-admin py-3" /></Field><SubmitRow saving={saving} editing={Boolean(editingId)} onCancel={() => setEditor(null)} /></form></EditorShell>}

        {editor === "session" && <EditorShell title={editingId ? "編輯課堂" : "新增課堂"} onClose={() => setEditor(null)}><form onSubmit={submitSession} className="grid gap-5 md:grid-cols-2"><Field label="所屬路線"><select required value={sessionForm.series_id} onChange={(event) => setSessionForm({ ...sessionForm, series_id: event.target.value })} className="input-admin">{seriesList.map((series) => <option key={series.id} value={series.id}>{trackLabel(series.track)}｜{series.title}</option>)}</select></Field><Field label="課堂名稱"><input required maxLength={200} value={sessionForm.title} onChange={(event) => setSessionForm({ ...sessionForm, title: event.target.value })} className="input-admin" /></Field><Field label="週次"><input required maxLength={30} placeholder="例如：第 4–5 週" value={sessionForm.week_label} onChange={(event) => setSessionForm({ ...sessionForm, week_label: event.target.value })} className="input-admin" /></Field><Field label="上課時間"><input required type="datetime-local" value={sessionForm.starts_at} onChange={(event) => setSessionForm({ ...sessionForm, starts_at: event.target.value })} className="input-admin" /></Field><Field label="顯示順序"><input required min={0} type="number" value={sessionForm.order_index} onChange={(event) => setSessionForm({ ...sessionForm, order_index: Number(event.target.value) })} className="input-admin" /></Field><Field label="課堂權限"><VisibilitySelect value={sessionForm.visibility} onChange={(visibility) => setSessionForm({ ...sessionForm, visibility })} /></Field><div className="md:col-span-2"><Field label="課堂摘要"><textarea required maxLength={500} rows={3} value={sessionForm.summary} onChange={(event) => setSessionForm({ ...sessionForm, summary: event.target.value })} className="input-admin py-3" /></Field></div><SubmitRow saving={saving} editing={Boolean(editingId)} onCancel={() => setEditor(null)} /></form></EditorShell>}

        {editor === "resource" && <EditorShell title={editingId ? "編輯課程內容" : "新增課程內容"} onClose={() => setEditor(null)}><form onSubmit={submitResource} className="grid gap-5 md:grid-cols-2"><Field label="內容名稱"><input required maxLength={200} value={resourceForm.title} onChange={(event) => setResourceForm({ ...resourceForm, title: event.target.value })} className="input-admin" /></Field><Field label="內容類型"><select value={resourceForm.resource_type} onChange={(event) => setResourceForm({ ...resourceForm, resource_type: event.target.value })} className="input-admin"><option value="article">教材</option><option value="video">影片</option><option value="code">程式</option><option value="file">製作檔案</option><option value="link">外部連結</option></select></Field><Field label="閱讀／下載網址" required={false}><input type="url" value={resourceForm.url} onChange={(event) => setResourceForm({ ...resourceForm, url: event.target.value })} className="input-admin" /></Field><Field label="YouTube 網址" required={false}><input type="url" value={resourceForm.youtube_url} onChange={(event) => setResourceForm({ ...resourceForm, youtube_url: event.target.value })} className="input-admin" /></Field><Field label="內容權限"><VisibilitySelect value={resourceForm.visibility} onChange={(visibility) => setResourceForm({ ...resourceForm, visibility })} /></Field><div className="md:col-span-2"><Field label="內容說明"><textarea required rows={3} value={resourceForm.description} onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })} className="input-admin py-3" /></Field></div><SubmitRow saving={saving} editing={Boolean(editingId)} onCancel={() => setEditor(null)} /></form></EditorShell>}

        <div className="mt-8 flex justify-end"><button onClick={() => void loadLibrary()} className="inline-flex min-h-11 items-center gap-2 px-3 font-bold"><RefreshCw size={17} />重新整理</button></div>

        {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground"><LoaderCircle className="animate-spin" />正在讀取課程…</div> : seriesList.length === 0 ? <div className="mt-5 border border-border bg-surface p-10 text-center text-muted-foreground">尚未建立課程路線，請先新增星期二或星期五課程。</div> : (
          <div className="mt-3 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
            <div className="grid content-start gap-5">{seriesList.map((series) => <section key={series.id} className="border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className={`inline-flex border px-2 py-1 text-xs font-bold ${series.track === "tuesday" ? "border-primary text-primary" : "border-accent text-accent"}`}>{trackLabel(series.track)} · {series.semester}</p><h2 className="mt-3 text-xl font-black">{series.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{series.description}</p></div><div className="flex gap-2"><IconButton label={`編輯 ${series.title}`} onClick={() => openEditSeries(series)}><Edit3 size={16} /></IconButton><button onClick={() => openNewSession(series)} className="inline-flex min-h-11 items-center gap-2 border border-border px-3 text-sm font-bold"><CalendarPlus size={16} />新增課堂</button></div></div><div className="mt-5 grid gap-2">{series.sessions.length === 0 ? <p className="border-t border-border py-5 text-sm text-muted-foreground">這條路線還沒有課堂。</p> : series.sessions.map((session) => <button key={session.id} onClick={() => setSelectedSessionId(session.id)} className={`grid min-h-16 w-full grid-cols-[5rem_1fr_auto] items-center gap-3 border p-3 text-left transition-colors ${selectedSessionId === session.id ? "border-accent bg-accent/10" : "border-border hover:bg-background"}`}><span className="font-mono text-xs text-muted-foreground">{session.week_label}</span><span><span className="block font-bold">{session.title}</span><span className="mt-1 block text-xs text-muted-foreground">{session.resources.length} 項內容</span></span><span className="text-xs font-bold text-accent">管理</span></button>)}</div></section>)}</div>

            <aside className="border border-border bg-surface p-5 xl:sticky xl:top-6 xl:self-start">{selectedSession && selectedSeries ? <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-muted-foreground">{trackLabel(selectedSeries.track)} · {selectedSession.week_label}</p><h2 className="mt-2 text-xl font-black">{selectedSession.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedSession.summary}</p></div><IconButton label={`編輯 ${selectedSession.title}`} onClick={() => openEditSession(selectedSession)}><Edit3 size={17} /></IconButton></div><div className="mt-5 flex items-center justify-between border-y border-border py-3"><p className="font-bold">本堂教材與影片</p><button onClick={() => openNewResource(selectedSession)} className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-bold text-accent"><Plus size={17} />新增內容</button></div><div className="mt-3 grid gap-3">{selectedSession.resources.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">這堂課還沒有教材或影片。</p> : selectedSession.resources.map((resource) => <article key={resource.id} className="border border-border bg-background p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3">{resource.resource_type === "video" ? <Film className="mt-0.5 shrink-0 text-primary" size={19} /> : <BookOpen className="mt-0.5 shrink-0 text-accent" size={19} />}<div><h3 className="font-bold">{resource.title}</h3><p className="mt-1 text-xs text-muted-foreground">{resourceTypeLabel(resource.resource_type)} · {visibilityLabel(resource.visibility)}</p></div></div><IconButton label={`編輯 ${resource.title}`} onClick={() => openEditResource(resource)}><Edit3 size={16} /></IconButton></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{resource.description}</p>{(resource.youtube_url || resource.url) && <a href={resource.youtube_url ?? resource.url ?? "#"} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-accent">開啟內容<ExternalLink size={15} /></a>}</article>)}</div></> : <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground">請從左側選擇一堂課管理教材與影片。</div>}</aside>
          </div>
        )}
      </div>
    </main>
  );
}

function EditorShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <section className="mt-7 border border-border bg-surface p-5 shadow-[4px_5px_0_var(--color-shadow-soft)] md:p-7"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold text-accent">編輯區</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><button type="button" onClick={onClose} aria-label="關閉編輯區" className="grid size-11 place-items-center"><X size={19} /></button></div>{children}</section>;
}

function Field({ label, required = true, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold"><span>{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</span>{children}</label>;
}

function VisibilitySelect({ value, onChange }: { value: Visibility; onChange: (value: Visibility) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value as Visibility)} className="input-admin"><option value="public">公開</option><option value="member">社員限定</option><option value="admin">管理員限定</option></select>;
}

function SubmitRow({ saving, editing, onCancel }: { saving: boolean; editing: boolean; onCancel: () => void }) {
  return <div className="flex justify-end gap-3 md:col-span-2"><button type="button" onClick={onCancel} className="min-h-11 px-4 font-bold">取消</button><button disabled={saving} className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:cursor-not-allowed disabled:opacity-50">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}{editing ? "儲存變更" : "建立"}</button></div>;
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} className="grid size-11 shrink-0 place-items-center border border-border hover:bg-background">{children}</button>;
}

function trackLabel(track: Track) { return track === "tuesday" ? "星期二" : "星期五"; }
function visibilityLabel(visibility: Visibility) { return visibility === "public" ? "公開" : visibility === "member" ? "社員限定" : "管理員限定"; }
function resourceTypeLabel(type: string) { return ({ article: "教材", video: "影片", code: "程式", file: "製作檔案", link: "外部連結" } as Record<string, string>)[type] ?? type; }

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function readError(detail: unknown, fallback: string) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string") return first.msg;
  }
  return fallback;
}
