import { HeartHandshake, Share2, Sparkles } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return <main><SiteHeader /><PageHero eyebrow="ABOUT / 關於" title="Build. Learn. Share." description="NTUMaker 致力於推廣創客文化。這裡不要求你一開始就會，而是希望每個人都能找到一起做東西、交換方法和完成作品的夥伴。" />
    <section className="px-5 pb-28 md:px-8"><div className="mx-auto grid max-w-[1320px] gap-7 md:grid-cols-3">{[
      { icon: Sparkles, title: "Build", text: "從真實問題出發，快速做出可以摸、可以測的版本。" },
      { icon: HeartHandshake, title: "Learn", text: "透過專案與工作坊，把陌生技術變成自己的能力。" },
      { icon: Share2, title: "Share", text: "記錄過程、分享失敗，讓下一個人可以從更好的地方開始。" },
    ].map((item,index)=>{const Icon=item.icon;return <article key={item.title} className={`min-h-80 rounded-2xl border border-border p-8 ${index===1?"bg-secondary text-on-secondary":"bg-surface"}`}><Icon size={32}/><h2 className="mt-20 text-4xl font-black">{item.title}</h2><p className={`mt-4 leading-7 ${index===1?"text-white/75":"text-muted-foreground"}`}>{item.text}</p></article>;})}</div></section><SiteFooter /></main>;
}
