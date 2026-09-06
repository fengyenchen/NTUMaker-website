import { ExternalLink } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p><strong className="text-foreground">NTUMaker</strong> · 國立臺灣大學自造者社</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <a className="inline-flex min-h-11 items-center gap-1.5 font-bold text-foreground underline-offset-4 hover:underline" href="https://www.instagram.com/ntu_maker/" target="_blank" rel="noreferrer">Instagram <ExternalLink size={14} aria-hidden="true" /></a>
          <a className="inline-flex min-h-11 items-center gap-1.5 font-bold text-foreground underline-offset-4 hover:underline" href="https://www.facebook.com/ntumaker2018" target="_blank" rel="noreferrer">Facebook <ExternalLink size={14} aria-hidden="true" /></a>
          <span>Build. Learn. Share.</span>
        </div>
      </div>
    </footer>
  );
}
