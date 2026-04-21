import { useSiteSettings } from "@/hooks/useSiteSettings";
import collectionImg from "@/assets/collection-summer.jpg";

export function CollectionBanners() {
  const { homepage } = useSiteSettings();
  if (homepage?.show_collection_banners === false) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="relative col-span-2 overflow-hidden rounded-2xl">
          <img
            src={homepage?.collection_image || collectionImg}
            alt={homepage?.collection_label || "Colecție"}
            className="h-80 w-full object-cover"
            loading="lazy"
            width={800}
            height={960}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
          <div className="absolute bottom-6 left-6 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {homepage?.collection_label || "Colecția de vară"}
            </p>
            <h3 className="font-heading mt-1 text-2xl font-bold">
              {(homepage?.collection_title || 'Colecția\n"Nuit Étoilé"').split("\n").map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h3>
            <a href={homepage?.collection_url || "/catalog"} className="mt-3 inline-block text-sm font-medium underline underline-offset-4 hover:text-accent transition">
              EXPLOREAZĂ →
            </a>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-foreground p-8 text-center text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">LICHIDARE</p>
          <h3 className="font-heading mt-2 text-xl font-bold">{homepage?.clearance_title || "Stocuri limitate"}</h3>
          <p className="mt-1 text-2xl font-bold text-accent">{homepage?.clearance_price || "De la 19 RON"}</p>
          <a href={homepage?.clearance_url || "/catalog?sort=discount"} className="mt-4 inline-block rounded-full border border-primary-foreground/30 px-6 py-2 text-sm font-semibold transition hover:bg-primary-foreground hover:text-foreground">
            VEZI STOCURILE
          </a>
        </div>
      </div>
    </section>
  );
}
