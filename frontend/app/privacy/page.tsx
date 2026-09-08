import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "隱私權政策",
  description: "NTUMaker 的隱私權政策與個人資料使用說明。",
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "ntumaker2015@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold text-primary">PRIVACY / 隱私權政策</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">隱私權政策</h1>
          <p className="mt-4 text-sm text-muted-foreground">最後更新日期：2026 年 9 月</p>

          <article className="mt-10 space-y-10 rounded-xl border border-border bg-surface p-6 leading-8 md:p-10">
            <div>
              <p>歡迎使用 NTUMaker。我們重視您的隱私權，特此說明本網站的隱私權保護政策。</p>
            </div>
            <PolicySection title="1. 我們收集的資料">
              <p>當您使用 Facebook 登入註冊或登入服務時，經您授權後，我們會從 Facebook 接收並儲存基本公開資訊：</p>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                <li>姓名（Name）</li>
                <li>電子郵件地址（Email）</li>
                <li>個人檔案照（Profile Picture）</li>
              </ul>
            </PolicySection>
            <PolicySection title="2. 資料的使用方式">
              <p>我們僅會將資料用於建立與管理 NTUMaker 帳號、身分驗證，以及發送與 NTUMaker 活動、專案或系統相關的重要通知。</p>
            </PolicySection>
            <PolicySection title="3. 資料的分享與保護">
              <p>NTUMaker 不會出售、交換或出租您的個人資料給第三方。資料僅供團隊內部營運與網站功能使用。</p>
            </PolicySection>
            <PolicySection title="4. 資料保留與刪除">
              <p>我們會保留您的個人資料，直到您要求刪除帳號為止。若希望刪除與本網站相關的個人資料，請參閱資料刪除說明。</p>
              <a href="/delete-account" className="mt-3 inline-flex min-h-11 items-center font-bold text-accent underline underline-offset-4">前往資料刪除說明</a>
            </PolicySection>
            <PolicySection title="5. 聯絡我們">
              <p>若對本隱私權政策有任何疑問，請聯絡我們：</p>
              <a href={`mailto:${contactEmail}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-accent underline underline-offset-4">{contactEmail}</a>
            </PolicySection>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-xl font-black">{title}</h2><div className="mt-3 text-muted-foreground">{children}</div></section>;
}
