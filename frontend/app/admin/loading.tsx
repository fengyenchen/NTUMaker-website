export default function AdminLoading() {
  return (
    <main className="px-5 py-8 md:px-10 md:py-10" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-20 animate-pulse bg-surface-raised" />
        <div className="mt-3 h-10 w-48 animate-pulse bg-surface-raised" />
        <div className="mt-3 h-5 w-80 max-w-full animate-pulse bg-surface-raised" />
        <section className="mt-9 border border-border bg-surface p-5 md:p-7">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="h-7 w-32 animate-pulse bg-surface-raised" />
            <div className="h-11 w-28 animate-pulse bg-surface-raised" />
          </div>
          <div className="grid gap-4 py-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse border border-border bg-background" />)}
          </div>
          <p className="border-t border-border pt-5 text-sm text-muted-foreground">正在讀取管理資料…</p>
        </section>
      </div>
    </main>
  );
}
