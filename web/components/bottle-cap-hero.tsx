"use client";

import dynamic from "next/dynamic";

const BottleCapScene = dynamic(
  () => import("./bottle-cap-scene").then((module) => module.BottleCapScene),
  {
    ssr: false,
    loading: () => <div className="h-full min-h-[360px] animate-pulse rounded-full bg-surface" aria-label="正在載入瓶蓋模型" />,
  },
);

export function BottleCapHero() {
  return <BottleCapScene />;
}
