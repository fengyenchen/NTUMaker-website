"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  FileImage,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";

type Post = {
  id: string;
  caption: string;
  platforms: string[];
  images: { image_name: string; image_url?: string | null }[];
  scheduled_at: string | null;
  status: string;
  error_message?: string | null;
};
const platformLabels = {
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
} as const;
const maxImageSize = 10 * 1024 * 1024;

export default function SocialAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([
    "instagram",
    "facebook",
    "threads",
  ]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    const response = await fetch("/api/v1/admin/social-posts", {
      credentials: "include",
    });
    if (response.ok) setPosts(await response.json());
  }, []);
  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const intent = String(
        new FormData(event.currentTarget as HTMLFormElement).get("intent") ??
          "draft",
      );
      if (intent === "scheduled" && !scheduledAt) {
        throw new Error("請先選擇排程時間");
      }
      if (images.length > 10) throw new Error("一次最多上傳 10 張照片");
      if (intent === "draft" && !caption.trim() && images.length === 0) {
        throw new Error("請至少填寫貼文文字或新增一張照片");
      }
      const response = await fetch("/api/v1/admin/social-posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          platforms,
          scheduled_at: scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null,
          status: intent === "scheduled" ? "scheduled" : "draft",
          images: [],
        }),
      });
      if (!response.ok)
        throw new Error(await readResponseError(response, "無法儲存社群貼文"));
      const data = await response.json();

      for (const image of images) {
        const formData = new FormData();
        formData.append("file", image);
        const uploadResponse = await fetch(
          `/api/v1/admin/social-posts/${data.id}/images`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );
        if (!uploadResponse.ok) {
          throw new Error(
            `草稿已儲存，但「${image.name}」上傳失敗：${await readResponseError(uploadResponse, "圖片上傳失敗")}`,
          );
        }
      }

      await loadPosts();
      setCaption("");
      setScheduledAt("");
      setImages([]);
      const fileInput = document.querySelector(
        "input[type=file]",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "無法儲存社群貼文",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removePost(id: string) {
    if (!window.confirm("確定要刪除這則社群草稿嗎？")) return;
    const response = await fetch(`/api/v1/admin/social-posts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok)
      setPosts((current) => current.filter((post) => post.id !== id));
  }

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm text-muted-foreground">管理後台</p>
        <h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">
          社群管理
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          準備圖文、選擇發布平台，並設定立即發布或排程。
        </p>
        {error && (
          <div
            role="alert"
            className="mt-6 border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive"
          >
            {error}
          </div>
        )}
        <section className="mt-7 border border-border bg-surface p-5 shadow-[4px_5px_0_var(--color-shadow-soft)] md:p-7">
          <h2 className="text-xl font-black">新增社群貼文</h2>
          <form noValidate onSubmit={submit} className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">
              貼文文字
              <textarea
                rows={8}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="w-full border border-border bg-background p-3 leading-7"
                placeholder="輸入要發布到社群平台的文字…"
              />
            </label>
            <section
              aria-labelledby="new-images-heading"
              className="grid gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="new-images-heading" className="text-sm font-bold">
                    照片（{images.length} / 10）
                  </h2>
                  {images.length > 1 && (
                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      拖曳照片或使用箭頭調整順序。
                    </p>
                  )}
                </div>
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-border px-3 text-sm font-bold transition-colors hover:bg-surface-raised has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                  <ImagePlus size={17} />
                  新增照片
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={saving || images.length >= 10}
                    className="sr-only"
                    onChange={(event) => {
                      const selected = Array.from(
                        event.target.files ?? [],
                      ).slice(0, 10 - images.length);
                      const oversized = selected.find(
                        (image) => image.size > maxImageSize,
                      );
                      if (oversized) {
                        setError(
                          `「${oversized.name}」超過 10 MB，請改用較小的照片。`,
                        );
                        event.target.value = "";
                        return;
                      }
                      setError("");
                      setImages((current) => [...current, ...selected]);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="text-sm font-normal text-muted-foreground">
                會先建立草稿或排程，成功後才上傳照片。每張不超過 10 MB。
              </p>
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      draggable
                      onDragStart={() => setDraggedImageIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (
                          draggedImageIndex !== null &&
                          draggedImageIndex !== index
                        ) {
                          setImages((current) =>
                            swap(current, draggedImageIndex, index),
                          );
                        }
                        setDraggedImageIndex(null);
                      }}
                      onDragEnd={() => setDraggedImageIndex(null)}
                      className={`border border-border bg-background p-2 ${draggedImageIndex === index ? "opacity-50" : ""}`}
                    >
                      <div className="flex aspect-5/4 items-center justify-center overflow-hidden bg-surface-raised">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={image.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <p
                        className="mt-2 flex min-h-5 min-w-0 items-center gap-1 truncate text-xs"
                        title="拖曳以調整順序"
                      >
                        <GripVertical
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                        {index + 1}. {image.name}
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            setImages((current) =>
                              swap(current, index, index - 1),
                            )
                          }
                          aria-label={`將第 ${index + 1} 張照片往前`}
                          className="flex min-h-9 w-full items-center justify-center border border-border disabled:opacity-30"
                        >
                          <ArrowLeft size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={index === images.length - 1}
                          onClick={() =>
                            setImages((current) =>
                              swap(current, index, index + 1),
                            )
                          }
                          aria-label={`將第 ${index + 1} 張照片往後`}
                          className="flex min-h-9 w-full items-center justify-center border border-border disabled:opacity-30"
                        >
                          <ArrowRight size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                          aria-label={`刪除第 ${index + 1} 張照片`}
                          className="flex min-h-9 w-full items-center justify-center border border-destructive text-destructive transition-colors hover:bg-destructive hover:text-on-primary"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <fieldset>
              <legend className="text-sm font-bold">發布平台</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {Object.entries(platformLabels).map(([value, label]) => (
                  <label
                    key={value}
                    className="inline-flex min-h-11 items-center gap-2 border border-border px-3"
                  >
                    <input
                      type="checkbox"
                      checked={platforms.includes(value)}
                      onChange={(event) =>
                        setPlatforms((current) =>
                          event.target.checked
                            ? [...current, value]
                            : current.filter((item) => item !== value),
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-bold">
              排程時間
              <span className="flex min-h-11 items-center gap-2 border border-border bg-background px-3">
                <CalendarClock size={17} />
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </span>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                name="intent"
                value="draft"
                disabled={saving || platforms.length === 0}
                className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Plus size={17} />
                )}
                儲存草稿
              </button>
              <button
                name="intent"
                value="scheduled"
                disabled={saving || platforms.length === 0}
                className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50"
              >
                <CalendarClock size={17} /> 建立排程
              </button>
            </div>
          </form>
        </section>
        <section className="mt-8 border border-border bg-surface">
          <div className="border-b border-border p-5">
            <h2 className="font-black">草稿與排程</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              排程到期後會由後端自動嘗試發布，並回寫成功或失敗狀態。
            </p>
          </div>
          <div className="divide-y divide-border">
            {posts.length ? (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="group relative flex flex-col gap-4 p-5 transition-colors hover:bg-surface-raised md:flex-row md:items-center md:justify-between"
                >
                  <Link
                    href={`/admin/social/${post.id}`}
                    aria-label={`預覽與編輯：${post.caption}`}
                    className="absolute inset-0 z-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                  />
                  <div className="pointer-events-none relative z-10 min-w-0 flex-1">
                    <p className="line-clamp-2 font-bold">{post.caption}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {post.platforms
                        .map(
                          (platform) =>
                            platformLabels[
                              platform as keyof typeof platformLabels
                            ] ?? platform,
                        )
                        .join("、")}{" "}
                      · {post.images?.length ?? 0} 張照片 ·{" "}
                      {post.status === "scheduled"
                        ? `排程 ${post.scheduled_at ? formatDate(post.scheduled_at) : "尚未設定"}`
                        : post.status === "published"
                          ? "已發布"
                          : post.status === "failed"
                            ? `發布失敗${post.error_message ? ` · ${post.error_message}` : ""}`
                            : post.scheduled_at
                              ? `草稿 · 更新時間 ${formatDate(post.scheduled_at)}`
                              : "草稿"}
                    </p>
                  </div>
                  <button
                    onClick={() => void removePost(post.id)}
                    className="relative z-10 inline-flex min-h-11 items-center gap-2 self-start rounded-md bg-surface border border-destructive px-3 font-bold text-destructive transition-colors hover:bg-destructive hover:text-on-primary focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <Trash2 size={17} /> 刪除
                  </button>
                </article>
              ))
            ) : (
              <p className="p-8 text-center text-muted-foreground">
                目前沒有草稿或排程。
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function swap<T>(items: T[], first: number, second: number) {
  const next = [...items];
  [next[first], next[second]] = [next[second], next[first]];
  return next;
}

async function readResponseError(response: Response, fallback: string) {
  const body = await response.text();
  try {
    const data = JSON.parse(body) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
  } catch {
    // Some proxies return a plain-text or HTML error page instead of JSON.
  }
  return body.trim() || fallback;
}
