import { redirect } from "next/navigation";
import { BadgeCheck, Mail, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MemberSettingsForm } from "@/components/member-settings-form";
import { getCurrentUser } from "@/lib/auth-api";

export default async function LearnPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const expiresAt = user.membership_expires_at
    ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "long" }).format(
        new Date(`${user.membership_expires_at}T00:00:00+08:00`),
      )
    : "未設定";

  return (
    <main>
      <SiteHeader />
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold text-accent">MEMBER SETTINGS / 社員設定</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.1] tracking-tight md:text-5xl">
            帳號設定
          </h1>
          <p className="mt-4 text-muted-foreground">
            管理你的顯示名稱，並查看社員資格。
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-[1.1fr_.9fr]">
            <section className="border border-border bg-surface p-7 shadow-[5px_6px_0_var(--color-shadow-soft)] md:p-8">
              <div className="flex items-center gap-3">
                <UserRound className="text-accent" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-black">顯示名稱</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    這個名稱會顯示在你的社員帳號中。
                  </p>
                </div>
              </div>
              <MemberSettingsForm initialDisplayName={user.display_name ?? ""} />

              <div className="mt-8 border-t border-border pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="shrink-0 text-muted-foreground" size={18} aria-hidden="true" />
                  <div>
                    <p className="text-muted-foreground">登入 Email</p>
                    <p className="mt-1 font-bold">{user.email}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-border bg-secondary p-7 text-on-secondary shadow-[5px_6px_0_var(--color-shadow-soft)] md:p-8">
              <BadgeCheck className="text-warning" aria-hidden="true" />
              <p className="mt-8 text-sm font-bold text-white/70">社員資格</p>
              <h2 className="mt-2 text-3xl font-black">資格有效</h2>
              <p className="mt-6 text-sm text-white/70">有效至</p>
              <p className="mt-1 text-xl font-bold">{expiresAt}</p>
              <p className="mt-8 border-t border-white/15 pt-5 text-sm leading-6 text-white/70">
                如有疑問，請聯絡社團管理員。
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
