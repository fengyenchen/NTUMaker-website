import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.FRONTEND_URL ??
  "https://ntumaker.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NTUMaker 台大自造者社",
    template: "%s｜NTUMaker",
  },
  description: "NTUMaker 台大自造者社官方網站，記錄我們的活動、課程、工作坊與專案，一起動手把想法做出來。",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "NTUMaker 台大自造者社",
    title: "NTUMaker 台大自造者社",
    description: "動手實作、持續學習、分享創造。",
    images: [
      {
        url: "/images/ntumaker-og-cover.png",
        width: 1200,
        height: 630,
        alt: "NTUMaker 台大自造者社",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NTUMaker 台大自造者社",
    description: "動手實作、持續學習、分享創造。",
    images: ["/images/ntumaker-og-cover.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preload" href="/crownCork.glb" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
