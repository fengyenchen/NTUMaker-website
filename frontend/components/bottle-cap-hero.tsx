"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const BottleCapScene = dynamic(
  () => import("./bottle-cap-scene").then((module) => module.BottleCapScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-90 place-items-center" role="status">
        <div className="border border-border bg-surface px-4 py-3 text-sm font-bold text-muted-foreground shadow-[3px_3px_0_var(--color-shadow-soft)]">
          載入中…
        </div>
      </div>
    ),
  },
);

export function BottleCapHero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = window.setTimeout(start, 300);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!ready) {
    return (
      <div className="grid h-full min-h-90 place-items-center" aria-label="瓶蓋模型準備中" role="status">
        <div className="border border-border bg-surface px-4 py-3 text-sm font-bold text-muted-foreground shadow-[3px_3px_0_var(--color-shadow-soft)]">
          準備瓶蓋模型…
        </div>
      </div>
    );
  }

  return <BottleCapScene />;
}
