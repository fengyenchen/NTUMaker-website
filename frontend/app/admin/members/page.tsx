"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CalendarCheck2,
  LoaderCircle,
  Plus,
  RefreshCw,
  UserRoundCheck,
  X,
} from "lucide-react";

type Member = {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  roles: string[];
  membership_starts_at: string | null;
  membership_expires_at: string | null;
};

const initialForm = {
  email: "",
  display_name: "",
  expires_at: "",
};

function taipeiToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export default function MembersAdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [expiryDrafts, setExpiryDrafts] = useState<Record<string, string>>({});

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/users", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法讀取社員名單");
      setMembers(
        data.filter((member: Member) => !member.roles.includes("admin")),
      );
      setExpiryDrafts(
        Object.fromEntries(
          data.map((member: Member) => [
            member.id,
            member.membership_expires_at ?? "",
          ]),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "無法讀取社員名單",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          display_name: form.display_name || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法新增社員");
      setMembers((current) =>
        [...current, data].sort((a, b) => a.email.localeCompare(b.email)),
      );
      setExpiryDrafts((current) => ({
        ...current,
        [data.id]: data.membership_expires_at ?? "",
      }));
      setForm(initialForm);
      setShowForm(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "無法新增社員",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateMember(
    member: Member,
    changes: Partial<Pick<Member, "is_active">> & { expires_at?: string },
  ) {
    setError("");
    try {
      const response = await fetch(`/api/v1/admin/users/${member.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法更新社員資料");
      setMembers((current) =>
        current.map((item) => (item.id === member.id ? data : item)),
      );
      if (data.membership_expires_at)
        setExpiryDrafts((current) => ({
          ...current,
          [member.id]: data.membership_expires_at,
        }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "無法更新社員資料",
      );
    }
  }

  return (
    <main className="px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">管理後台</p>
            <h1 className="mt-1 text-3xl font-black leading-[1.1] tracking-tight">
              社員管理
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              管理社員 Email、資格期限與帳號狀態。
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="button-25d inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-bold"
          >
            <Plus size={18} />
            新增社員
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

        {showForm && (
          <section className="mt-7 border border-border bg-surface p-5 shadow-[4px_5px_0_var(--color-shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">新增社員</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  社員會使用這個 Email 直接核對資格並登入。
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                aria-label="關閉新增社員表單"
                className="grid size-11 place-items-center"
              >
                <X size={19} />
              </button>
            </div>
            <form
              onSubmit={createMember}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <Field label="Email">
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3"
                />
              </Field>
              <Field label="顯示名稱">
                <input
                  value={form.display_name}
                  onChange={(event) =>
                    setForm({ ...form, display_name: event.target.value })
                  }
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3"
                />
              </Field>
              <Field label="開始日期">
                <output className="flex min-h-11 items-center border border-border bg-surface-raised px-3 font-mono font-normal text-muted-foreground">
                  {taipeiToday()}（自動）
                </output>
              </Field>
              <Field label="結束日期">
                <input
                  required
                  type="date"
                  min={taipeiToday()}
                  value={form.expires_at}
                  onChange={(event) =>
                    setForm({ ...form, expires_at: event.target.value })
                  }
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3"
                />
              </Field>
              <div></div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="min-h-11 px-4 font-bold"
                >
                  取消
                </button>
                <button
                  disabled={saving}
                  className="button-25d inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle className="animate-spin" size={17} />
                  )}
                  建立社員
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8 overflow-hidden border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-black">社員名單</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                共 {members.length} 個帳號
              </p>
            </div>
            <button
              onClick={() => void loadMembers()}
              className="inline-flex min-h-11 items-center gap-2 px-3 font-bold"
            >
              <RefreshCw size={17} />
              重新整理
            </button>
          </div>
          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-muted-foreground">
              <LoaderCircle className="animate-spin" />
              正在讀取社員名單…
            </div>
          ) : members.length === 0 ? (
            <div className="min-h-52 p-8 text-center text-muted-foreground">
              目前沒有社員資料，可以從右上角新增第一位社員。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-background text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">社員</th>
                    <th className="px-5 py-3">開始日期</th>
                    <th className="px-5 py-3">結束日期</th>
                    <th className="px-5 py-3">狀態</th>
                    <th className="px-5 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const expiryDraft =
                      expiryDrafts[member.id] ??
                      member.membership_expires_at ??
                      "";
                    const expired = member.membership_expires_at
                      ? member.membership_expires_at < taipeiToday()
                      : true;
                    return (
                      <tr key={member.id} className="border-t border-border">
                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {member.display_name || "未設定名稱"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-mono">
                          {member.membership_starts_at ?? "未設定"}
                        </td>
                        <td className="px-5 py-4">
                          <label
                            className="sr-only"
                            htmlFor={`expiry-${member.id}`}
                          >
                            設定 {member.email} 的結束日期
                          </label>
                          <input
                            id={`expiry-${member.id}`}
                            type="date"
                            min={member.membership_starts_at ?? taipeiToday()}
                            value={expiryDraft}
                            onChange={(event) =>
                              setExpiryDrafts((current) => ({
                                ...current,
                                [member.id]: event.target.value,
                              }))
                            }
                            className="min-h-11 border border-border bg-background px-3 font-mono"
                          />
                          <p
                            className={`mt-1 text-xs ${expired ? "text-destructive" : "text-success"}`}
                          >
                            {expired ? "已到期" : "有效"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {member.is_active ? "啟用中" : "已停用"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              disabled={
                                !expiryDraft ||
                                expiryDraft === member.membership_expires_at
                              }
                              onClick={() =>
                                void updateMember(member, {
                                  expires_at: expiryDraft,
                                })
                              }
                              className="inline-flex min-h-11 items-center gap-1 border border-border px-3 font-bold disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <CalendarCheck2 size={16} />
                              儲存日期
                            </button>
                            <button
                              onClick={() =>
                                void updateMember(member, {
                                  is_active: !member.is_active,
                                })
                              }
                              className="inline-flex min-h-11 items-center gap-1 border border-border px-3 font-bold"
                            >
                              <UserRoundCheck size={16} />
                              {member.is_active ? "停用" : "啟用"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      <span>{label}</span>
      {children}
    </label>
  );
}
