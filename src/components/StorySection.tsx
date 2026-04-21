import storyImg from "@/assets/story-craft.jpg";

export function StorySection() {
  return (
    <section className="bg-secondary py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={storyImg}
              alt="Procesul nostru artizanal de fabricare a lumânărilor"
              className="h-80 w-full object-cover"
              loading="lazy"
              width={800}
              height={600}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Povestea noastră</p>
            <h2 className="font-heading mt-2 text-3xl font-bold text-foreground">
              Ceea ce facem diferit este<br />metoda și atenția cu care creăm
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Folosim doar ceară pură, uleiuri esențiale premium și fitile din lemn natural. Fiecare produs
              este o operă de artă manuală, realizată cu respect pentru mediul tău.
            </p>
            <button className="mt-6 text-sm font-semibold text-foreground underline underline-offset-4 hover:text-accent transition">
              AFLĂ MAI MULT →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
