"use client";

import { useEffect, useState } from "react";

export function AdminAccount() {
  const [email, setEmail] = useState("正在讀取帳號…");

  useEffect(() => {
    void fetch("/api/v1/auth/me", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((user) => setEmail(user?.email ?? "管理員"))
      .catch(() => setEmail("管理員"));
  }, []);

  return <div className="mt-5 border-t border-border px-3 pt-4 lg:mt-8 lg:border lg:bg-background lg:p-3 lg:pt-3"><p className="break-all text-sm font-bold">{email}</p><p className="mt-1 text-xs text-muted-foreground">管理員</p></div>;
}
