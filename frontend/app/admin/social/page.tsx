"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  FileImage,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";

type Post = {
  id: string;
  caption: string;
  platforms: string[];
  image_name: string | null;
  scheduled_at: string | null;
  status: string;
};
const platformLabels = {
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
} as const;

export default function SocialAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook", "threads"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [image, setImage] = useState<File | null>(null);
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
      const imageName = image?.name ?? null;
      const imageMimeType = image?.type ?? null;
      if (image) throw new Error("Cloudflare R2 尚未設定，照片功能暫時無法使用。請先完成 R2 設定。");
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
          image_name: imageName,
          image_mime_type: imageMimeType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法儲存社群貼文");
      setPosts((current) => [data, ...current]);
      setCaption("");
      setScheduledAt("");
      setImage(null);
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
          <form onSubmit={submit} className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">
              貼文文字
              <textarea
                required
                rows={8}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="w-full border border-border bg-background p-3 leading-7"
                placeholder="輸入要發布到社群平台的文字…"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              照片
              <span className="flex min-h-11 items-center gap-2 border border-border bg-background px-3 font-normal">
                <FileImage size={17} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setImage(event.target.files?.[0] ?? null)
                  }
                />
              </span>
            </label>
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
            <button
              disabled={saving || platforms.length === 0}
              className="button-25d inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <Plus size={17} />
              )}
              {scheduledAt ? "建立排程" : "儲存草稿"}
            </button>
          </form>
        </section>
        <section className="mt-8 border border-border bg-surface">
          <div className="border-b border-border p-5">
            <h2 className="font-black">草稿與排程</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              發布成功後，圖文內容會自動清除。
            </p>
          </div>
          <div className="divide-y divide-border">
            {posts.length ? (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
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
                      · {post.image_name ?? "未附照片"} ·{" "}
                      {post.scheduled_at
                        ? `排程 ${formatDate(post.scheduled_at)}`
                        : "草稿"}
                    </p>
                  </div>
                  <button
                    onClick={() => void removePost(post.id)}
                    className="inline-flex min-h-11 items-center gap-2 self-start font-bold text-destructive"
                  >
                    <Trash2 size={17} />
                    刪除
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
