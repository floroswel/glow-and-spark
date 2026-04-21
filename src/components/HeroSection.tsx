import heroImg from "@/assets/hero-candles.jpg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[500px] md:h-[600px]">
        <img
          src={heroImg}
          alt="Lumânări artizanale premium din ceară de soia"
          className="absolute inset-0 h-full w-full object-cover"
          width={1920}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-6">
          <div className="max-w-lg">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Ceară artizanală din soia pură • Esențe sintetice rare
            </p>
            <h1 className="font-heading text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Ritmul lent al<br />
              <span className="italic text-accent">momentelor calme</span>
            </h1>
            <button className="mt-8 rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-wider text-accent-foreground transition hover:bg-accent/90 hover:shadow-lg">
              Descoperă Colecția
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
