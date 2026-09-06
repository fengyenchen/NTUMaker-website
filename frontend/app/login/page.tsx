"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [developmentToken, setDevelopmentToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "目前無法寄出登入連結");
      setMessage(data.message);
      setDevelopmentToken(data.development_token ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "目前無法寄出登入連結");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-7 shadow-[6px_7px_0_var(--color-shadow-soft)] md:p-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted-foreground"><ArrowLeft size={17} /> 回首頁</Link>
        <span className="mt-10 grid size-14 place-items-center rounded-2xl bg-secondary text-on-secondary"><Mail /></span>
        <h1 className="mt-7 text-4xl font-black tracking-tight">用 Email 登入</h1>
        <p className="mt-3 leading-7 text-muted-foreground">輸入社員登記的 Email，我們會寄一封一次性登入連結給你，不需要記密碼。</p>
        <form onSubmit={submit} className="mt-8">
          <label htmlFor="email" className="text-sm font-bold">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground placeholder:text-muted-foreground" />
          <button disabled={loading} className="button-25d mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-bold disabled:cursor-not-allowed disabled:opacity-50">{loading ? "正在處理…" : "寄送登入連結"} <Send size={17} /></button>
        </form>
        {message && <p role="status" className="mt-6 rounded-xl bg-background p-4 text-sm">{message}</p>}
        {developmentToken && <a className="mt-3 inline-flex min-h-11 items-center font-bold text-accent underline" href={`/api/v1/auth/verify?return_to=/learn&token=${encodeURIComponent(developmentToken)}`}>開發模式：直接驗證登入</a>}
      </div>
    </main>
  );
}
