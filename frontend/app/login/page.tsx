"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, Mail, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

type LoginMode = "member" | "admin";
type Feedback = { type: "success" | "error"; text: string } | null;

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("member");
  const [memberEmail, setMemberEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setFeedback(null);
  }

  async function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/v1/auth/member-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "目前無法登入社員學習區");
      window.location.assign(data.redirect_to ?? "/learn");
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "目前無法登入社員學習區" });
      setLoading(false);
    }
  }

  async function submitAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/v1/auth/admin-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "目前無法登入管理後台");
      window.location.assign(data.redirect_to ?? "/admin");
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "目前無法登入管理後台" });
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-xl border border-border bg-surface p-7 shadow-[6px_7px_0_var(--color-shadow-soft)] md:p-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted-foreground"><ArrowLeft size={17} aria-hidden="true" />回首頁</Link>

        <div className="mt-8 grid grid-cols-2 border border-border bg-background p-1" role="tablist" aria-label="選擇登入身分">
          <button type="button" role="tab" id="member-tab" aria-controls="member-panel" aria-selected={mode === "member"} onClick={() => switchMode("member")} className={`inline-flex min-h-12 items-center justify-center gap-2 px-3 font-bold transition-colors ${mode === "member" ? "bg-secondary text-on-secondary" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"}`}><UserRound size={18} aria-hidden="true" />社員</button>
          <button type="button" role="tab" id="admin-tab" aria-controls="admin-panel" aria-selected={mode === "admin"} onClick={() => switchMode("admin")} className={`inline-flex min-h-12 items-center justify-center gap-2 px-3 font-bold transition-colors ${mode === "admin" ? "bg-secondary text-on-secondary" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"}`}><ShieldCheck size={18} aria-hidden="true" />管理員</button>
        </div>

        {mode === "member" ? (
          <section id="member-panel" role="tabpanel" aria-labelledby="member-tab" className="pt-9">
            <span className="grid size-14 place-items-center rounded-xl bg-primary/15 text-primary"><Mail aria-hidden="true" /></span>
            <h1 className="mt-6 text-4xl font-black tracking-tight">社員 Email 登入</h1>
            <p className="mt-3 leading-7 text-muted-foreground">輸入社員資料庫中登記的 Email。帳號啟用且目前在資格期限內，就會直接進入社員學習區。</p>
            <form onSubmit={submitMember} className="mt-8">
              <label htmlFor="member-email" className="text-sm font-bold">Email</label>
              <input id="member-email" name="email" type="email" autoComplete="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="you@example.com" className="input-admin mt-2 min-h-12 px-4" />
              <button disabled={loading} className="button-25d mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-bold disabled:cursor-not-allowed disabled:opacity-50">{loading ? "正在核對社員資格…" : "進入社員學習區"}<LogIn size={17} aria-hidden="true" /></button>
            </form>
          </section>
        ) : (
          <section id="admin-panel" role="tabpanel" aria-labelledby="admin-tab" className="pt-9">
            <span className="grid size-14 place-items-center rounded-xl bg-secondary text-on-secondary"><LockKeyhole aria-hidden="true" /></span>
            <h1 className="mt-6 text-4xl font-black tracking-tight">管理員登入</h1>
            <p className="mt-3 leading-7 text-muted-foreground">登入後可管理社員、公告、學期課表、課堂內容與教材，未來也會在同一個後台加入文章與社群發布。</p>
            <form onSubmit={submitAdmin} className="mt-8 space-y-5">
              <div><label htmlFor="admin-email" className="text-sm font-bold">管理員 Email</label><input id="admin-email" name="email" type="email" autoComplete="username" required value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@example.com" className="input-admin mt-2 min-h-12 px-4" /></div>
              <div><label htmlFor="admin-password" className="text-sm font-bold">密碼</label><div className="relative mt-2"><input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" minLength={12} required value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className="input-admin min-h-12 px-4 pr-14" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "隱藏密碼" : "顯示密碼"} className="absolute inset-y-0 right-0 grid min-w-12 place-items-center text-muted-foreground">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div></div>
              <button disabled={loading} className="button-25d inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-bold disabled:cursor-not-allowed disabled:opacity-50">{loading ? "正在驗證…" : "進入管理後台"}<ShieldCheck size={17} aria-hidden="true" /></button>
            </form>
          </section>
        )}

        {feedback && <p role={feedback.type === "error" ? "alert" : "status"} className={`mt-6 border p-4 text-sm ${feedback.type === "error" ? "border-destructive bg-destructive/10 font-bold text-destructive" : "border-border bg-background"}`}>{feedback.text}</p>}
      </div>
    </main>
  );
}
