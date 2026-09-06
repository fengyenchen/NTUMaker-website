import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, CircleCheck, Play } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export default function LearnPage() {
  return <main><SiteHeader /><section className="px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-[1320px]">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold text-primary">社員學習區</p><h1 className="mt-3 text-5xl font-black tracking-tight">歡迎回來，繼續動手做。</h1></div><div className="rounded-2xl border border-border bg-surface px-5 py-4"><p className="text-xs text-muted-foreground">社員資格</p><p className="mt-1 font-bold text-success">有效至 2027.01.31</p></div></div>
    <div className="mt-12 grid gap-7 lg:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-2xl bg-secondary p-8 text-on-secondary shadow-[6px_7px_0_rgba(23,38,63,0.82)] md:p-10"><p className="text-sm font-bold text-white/70">星期二 · 基礎連貫專案</p><h2 className="mt-4 text-4xl font-black">03 感測器與互動輸入</h2><p className="mt-4 max-w-xl leading-7 text-white/75">認識類比與數位輸入，將感測數值整理成可以控制作品狀態的訊號。</p><div className="mt-10 h-3 overflow-hidden rounded-full bg-black/20"><div className="h-full w-[38%] rounded-full bg-warning" /></div><div className="mt-3 flex justify-between text-sm"><span>本學期進度</span><span>3 / 8</span></div><button className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-background px-5 font-bold text-foreground">進入本週課程 <ArrowRight size={18} /></button></section>
      <section className="rounded-2xl border border-border bg-surface p-8"><CalendarClock className="text-primary" /><h2 className="mt-8 text-2xl font-black">下一堂社課</h2><p className="mt-2 text-muted-foreground">星期五 19:00</p><p className="mt-6 text-xl font-bold">雷射切割與向量設計</p><p className="mt-2 text-sm leading-6 text-muted-foreground">請自備筆電，軟體安裝方式在課前通知。</p></section>
    </div>
    <h2 className="mt-16 text-3xl font-black">最近教材</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{[
      {icon:CircleCheck,title:"基礎電子與麵包板",meta:"已完成"},{icon:Play,title:"ESP32 開發環境",meta:"影片 38 分鐘"},{icon:BookOpen,title:"感測資料除錯清單",meta:"閱讀 10 分鐘"}
    ].map((item)=>{const Icon=item.icon;return <Link href="/resources" key={item.title} className="rounded-2xl border border-border bg-surface p-6 transition-transform hover:-translate-y-1"><Icon className="text-primary"/><p className="mt-10 text-sm text-muted-foreground">{item.meta}</p><h3 className="mt-2 text-xl font-black">{item.title}</h3></Link>;})}</div>
  </div></section></main>;
}
