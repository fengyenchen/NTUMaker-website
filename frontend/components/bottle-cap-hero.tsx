"use client";

import dynamic from "next/dynamic";

const BottleCapScene = dynamic(
  () => import("./bottle-cap-scene").then((module) => module.BottleCapScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[360px] place-items-center" role="status">
        <div className="border border-border bg-surface px-4 py-3 text-sm font-bold text-muted-foreground shadow-[3px_3px_0_var(--color-shadow-soft)]">
          載入中…
        </div>
      </div>
    ),
  },
);

export function BottleCapHero() {
  return <BottleCapScene />;
}
