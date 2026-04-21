import { useState, useEffect } from "react";

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-[450px] max-w-[90vw] overflow-hidden rounded-xl bg-card shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-muted transition"
        >
          ×
        </button>
        <div className="bg-foreground p-8 text-center text-primary-foreground">
          <p className="font-heading text-3xl font-bold">10% REDUCERE</p>
          <p className="mt-1 text-sm uppercase tracking-wider text-accent">La prima comandă</p>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm font-semibold text-foreground">Fii primul care află!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Abonează-te și primești un cod de 10% reducere + acces la vânzările private.
          </p>
          <input
            type="email"
            placeholder="Adresa ta de email..."
            className="mt-4 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button className="mt-3 w-full rounded-lg bg-accent py-2.5 text-sm font-bold uppercase text-accent-foreground transition hover:bg-accent/90">
            VREAU REDUCEREA DE 10%
          </button>
          <button
            onClick={() => setOpen(false)}
            className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Nu, mulțumesc. Renunț la reducere.
          </button>
        </div>
      </div>
    </div>
  );
}
