"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.assign("/login");
    }
  }

  return <button type="button" disabled={loading} onClick={logout} className={`inline-flex min-h-11 items-center gap-2 font-bold disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>{loading ? "正在登出…" : "登出"}<LogOut size={16} aria-hidden="true" /></button>;
}
