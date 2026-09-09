"use client";

import dynamic from "next/dynamic";

// 頁面載入時就啟動 3D 元件的下載，不等到瀏覽器完成互動後才開始抓取。
const bottleCapScene = import("./bottle-cap-scene").then((module) => module.BottleCapScene);

const BottleCapScene = dynamic(
  () => bottleCapScene,
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
  return <BottleCapScene />;
}
