import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="border-b border-border bg-surface-raised p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <Link href="/" className="flex min-h-12 items-center px-3 text-xl font-black">NTUMaker</Link>
      <p className="px-3 pb-4 text-xs text-muted-foreground">管理後台</p>
      <AdminNav />
      <div className="mt-8 hidden rounded-xl border border-border bg-background p-3 lg:block"><p className="text-sm font-bold">admin@ntumaker.tw</p><p className="mt-1 text-xs text-muted-foreground">管理員</p></div>
    </aside>
    <div>{children}</div>
  </div>;
}
