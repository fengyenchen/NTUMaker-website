"use client";

import {
  Dispatch,
  ChangeEvent,
  FormEvent,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  CalendarPlus,
  ChevronDown,
  Film,
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

type Track =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
type Visibility = "public" | "member";

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
  time: string;
  description: string;
  sessions: CourseSession[];
};

type Editor = "series" | "session" | "resource" | null;

const emptySeries = {
  title: "",
  semester: "115-1",
  track: "tuesday" as Track,
  time: "19:00–21:00",
  description: "",
};
const emptySession = {
  series_id: "",
  title: "",
  week_start: "",
  week_end: "",
  summary: "",
  starts_at: "",
  order_index: 0,
  visibility: "public" as Visibility,
};
const emptyResource = {
  session_id: "",
  title: "",
  description: "",
  resource_type: "link",
  url: "",
  youtube_url: "",
  visibility: "member" as Visibility,
};

export default function CoursesAdminPage() {
  const [seriesList, setSeriesList] = useState<CourseSeries[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [newSessionSeriesId, setNewSessionSeriesId] = useState<string | null>(
    null,
  );
  const [editor, setEditor] = useState<Editor>(null);
  const [seriesForm, setSeriesForm] = useState(emptySeries);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [collapsedSeriesIds, setCollapsedSeriesIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const resourceEditorRef = useRef<HTMLDivElement>(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/course-library", {
        credentials: "include",
      });
      const data = response.status === 204 ? {} : await response.json();
      if (!response.ok)
        throw new Error(readError(data.detail, "無法讀取課程資料"));
      const next = data as CourseSeries[];
      setSeriesList(next);
      setSelectedSessionId((current) =>
        next.some((series) =>
          series.sessions.some((session) => session.id === current),
        )
          ? current
          : (next[0]?.sessions[0]?.id ?? null),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "無法讀取課程資料",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    if (editor === "resource") {
      resourceEditorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [editor]);

  const selectedSession = useMemo(
    () =>
      seriesList
        .flatMap((series) => series.sessions)
        .find((session) => session.id === selectedSessionId) ?? null,
    [seriesList, selectedSessionId],
  );
  const selectedSeries = selectedSession
    ? (seriesList.find((series) => series.id === selectedSession.series_id) ??
      null)
    : null;
  const newSessionSeries = newSessionSeriesId
    ? (seriesList.find((series) => series.id === newSessionSeriesId) ?? null)
    : null;

  function openNewSeries() {
    setSeriesForm(emptySeries);
    setEditor("series");
    setError("");
  }

  function toggleSeries(seriesId: string) {
    setCollapsedSeriesIds((current) => {
      const next = new Set(current);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  }

  function openNewSession(series: CourseSeries) {
    setSessionForm({
      ...emptySession,
      series_id: series.id,
      week_start: String(series.sessions.length + 1),
      order_index: series.sessions.length + 1,
    });
    setSelectedSessionId(null);
    setNewSessionSeriesId(series.id);
    setEditor(null);
    setError("");
  }

  function openNewResource(session: CourseSession) {
    setResourceForm({ ...emptyResource, session_id: session.id });
    setEditor("resource");
    setError("");
  }

  async function submitSeries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEditor("/api/v1/admin/course-series", "POST", seriesForm);
  }

  async function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEditor("/api/v1/admin/course-sessions", "POST", {
      ...sessionForm,
      week_label: formatWeekLabel(sessionForm.week_start, sessionForm.week_end),
      starts_at: new Date(`${sessionForm.starts_at}T12:00:00`).toISOString(),
    });
    setNewSessionSeriesId(null);
  }

  async function submitResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEditor("/api/v1/admin/resources", "POST", {
      ...resourceForm,
      url:
        resourceForm.resource_type === "link" ? resourceForm.url || null : null,
      youtube_url:
        resourceForm.resource_type === "video"
          ? resourceForm.youtube_url || null
          : null,
    });
  }

  async function uploadResourceImage(
    event: ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void,
  ) {
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
      onUploaded(data.url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "圖片上傳失敗");
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveEditor(
    url: string,
    method: "POST" | "PUT" | "DELETE",
    payload: object,
    closeEditor = true,
  ) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = response.status === 204 ? {} : await response.json();
      if (!response.ok)
        throw new Error(readError(data.detail, "無法儲存課程資料"));
      if (closeEditor) setEditor(null);
      await loadLibrary();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "無法儲存課程資料",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateSeriesDraft(seriesId: string, changes: Partial<CourseSeries>) {
    setSeriesList((current) =>
      current.map((series) =>
        series.id === seriesId ? { ...series, ...changes } : series,
      ),
    );
  }

  function updateSessionDraft(
    sessionId: string,
    changes: Partial<CourseSession>,
  ) {
    setSeriesList((current) =>
      current.map((series) => ({
        ...series,
        sessions: series.sessions.map((session) =>
          session.id === sessionId ? { ...session, ...changes } : session,
        ),
      })),
    );
  }

  function updateResourceDraft(
    sessionId: string,
    resourceId: string,
    changes: Partial<Resource>,
  ) {
    setSeriesList((current) =>
      current.map((series) => ({
        ...series,
        sessions: series.sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                resources: session.resources.map((resource) =>
                  resource.id === resourceId
                    ? { ...resource, ...changes }
                    : resource,
                ),
              }
            : session,
        ),
      })),
    );
  }

  async function saveSeriesInline(series: CourseSeries) {
    await saveEditor(
      `/api/v1/admin/course-series/${series.id}`,
      "PUT",
      {
        title: series.title,
        semester: series.semester,
        track: series.track,
        time: series.time,
        description: series.description,
      },
      false,
    );
  }

  async function deleteSeries(series: CourseSeries) {
    if (
      !window.confirm(
        `確定要刪除「${series.title}」嗎？這條路線底下的課堂與資源也會一起刪除。`,
      )
    )
      return;
    await saveEditor(
      `/api/v1/admin/course-series/${series.id}`,
      "DELETE",
      {},
      false,
    );
  }

  async function deleteSession(session: CourseSession) {
    if (
      !window.confirm(
        `確定要刪除「${session.title}」嗎？這堂課底下的資源與影片也會一起刪除。`,
      )
    )
      return;
    await saveEditor(
      `/api/v1/admin/course-sessions/${session.id}`,
      "DELETE",
      {},
      false,
    );
  }

  async function saveSessionInline(session: CourseSession) {
    await saveEditor(
      `/api/v1/admin/course-sessions/${session.id}`,
      "PUT",
      {
        series_id: session.series_id,
        title: session.title,
        week_label: session.week_label,
        summary: session.summary,
        starts_at: new Date(
          `${toLocalDate(session.starts_at)}T12:00:00`,
        ).toISOString(),
        order_index: session.order_index,
        visibility: session.visibility,
      },
      false,
    );
  }

  async function saveResourceInline(resource: Resource) {
    await saveEditor(
      `/api/v1/admin/resources/${resource.id}`,
      "PUT",
      {
        session_id: resource.session_id,
        title: resource.title,
        description: resource.description,
        resource_type: resource.resource_type,
        url: resource.url || null,
        youtube_url: resource.youtube_url || null,
        visibility: resource.visibility,
      },
      false,
    );
  }

  async function deleteResource(resource: Resource) {
    if (!window.confirm(`確定要刪除「${resource.title}」嗎？`)) return;
    await saveEditor(
      `/api/v1/admin/resources/${resource.id}`,
      "DELETE",
      {},
      false,
    );
  }

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">管理後台</p>
            <h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">
              社課與資源
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              以每堂社課為單位管理資源、影片、程式與附件；上課日可依需求設定。
            </p>
          </div>
          <button
            onClick={openNewSeries}
            className="button-25d inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 font-bold"
          >
            <Plus size={18} />
            新增課程路線
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

        {editor === "series" && (
          <EditorShell title="新增課程路線" onClose={() => setEditor(null)}>
            <form
              onSubmit={submitSeries}
              className="grid min-w-0 gap-5 md:grid-cols-2"
            >
              <Field label="路線名稱">
                <input
                  required
                  maxLength={200}
                  value={seriesForm.title}
                  onChange={(event) =>
                    setSeriesForm({ ...seriesForm, title: event.target.value })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="學期">
                <input
                  required
                  maxLength={30}
                  value={seriesForm.semester}
                  onChange={(event) =>
                    setSeriesForm({
                      ...seriesForm,
                      semester: event.target.value,
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="上課日">
                <select
                  value={seriesForm.track}
                  onChange={(event) =>
                    setSeriesForm({
                      ...seriesForm,
                      track: event.target.value as Track,
                    })
                  }
                  className="input-admin"
                >
                  <option value="monday">星期一</option>
                  <option value="tuesday">星期二</option>
                  <option value="wednesday">星期三</option>
                  <option value="thursday">星期四</option>
                  <option value="friday">星期五</option>
                  <option value="saturday">星期六</option>
                  <option value="sunday">星期日</option>
                </select>
              </Field>
              <Field label="上課時間">
                <input
                  required
                  maxLength={50}
                  value={seriesForm.time}
                  onChange={(event) =>
                    setSeriesForm({ ...seriesForm, time: event.target.value })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="路線簡介">
                <textarea
                  required
                  rows={3}
                  value={seriesForm.description}
                  onChange={(event) =>
                    setSeriesForm({
                      ...seriesForm,
                      description: event.target.value,
                    })
                  }
                  className="input-admin py-3"
                />
              </Field>
              <SubmitRow saving={saving} onCancel={() => setEditor(null)} />
            </form>
          </EditorShell>
        )}

        {editor === "session" && (
          <EditorShell title="新增課堂" onClose={() => setEditor(null)}>
            <form
              onSubmit={submitSession}
              className="grid min-w-0 gap-5 md:grid-cols-2"
            >
              <Field label="所屬路線">
                <select
                  required
                  value={sessionForm.series_id}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      series_id: event.target.value,
                    })
                  }
                  className="input-admin"
                >
                  {seriesList.map((series) => (
                    <option key={series.id} value={series.id}>
                      {trackLabel(series.track)}｜{series.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="課堂名稱">
                <input
                  required
                  maxLength={200}
                  value={sessionForm.title}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      title: event.target.value,
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="開始週次">
                <input
                  required
                  min={1}
                  type="number"
                  value={sessionForm.week_start}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      week_start: event.target.value,
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="結束週次" required={false}>
                <input
                  min={Number(sessionForm.week_start) || 1}
                  type="number"
                  value={sessionForm.week_end}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      week_end: event.target.value,
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="上課日期">
                <input
                  required
                  type="date"
                  value={sessionForm.starts_at}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      starts_at: event.target.value,
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="顯示順序">
                <input
                  required
                  min={0}
                  type="number"
                  value={sessionForm.order_index}
                  onChange={(event) =>
                    setSessionForm({
                      ...sessionForm,
                      order_index: Number(event.target.value),
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="課堂權限">
                <SessionVisibilitySelect
                  value={sessionForm.visibility}
                  onChange={(visibility) =>
                    setSessionForm({ ...sessionForm, visibility })
                  }
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="課堂摘要">
                  <textarea
                    required
                    maxLength={500}
                    rows={3}
                    value={sessionForm.summary}
                    onChange={(event) =>
                      setSessionForm({
                        ...sessionForm,
                        summary: event.target.value,
                      })
                    }
                    className="input-admin py-3"
                  />
                </Field>
              </div>
              <SubmitRow saving={saving} onCancel={() => setEditor(null)} />
            </form>
          </EditorShell>
        )}

        {editor === "resource" && !selectedSession && (
          <EditorShell title="新增課程內容" onClose={() => setEditor(null)}>
            <form
              onSubmit={submitResource}
              className="grid min-w-0 gap-5 md:grid-cols-2"
            >
              <Field label="內容名稱">
                <input
                  required
                  maxLength={200}
                  value={resourceForm.title}
                  onChange={(event) =>
                    setResourceForm({
                      ...resourceForm,
                      title: event.target.value,
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="內容類型">
                <select
                  value={resourceForm.resource_type}
                  onChange={(event) =>
                    setResourceForm({
                      ...resourceForm,
                      resource_type: event.target.value,
                      url:
                        event.target.value === "link" || event.target.value === "article" || event.target.value === "image" ? resourceForm.url : "",
                      youtube_url:
                        event.target.value === "video"
                          ? resourceForm.youtube_url
                          : "",
                    })
                  }
                  className="input-admin"
                >
                  <option value="link">連結</option>
                  <option value="article">文章</option>
                  <option value="image">圖片</option>
                  <option value="video">YouTube 影片</option>
                </select>
              </Field>
              {resourceForm.resource_type === "video" ? (
                <Field key="youtube-url" label="YouTube 網址">
                  <input
                    required
                    type="url"
                    value={resourceForm.youtube_url}
                    onChange={(event) =>
                      setResourceForm({
                        ...resourceForm,
                        youtube_url: event.target.value,
                      })
                    }
                    className="input-admin"
                  />
                </Field>
              ) : (
                <Field key="link-url" label={resourceForm.resource_type === "image" ? "圖片網址" : "連結網址"}>
                  <div className="flex gap-2">
                    <input required type="url" value={resourceForm.url} onChange={(event) => setResourceForm({ ...resourceForm, url: event.target.value })} className="input-admin min-w-0 flex-1" />
                    {resourceForm.resource_type === "image" && <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-bold text-accent hover:bg-surface-raised has-disabled:cursor-not-allowed has-disabled:opacity-50"><ImagePlus size={17} />{uploadingImage ? "上傳中…" : "上傳"}<input type="file" accept="image/*" disabled={uploadingImage} onChange={(event) => void uploadResourceImage(event, (url) => setResourceForm((current) => ({ ...current, url })))} className="sr-only" /></label>}
                  </div>
                </Field>
              )}
              <Field label="內容權限">
                <VisibilitySelect
                  value={resourceForm.visibility}
                  onChange={(visibility) =>
                    setResourceForm({ ...resourceForm, visibility })
                  }
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="內容說明">
                  <textarea
                    required
                    rows={3}
                    value={resourceForm.description}
                    onChange={(event) =>
                      setResourceForm({
                        ...resourceForm,
                        description: event.target.value,
                      })
                    }
                    className="input-admin py-3"
                  />
                </Field>
              </div>
              <SubmitRow saving={saving} onCancel={() => setEditor(null)} />
            </form>
          </EditorShell>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => void loadLibrary()}
            className="inline-flex min-h-11 items-center gap-2 px-3 font-bold"
          >
            <RefreshCw size={17} />
            重新整理
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
            <LoaderCircle className="animate-spin" />
            正在讀取課程…
          </div>
        ) : seriesList.length === 0 ? (
          <div className="mt-5 border border-border bg-surface p-10 text-center text-muted-foreground">
            尚未建立課程路線，請先新增。
          </div>
        ) : (
          <div className="mt-3 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
            <div className="grid content-start gap-5">
              {seriesList.map((series) => (
                <section
                  key={series.id}
                  className="border border-border bg-surface p-5"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-5">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSeries(series.id)}
                        aria-expanded={!collapsedSeriesIds.has(series.id)}
                        aria-controls={`series-content-${series.id}`}
                        className="inline-flex min-h-11 items-center gap-3 text-left"
                      >
                        <span
                          className={`inline-flex border px-2 py-1 text-xs font-bold ${isEvenWeekday(series.track) ? "border-primary text-primary" : "border-accent text-accent"}`}
                        >
                          {series.title || "未命名路線"}
                        </span>
                        <ChevronDown
                          size={18}
                          aria-hidden="true"
                          className={`text-muted-foreground transition-transform ${collapsedSeriesIds.has(series.id) ? "-rotate-90" : ""}`}
                        />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openNewSession(series)}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-border px-3 text-sm font-bold"
                    >
                      <CalendarPlus size={16} />
                      新增課堂
                    </button>
                  </div>
                  <div
                    id={`series-content-${series.id}`}
                    hidden={collapsedSeriesIds.has(series.id)}
                  >
                    <div className="grid gap-4 border-b border-border py-5 sm:grid-cols-2">
                      <Field label="路線名稱">
                        <input
                          value={series.title}
                          onChange={(event) =>
                            updateSeriesDraft(series.id, {
                              title: event.target.value,
                            })
                          }
                          className="input-admin"
                        />
                      </Field>
                      <Field label="學期">
                        <input
                          value={series.semester}
                          onChange={(event) =>
                            updateSeriesDraft(series.id, {
                              semester: event.target.value,
                            })
                          }
                          className="input-admin"
                        />
                      </Field>
                      <Field label="上課日">
                        <select
                          value={series.track}
                          onChange={(event) =>
                            updateSeriesDraft(series.id, {
                              track: event.target.value as Track,
                            })
                          }
                          className="input-admin"
                        >
                          <option value="monday">星期一</option>
                          <option value="tuesday">星期二</option>
                          <option value="wednesday">星期三</option>
                          <option value="thursday">星期四</option>
                          <option value="friday">星期五</option>
                          <option value="saturday">星期六</option>
                          <option value="sunday">星期日</option>
                        </select>
                      </Field>
                      <Field label="上課時間">
                        <input
                          required
                          maxLength={50}
                          value={series.time}
                          onChange={(event) =>
                            updateSeriesDraft(series.id, {
                              time: event.target.value,
                            })
                          }
                          className="input-admin"
                        />
                      </Field>
                      <Field label="路線簡介">
                        <textarea
                          rows={2}
                          value={series.description}
                          onChange={(event) =>
                            updateSeriesDraft(series.id, {
                              description: event.target.value,
                            })
                          }
                          className="input-admin py-3"
                        />
                      </Field>
                    <div className="flex justify-between gap-3 sm:col-span-2">
                      <button
                        disabled={saving}
                        onClick={() => void deleteSeries(series)}
                        className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                        刪除路線
                      </button>
                      <button
                        disabled={saving}
                        onClick={() => void saveSeriesInline(series)}
                        className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save size={17} />
                        儲存路線
                      </button>
                    </div>
                    </div>
                    <div className="mt-5 grid gap-2">
                      {series.sessions.length === 0 ? (
                        <p className="border-t border-border py-5 text-sm text-muted-foreground">
                          這條路線還沒有課堂。
                        </p>
                      ) : (
                        series.sessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSessionId(session.id)}
                            className={`grid min-h-16 w-full grid-cols-[5rem_1fr_auto] items-center gap-3 border p-3 text-left transition-colors ${selectedSessionId === session.id ? "border-accent bg-accent/10" : "border-border hover:bg-background"}`}
                          >
                            <span className="font-mono text-xs text-muted-foreground">
                              {session.week_label}
                            </span>
                            <span>
                              <span className="block font-bold">
                                {session.title}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {session.resources.length} 項內容
                              </span>
                            </span>
                            <span className="text-xs font-bold text-accent">
                              管理
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <aside className="border border-border bg-surface p-5 xl:sticky xl:top-6 xl:self-start">
              {newSessionSeries ? (
                <NewSessionForm
                  series={newSessionSeries}
                  form={sessionForm}
                  setForm={setSessionForm}
                  saving={saving}
                  onSubmit={submitSession}
                  onCancel={() => setNewSessionSeriesId(null)}
                />
              ) : selectedSession && selectedSeries ? (
                <>
                  <div className="border-b border-border pb-5">
                    <p className="mb-4 text-xs font-bold text-muted-foreground">
                      {trackLabel(selectedSeries.track)} · {selectedSeries.title}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="週次">
                        <input
                          value={selectedSession.week_label}
                          onChange={(event) =>
                            updateSessionDraft(selectedSession.id, {
                              week_label: event.target.value,
                            })
                          }
                          className="input-admin"
                        />
                      </Field>
                      <Field label="上課日期">
                        <input
                          type="date"
                          value={toLocalDate(selectedSession.starts_at)}
                          onChange={(event) =>
                            updateSessionDraft(selectedSession.id, {
                              starts_at: event.target.value,
                            })
                          }
                          className="input-admin"
                        />
                      </Field>
                      <Field label="課堂名稱">
                        <input
                          value={selectedSession.title}
                          onChange={(event) =>
                            updateSessionDraft(selectedSession.id, {
                              title: event.target.value,
                            })
                          }
                          className="input-admin"
                        />
                      </Field>
                      <Field label="顯示順序">
                        <input
                          min={0}
                          type="number"
                          value={selectedSession.order_index}
                          onChange={(event) =>
                            updateSessionDraft(selectedSession.id, {
                              order_index: Number(event.target.value),
                            })
                          }
                          className="input-admin"
                        />
                      </Field>
                      <Field label="課堂權限">
                        <SessionVisibilitySelect
                          value={selectedSession.visibility}
                          onChange={(visibility) =>
                            updateSessionDraft(selectedSession.id, {
                              visibility,
                            })
                          }
                        />
                      </Field>
                      <Field label="課堂摘要">
                        <textarea
                          rows={2}
                          value={selectedSession.summary}
                          onChange={(event) =>
                            updateSessionDraft(selectedSession.id, {
                              summary: event.target.value,
                            })
                          }
                          className="input-admin py-3"
                        />
                      </Field>
                    </div>
                    <div className="mt-4 flex justify-between gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void deleteSession(selectedSession)}
                        className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                        刪除課堂
                      </button>
                      <button
                        disabled={saving}
                        onClick={() => void saveSessionInline(selectedSession)}
                        className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save size={17} />
                        儲存課堂
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-b border-border pb-3">
                    <p className="font-bold">資源</p>
                    <button
                      onClick={() => openNewResource(selectedSession)}
                      className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-bold text-accent"
                    >
                      <Plus size={17} />
                      新增內容
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {selectedSession.resources.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        這堂課還沒有資源或影片。
                      </p>
                    ) : (
                      selectedSession.resources.map((resource) => (
                        <article
                          key={resource.id}
                          className="border border-border bg-background p-4"
                        >
                          <div className="mb-4 flex items-center gap-3">
                            {resource.resource_type === "video" ? (
                              <Film
                                className="shrink-0 text-primary"
                                size={19}
                              />
                            ) : (
                              <BookOpen
                                className="shrink-0 text-accent"
                                size={19}
                              />
                            )}
                          </div>
                          <div className="grid gap-4">
                            <Field label="內容名稱">
                              <input
                                value={resource.title}
                                onChange={(event) =>
                                  updateResourceDraft(
                                    selectedSession.id,
                                    resource.id,
                                    { title: event.target.value },
                                  )
                                }
                                className="input-admin"
                              />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="內容類型">
                                <select
                                  value={resource.resource_type}
                                  onChange={(event) =>
                                    updateResourceDraft(
                                      selectedSession.id,
                                      resource.id,
                                      {
                                        resource_type: event.target.value,
                                        url:
                                          event.target.value === "link" || event.target.value === "article" || event.target.value === "image"
                                            ? resource.url
                                            : null,
                                        youtube_url:
                                          event.target.value === "video"
                                            ? resource.youtube_url
                                            : null,
                                      },
                                    )
                                  }
                                  className="input-admin"
                                >
                                  <option value="link">連結</option>
                                  <option value="article">文章</option>
                                  <option value="image">圖片</option>
                                  <option value="video">YouTube 影片</option>
                                </select>
                              </Field>
                              <Field label="內容權限">
                                <VisibilitySelect
                                  value={resource.visibility}
                                  onChange={(visibility) =>
                                    updateResourceDraft(
                                      selectedSession.id,
                                      resource.id,
                                      { visibility },
                                    )
                                  }
                                />
                              </Field>
                            </div>
                            {resource.resource_type === "video" ? (
                              <Field key="youtube-url" label="YouTube 網址">
                                <input
                                  required
                                  type="url"
                                  value={resource.youtube_url ?? ""}
                                  onChange={(event) =>
                                    updateResourceDraft(
                                      selectedSession.id,
                                      resource.id,
                                      {
                                        youtube_url: event.target.value || null,
                                      },
                                    )
                                  }
                                  className="input-admin"
                                />
                              </Field>
                            ) : (
                              <Field key="link-url" label={resource.resource_type === "image" ? "圖片網址" : "連結網址"}>
                                <div className="flex gap-2">
                                  <input required type="url" value={resource.url ?? ""} onChange={(event) => updateResourceDraft(selectedSession.id, resource.id, { url: event.target.value || null })} className="input-admin min-w-0 flex-1" />
                                  {resource.resource_type === "image" && <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-bold text-accent hover:bg-surface-raised has-disabled:cursor-not-allowed has-disabled:opacity-50"><ImagePlus size={17} />{uploadingImage ? "上傳中…" : "上傳"}<input type="file" accept="image/*" disabled={uploadingImage} onChange={(event) => void uploadResourceImage(event, (url) => updateResourceDraft(selectedSession.id, resource.id, { url }))} className="sr-only" /></label>}
                                </div>
                              </Field>
                            )}
                            <Field label="內容說明">
                              <textarea
                                rows={2}
                                value={resource.description}
                                onChange={(event) =>
                                  updateResourceDraft(
                                    selectedSession.id,
                                    resource.id,
                                    { description: event.target.value },
                                  )
                                }
                                className="input-admin py-3"
                              />
                            </Field>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void deleteResource(resource)}
                                className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={17} />
                                刪除
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  void saveResourceInline(resource)
                                }
                                className="inline-flex min-h-11 items-center gap-2 px-3 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Save size={17} />
                                儲存內容
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                    {editor === "resource" && (
                      <div ref={resourceEditorRef}>
                        <NewResourceForm
                          form={resourceForm}
                          setForm={setResourceForm}
                          saving={saving}
                          onSubmit={submitResource}
                          onCancel={() => setEditor(null)}
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground">
                  請從左側選擇一堂課管理資源與影片。
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

type SessionForm = typeof emptySession;
type ResourceForm = typeof emptyResource;

function NewResourceForm({
  form,
  setForm,
  saving,
  onSubmit,
  onCancel,
}: {
  form: ResourceForm;
  setForm: Dispatch<SetStateAction<ResourceForm>>;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="border-b border-border" />
      <Field label="內容名稱">
        <input
          autoFocus
          required
          maxLength={200}
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="input-admin"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="內容類型">
          <select
            value={form.resource_type}
            onChange={(event) =>
              setForm({
                ...form,
                resource_type: event.target.value,
                url: event.target.value === "link" ? form.url : "",
                youtube_url:
                  event.target.value === "video" ? form.youtube_url : "",
              })
            }
            className="input-admin"
          >
            <option value="link">連結</option>
            <option value="video">YouTube 影片</option>
          </select>
        </Field>
        <Field label="內容權限">
          <VisibilitySelect
            value={form.visibility}
            onChange={(visibility) => setForm({ ...form, visibility })}
          />
        </Field>
      </div>
      {form.resource_type === "video" ? (
        <Field key="youtube-url" label="YouTube 網址">
          <input
            required
            type="url"
            value={form.youtube_url}
            onChange={(event) =>
              setForm({ ...form, youtube_url: event.target.value })
            }
            className="input-admin"
          />
        </Field>
      ) : (
        <Field key="link-url" label="連結網址">
          <input
            required
            type="url"
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            className="input-admin"
          />
        </Field>
      )}
      <Field label="內容說明">
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          className="input-admin py-3"
        />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 px-4 font-bold"
        >
          取消
        </button>
        <button
          disabled={saving}
          className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Save size={17} />
          )}
          建立內容
        </button>
      </div>
    </form>
  );
}

function NewSessionForm({
  series,
  form,
  setForm,
  saving,
  onSubmit,
  onCancel,
}: {
  series: CourseSeries;
  form: SessionForm;
  setForm: Dispatch<SetStateAction<SessionForm>>;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold text-accent">新增課堂</p>
          <h2 className="mt-1 text-xl font-black">{series.title}</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="關閉新增課堂"
          className="grid size-11 place-items-center"
        >
          <X size={19} />
        </button>
      </div>
      <Field label="課堂名稱">
        <input
          required
          maxLength={200}
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="input-admin"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="開始週次">
          <input
            required
            min={1}
            type="number"
            value={form.week_start}
            onChange={(event) =>
              setForm({ ...form, week_start: event.target.value })
            }
            className="input-admin"
          />
        </Field>
        <Field label="結束週次" required={false}>
          <input
            min={Number(form.week_start) || 1}
            type="number"
            value={form.week_end}
            onChange={(event) =>
              setForm({ ...form, week_end: event.target.value })
            }
            className="input-admin"
          />
        </Field>
      </div>
      <Field label="上課日期">
        <input
          required
          type="date"
          value={form.starts_at}
          onChange={(event) =>
            setForm({ ...form, starts_at: event.target.value })
          }
          className="input-admin"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="顯示順序">
          <input
            required
            min={0}
            type="number"
            value={form.order_index}
            onChange={(event) =>
              setForm({ ...form, order_index: Number(event.target.value) })
            }
            className="input-admin"
          />
        </Field>
        <Field label="課堂權限">
          <SessionVisibilitySelect
            value={form.visibility}
            onChange={(visibility) => setForm({ ...form, visibility })}
          />
        </Field>
      </div>
      <Field label="課堂摘要">
        <textarea
          required
          maxLength={500}
          rows={3}
          value={form.summary}
          onChange={(event) =>
            setForm({ ...form, summary: event.target.value })
          }
          className="input-admin py-3"
        />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 px-4 font-bold"
        >
          取消
        </button>
        <button
          disabled={saving}
          className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Save size={17} />
          )}
          建立課堂
        </button>
      </div>
    </form>
  );
}

function formatWeekLabel(start: string, end: string) {
  return end && end !== start ? `第 ${start}–${end} 週` : `第 ${start} 週`;
}

function EditorShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <section className="mt-7 border border-border bg-surface p-5 shadow-[4px_5px_0_var(--color-shadow-soft)] md:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-accent">編輯區</p>
          <h2 className="mt-1 text-xl font-black">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉編輯區"
          className="grid size-11 place-items-center"
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required = true,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold">
      <span>
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function VisibilitySelect({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (value: Visibility) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Visibility)}
      className="input-admin"
    >
      <option value="public">公開</option>
      <option value="member">社員限定</option>
    </select>
  );
}

function SessionVisibilitySelect({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (value: Visibility) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Visibility)}
      className="input-admin"
    >
      <option value="public">公開</option>
      <option value="member">不公開</option>
    </select>
  );
}

function SubmitRow({
  saving,
  onCancel,
}: {
  saving: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 md:col-span-2">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-11 px-4 font-bold"
      >
        取消
      </button>
      <button
        disabled={saving}
        className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <LoaderCircle className="animate-spin" size={17} />
        ) : (
          <Save size={17} />
        )}
        建立
      </button>
    </div>
  );
}

function trackLabel(track: Track) {
  return (
    {
      monday: "星期一",
      tuesday: "星期二",
      wednesday: "星期三",
      thursday: "星期四",
      friday: "星期五",
      saturday: "星期六",
      sunday: "星期日",
    } as Record<Track, string>
  )[track];
}
function isEvenWeekday(track: Track) {
  return ({ monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 } as Record<Track, number>)[track] % 2 === 0;
}
function visibilityLabel(visibility: Visibility) {
  return visibility === "public" ? "公開" : "社員限定";
}
function resourceTypeLabel(type: string) {
  return (
    (
      {
        video: "YouTube 影片",
        link: "連結",
        image: "圖片",
      } as Record<string, string>
    )[type] ?? type
  );
}

function toLocalDate(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function readError(detail: unknown, fallback: string) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (
      first &&
      typeof first === "object" &&
      "msg" in first &&
      typeof first.msg === "string"
    )
      return first.msg;
  }
  return fallback;
}
