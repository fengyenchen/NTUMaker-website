import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "資料刪除說明",
  description: "說明如何撤銷 Facebook 授權並要求刪除 NTUMaker 使用者資料。",
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ntumaker2015@gmail.com";

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold text-primary">ACCOUNT DELETION / 資料刪除</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">使用者資料刪除說明</h1>
          <article className="mt-10 space-y-10 rounded-xl border border-border bg-surface p-6 leading-8 md:p-10">
            <p>根據 Meta（Facebook）政策，若您曾使用 Facebook 登入 NTUMaker，您可以撤銷授權並要求刪除與本網站相關的個人資料。</p>
            <section>
              <h2 className="text-xl font-black">方法一：從 Facebook 移除應用程式權限</h2>
              <p className="mt-3 text-muted-foreground">您可以隨時從 Facebook 帳號移除 NTUMaker 的授權：</p>
              <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted-foreground">
                <li>登入 Facebook，前往「設定和隱私」中的「設定」。</li>
                <li>選擇「應用程式和網站」（Apps and Websites）。</li>
                <li>在列表中找到 NTUMaker，或 Meta 後台設定的應用程式名稱。</li>
                <li>點選「移除」（Remove），即可斷開 Facebook 與本網站的連結。</li>
              </ol>
            </section>
            <section>
              <h2 className="text-xl font-black">方法二：聯絡我們刪除帳號與資料</h2>
              <p className="mt-3 text-muted-foreground">若希望我們從 NTUMaker 資料庫中刪除帳號與相關紀錄，請寄信給我們：</p>
              <dl className="mt-4 grid gap-3 rounded-lg bg-surface-raised p-5 text-muted-foreground">
                <div><dt className="font-bold text-foreground">收件者</dt><dd><a href={`mailto:${contactEmail}`} className="font-bold text-accent underline underline-offset-4">{contactEmail}</a></dd></div>
                <div><dt className="font-bold text-foreground">信件主旨</dt><dd>要求刪除 NTUMaker 帳號資料</dd></div>
                <div><dt className="font-bold text-foreground">信件內容</dt><dd>請提供註冊時使用的電子郵件或 Facebook 顯示名稱，供我們核對身分。</dd></div>
              </dl>
              <p className="mt-4 text-muted-foreground">收到請求後，我們將在 7 個工作天內清除資料庫中的相關個人資訊，並以電子郵件通知您。</p>
            </section>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
