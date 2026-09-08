"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, FileImage, GripVertical, ImagePlus, LoaderCircle, Save, Trash2 } from "lucide-react";

type SocialImage = {
  id: string;
  image_name: string;
  image_url: string | null;
  file?: File;
};

type SocialPost = {
  id: string;
  caption: string;
  platforms: string[];
  scheduled_at: string | null;
  status: "draft" | "scheduled" | "published" | "failed";
  images: SocialImage[];
};

const platformLabels = {
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
} as const;

export default function SocialPostEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPost = useCallback(async () => {
    const { id } = await params;
    const response = await fetch(`/api/v1/admin/social-posts/${id}`, { credentials: "include" });
    if (!response.ok) {
      setError(await readResponseError(response, "無法載入社群貼文"));
      setLoading(false);
      return;
    }
    const data = (await response.json()) as SocialPost;
    setPost(data);
    setCaption(data.caption);
    setPlatforms(data.platforms);
    setScheduledAt(toDatetimeInput(data.scheduled_at));
    setDeletedImageIds([]);
    setLoading(false);
  }, [params]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  async function savePost(event: FormEvent) {
    event.preventDefault();
    if (!post) return;
    setSaving(true);
    setError("");
    try {
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const intent = submitter?.getAttribute("value") ?? "save";
      const targetStatus = intent === "convert"
        ? post.status === "scheduled" ? "draft" : "scheduled"
        : post.status;
      if (!caption.trim()) {
        throw new Error("請輸入貼文文字");
      }
      if (platforms.length === 0) {
        throw new Error("請至少選擇一個發布平台");
      }
      if (intent === "save" && post.status === "scheduled" && post.images.length === 0) {
        throw new Error("至少保留一張照片才能儲存");
      }
      if (targetStatus === "scheduled" && !scheduledAt) {
        throw new Error("請先選擇排程時間");
      }
      const scheduleTimestamp = scheduledAt ? new Date(scheduledAt).getTime() : Number.NaN;
      if (targetStatus === "scheduled" && (!Number.isFinite(scheduleTimestamp) || scheduleTimestamp <= Date.now())) {
        throw new Error("排程時間必須晚於現在");
      }
      const response = await fetch(`/api/v1/admin/social-posts/${post.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          platforms,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          status: targetStatus,
        }),
      });
      if (!response.ok) throw new Error(await readResponseError(response, "無法儲存變更"));

      const uploadedImages = new Map<string, SocialImage>();
      for (const image of post.images) {
        if (!image.file) continue;
        const formData = new FormData();
        formData.append("file", image.file);
        const imageResponse = await fetch(`/api/v1/admin/social-posts/${post.id}/images`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!imageResponse.ok) throw new Error(await readResponseError(imageResponse, "圖片上傳失敗"));
        uploadedImages.set(image.id, (await imageResponse.json()) as SocialImage);
      }

      for (const imageId of deletedImageIds) {
        const imageResponse = await fetch(`/api/v1/admin/social-posts/${post.id}/images/${imageId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!imageResponse.ok) throw new Error(await readResponseError(imageResponse, "圖片刪除失敗"));
      }

      const orderedImageIds = post.images.map((image) => uploadedImages.get(image.id)?.id ?? image.id);
      if (orderedImageIds.length > 0) {
        const orderResponse = await fetch(`/api/v1/admin/social-posts/${post.id}/images/order`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_ids: orderedImageIds }),
        });
        if (!orderResponse.ok) throw new Error(await readResponseError(orderResponse, "圖片順序儲存失敗"));
      }

      if (intent === "save" || intent === "convert") {
        router.push("/admin/social");
        return;
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "無法儲存變更");
    } finally {
      setSaving(false);
    }
  }

  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    if (!post) return;
    const selected = Array.from(event.target.files ?? []).slice(0, 10 - post.images.length);
    if (!selected.length) return;
    const oversized = selected.find((image) => image.size > 10 * 1024 * 1024);
    if (oversized) {
      setError(`「${oversized.name}」超過 10 MB，請改用較小的照片。`);
      event.target.value = "";
      return;
    }
    setError("");
    const pendingImages = selected.map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      image_name: file.name,
      image_url: URL.createObjectURL(file),
      file,
    }));
    setPost((current) => current ? { ...current, images: [...current.images, ...pendingImages] } : current);
    event.target.value = "";
  }

  function removeImage(image: SocialImage) {
    if (!post || !window.confirm(`確定要刪除「${image.image_name}」嗎？`)) return;
    if (image.file && image.image_url?.startsWith("blob:")) URL.revokeObjectURL(image.image_url);
    setPost((current) => current ? { ...current, images: current.images.filter((item) => item.id !== image.id) } : current);
    if (!image.file) setDeletedImageIds((current) => current.includes(image.id) ? current : [...current, image.id]);
  }

  function persistImageOrder(nextImages: SocialImage[]) {
    if (!post || saving) return;
    setPost((current) => current ? { ...current, images: nextImages } : current);
    setDraggedImageId(null);
  }

  function moveImage(imageId: string, targetId: string) {
    if (!post || imageId === targetId || saving) return;
    const images = [...post.images];
    const fromIndex = images.findIndex((image) => image.id === imageId);
    const toIndex = images.findIndex((image) => image.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, moved);
    void persistImageOrder(images);
  }

  function shiftImage(imageId: string, offset: -1 | 1) {
    if (!post || saving) return;
    const index = post.images.findIndex((image) => image.id === imageId);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= post.images.length) return;
    moveImage(imageId, post.images[targetIndex].id);
  }

  if (loading) {
    return <main className="px-5 py-8 text-muted-foreground md:px-10 md:py-10">載入中…</main>;
  }

  if (!post) {
    return (
      <main className="px-5 py-8 md:px-10 md:py-10">
        <p className="font-bold text-destructive">{error || "找不到社群貼文"}</p>
        <Link href="/admin/social" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-accent">
          <ArrowLeft size={17} /> 回到草稿與排程
        </Link>
      </main>
    );
  }

  const scheduleTimestamp = scheduledAt ? new Date(scheduledAt).getTime() : Number.NaN;
  const canConvertToSchedule = post.status === "scheduled"
    || (caption.trim().length > 0 && platforms.length > 0 && Number.isFinite(scheduleTimestamp) && scheduleTimestamp > Date.now());

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin/social" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent">
          <ArrowLeft size={17} /> 草稿與排程
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">社群管理</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">編輯</h1>
          </div>
          <span className="border border-border bg-surface-raised px-3 py-2 text-sm font-bold">
            {post.status === "scheduled" ? "排程貼文" : "草稿"}
          </span>
        </div>
        {error && <p role="alert" className="mt-5 border border-destructive bg-destructive/10 p-4 font-bold text-destructive">{error}</p>}

        <div className="mt-7 max-w-3xl">
          <form onSubmit={savePost} className="grid content-start self-start gap-5 border border-border bg-surface p-5 shadow-[4px_5px_0_var(--color-shadow-soft)] md:p-7">
            <h2 className="text-xl font-black">編輯內容</h2>
            <label className="grid gap-2 text-sm font-bold">
              貼文文字
              <textarea required rows={10} value={caption} onChange={(event) => setCaption(event.target.value)} className="w-full border border-border bg-background p-3 leading-7" />
            </label>
            <section aria-labelledby="images-heading" className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="images-heading" className="text-sm font-bold">照片（{post.images.length} / 10）</h2>
                  {post.images.length > 1 && <p className="mt-1 text-xs font-normal text-muted-foreground">拖曳照片或使用箭頭調整順序。</p>}
                </div>
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-bold transition-colors hover:bg-surface-raised has-disabled:cursor-not-allowed has-disabled:opacity-50">
                  {saving ? <LoaderCircle className="animate-spin" size={17} /> : <ImagePlus size={17} />}
                  新增照片
                  <input type="file" accept="image/*" multiple disabled={saving || post.images.length >= 10} onChange={addImages} className="sr-only" />
                </label>
              </div>
              {post.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {post.images.map((image) => (
                    <div
                      key={image.id}
                      draggable={!saving}
                      onDragStart={() => setDraggedImageId(image.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggedImageId) moveImage(draggedImageId, image.id);
                      }}
                      onDragEnd={() => setDraggedImageId(null)}
                      className={`border border-border bg-background p-2 ${draggedImageId === image.id ? "opacity-50" : ""}`}
                    >
                      {image.image_url ? (
                        <div className="flex aspect-5/4 items-center justify-center overflow-hidden bg-surface-raised p-2">
                          <img src={image.image_url} alt={image.image_name} className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : <div className="grid aspect-5/4 place-items-center bg-surface-raised p-2 text-center text-xs text-muted-foreground">{image.image_name}</div>}
                      <p className="mt-2 flex min-h-5 min-w-0 items-center gap-1 truncate text-xs" title="拖曳以調整順序"><GripVertical size={14} className="shrink-0 text-muted-foreground" />{image.image_name}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <button type="button" disabled={saving || post.images[0]?.id === image.id} onClick={() => shiftImage(image.id, -1)} aria-label={`將 ${image.image_name} 往前`} className="flex min-h-9 w-full items-center justify-center border border-border disabled:opacity-30"><ArrowLeft size={15} /></button>
                        <button type="button" disabled={saving || post.images[post.images.length - 1]?.id === image.id} onClick={() => shiftImage(image.id, 1)} aria-label={`將 ${image.image_name} 往後`} className="flex min-h-9 w-full items-center justify-center border border-border disabled:opacity-30"><ArrowRight size={15} /></button>
                        <button type="button" disabled={saving} onClick={() => removeImage(image)} aria-label={`刪除 ${image.image_name}`} className="flex min-h-9 w-full items-center justify-center border border-destructive text-destructive transition-colors hover:bg-destructive hover:text-on-primary disabled:opacity-50"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="flex items-center gap-2 border border-border bg-surface-raised p-3 text-sm text-muted-foreground"><FileImage size={17} /> 尚未上傳照片。</p>}
            </section>
            <fieldset>
              <legend className="text-sm font-bold">發布平台</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {Object.entries(platformLabels).map(([value, label]) => (
                  <label key={value} className="inline-flex min-h-11 items-center gap-2 border border-border px-3">
                    <input type="checkbox" checked={platforms.includes(value)} onChange={(event) => setPlatforms((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-bold">
              排程時間
              <span className="flex min-h-11 items-center gap-2 border border-border bg-background px-3">
                <CalendarClock size={17} />
                <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="w-full bg-transparent outline-none" />
              </span>
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" name="intent" value="save" disabled={saving || platforms.length === 0 || (post.status === "scheduled" && post.images.length === 0)} title={post.status === "scheduled" && post.images.length === 0 ? "排程貼文至少要保留一張照片才能儲存" : undefined} className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
                儲存
              </button>
              <button type="submit" name="intent" value="convert" disabled={saving || !canConvertToSchedule} className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:cursor-not-allowed disabled:opacity-50">
                <CalendarClock size={17} /> {post.status === "scheduled" ? "轉成草稿" : "轉成排程"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function toDatetimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

async function readResponseError(response: Response, fallback: string) {
  const body = await response.text();
  try {
    const data = JSON.parse(body) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
  } catch {
    // Reverse proxies can return text rather than a JSON error payload.
  }
  return body.trim() || fallback;
}
