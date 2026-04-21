import { useState } from "react";

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount] = useState(3);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          LUMINI<span className="text-accent">.RO</span>
        </a>

        <div className="hidden flex-1 max-w-xl mx-8 md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Caută lumânări, diffuzoare, seturi cadou..."
              className="w-full rounded-full border border-border bg-secondary px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-foreground p-2 text-primary-foreground transition hover:bg-accent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <button className="hidden md:flex items-center gap-1 hover:text-foreground transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Compară
          </button>
          <button className="hidden md:flex items-center gap-1 hover:text-foreground transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favorite
          </button>
          <button className="relative flex items-center gap-1 hover:text-foreground transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Coș
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 text-sm font-medium">
          <button className="flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-primary-foreground transition hover:bg-accent hover:text-accent-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Toate Produsele
          </button>
          <a href="/" className="text-muted-foreground hover:text-foreground transition">Acasă</a>
          <a href="#" className="text-sale font-semibold hover:text-sale/80 transition">Reduceri</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition">Noutăți</a>
          <a href="#" className="text-accent font-semibold hover:text-accent/80 transition">🎁 Vouchere Cadou</a>
        </div>
      </nav>
    </header>
  );
}
