import collectionImg from "@/assets/collection-summer.jpg";

export function CollectionBanners() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="relative col-span-2 overflow-hidden rounded-2xl">
          <img
            src={collectionImg}
            alt="Colecția de vară"
            className="h-80 w-full object-cover"
            loading="lazy"
            width={800}
            height={960}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
          <div className="absolute bottom-6 left-6 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Colecția de vară</p>
            <h3 className="font-heading mt-1 text-2xl font-bold">Colecția<br />"Nuit Étoilé"</h3>
            <button className="mt-3 text-sm font-medium underline underline-offset-4 hover:text-accent transition">
              EXPLOREAZĂ →
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-foreground p-8 text-center text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">LICHIDARE</p>
          <h3 className="font-heading mt-2 text-xl font-bold">Stocuri limitate</h3>
          <p className="mt-1 text-2xl font-bold text-accent">De la 19 RON</p>
          <button className="mt-4 rounded-full border border-primary-foreground/30 px-6 py-2 text-sm font-semibold transition hover:bg-primary-foreground hover:text-foreground">
            VEZI STOCURILE
          </button>
        </div>
      </div>
    </section>
  );
}
