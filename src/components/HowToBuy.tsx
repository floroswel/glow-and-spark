const steps = [
  { num: "1", label: "Alege produsele" },
  { num: "2", label: "Finalizează comanda" },
  { num: "3", label: "Primește comanda" },
];

export function HowToBuy() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
              {s.num}
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
