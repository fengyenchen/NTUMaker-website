"use client";

import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";

export function AdminAccount() {
  const [email, setEmail] = useState("正在讀取帳號…");

  useEffect(() => {
    void fetch("/api/v1/auth/me", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((user) => setEmail(user?.email ?? "管理員"))
      .catch(() => setEmail("管理員"));
  }, []);

  return <div className="mt-8 hidden border border-border bg-background p-3 lg:block"><p className="break-all text-sm font-bold">{email}</p><p className="mt-1 text-xs text-muted-foreground">管理員</p><LogoutButton className="mt-2 text-xs text-muted-foreground" /></div>;
}
