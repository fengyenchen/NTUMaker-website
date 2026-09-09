import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="relative border-b border-border bg-surface-raised p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <h1 className="flex min-h-12 items-center px-3 text-xl font-black">NTUMaker</h1>
      <p className="px-3 pb-4 text-xs text-muted-foreground">管理後台</p>
      <AdminNav />
    </aside>
    <div className="min-w-0 overflow-x-hidden">{children}</div>
  </div>;
}
