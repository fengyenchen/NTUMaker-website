export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="px-5 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
      <div className="mx-auto max-w-[1320px]">
        <p className="mb-4 text-sm font-bold text-primary">{eyebrow}</p>
        <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">{title}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
