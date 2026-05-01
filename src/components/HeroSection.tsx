import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImg from "@/assets/hero-candles.jpg";

export function HeroSection() {
  const { homepage } = useSiteSettings();
  if (homepage?.show_hero === false) return null;

  const title = (homepage?.hero_title || "Ritmul lent al\nmomentelor calme").split("\n");
  const subtitle = homepage?.hero_subtitle || "Ceară artizanală din soia pură • Esențe sintetice rare";
  const ctaText = homepage?.hero_cta_text || "Descoperă Colecția";
  const imageUrl = homepage?.hero_image_url || heroImg;
  const opacity = homepage?.hero_overlay_opacity ?? 0.6;

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[500px] md:h-[600px]">
        <img
          src={imageUrl}
          alt="Hero banner"
          className="absolute inset-0 h-full w-full object-cover"
          width={1920}
          height={1024}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/50 to-transparent"
          style={{ opacity }}
        />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-6">
          <div className="max-w-lg">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
              {subtitle}
            </p>
            <h1 className="font-heading text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              {title[0]}<br />
              {title[1] && <span className="italic text-accent">{title[1]}</span>}
            </h1>
            <a
              href={homepage?.hero_cta_url || "/catalog"}
              className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-wider text-accent-foreground transition hover:bg-accent/90 hover:shadow-lg"
            >
              {ctaText}
            </a>
            <p className="mt-4 flex items-center gap-4 text-xs text-primary-foreground/70">
              <span>🕯️ Ceară de soia 100% naturală</span>
              <span>•</span>
              <span>🚚 Livrare în toată România</span>
              <span>•</span>
              <span>↩️ Retur gratuit 14 zile</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
