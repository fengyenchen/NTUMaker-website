import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-5 py-16" aria-busy="true" aria-live="polite">
      <div className="inline-flex items-center gap-3 border border-border bg-surface px-5 py-4 text-sm font-bold text-muted-foreground shadow-[3px_3px_0_var(--color-shadow-soft)]">
        <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
        正在載入頁面…
      </div>
    </main>
  );
}
