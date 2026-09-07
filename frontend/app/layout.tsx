import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NTUMaker 台大自造者社",
    template: "%s｜NTUMaker",
  },
  description: "NTUMaker 台大自造者社官方網站，記錄我們的活動、課程、工作坊與專案，一起動手把想法做出來。",
  icons: {
    icon: "/favicon.png",
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
