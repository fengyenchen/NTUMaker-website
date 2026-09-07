import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NTUMaker 台大自造者社",
    template: "%s｜NTUMaker",
  },
  description: "NTUMaker 台大自造者社的公告、社課、工作坊、教材與社員學習平台。",
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
