import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Home, Package } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NotFound() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate({ to: "/catalog", search: term ? { q: term } : undefined });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl text-center">
          <p className="font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Mama Lucica
          </p>
          <h1 className="mt-6 font-serif text-7xl font-bold text-foreground sm:text-8xl">
            404
          </h1>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Pagina nu a fost găsită
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Pagina pe care o cauți nu există sau a fost mutată.
          </p>

          <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Caută produse..."
                className="pl-9"
                aria-label="Caută produse"
              />
            </div>
            <Button type="submit" variant="secondary">
              Caută
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="h-4 w-4" />
                Înapoi la pagina principală
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/catalog">
                <Package className="h-4 w-4" />
                Vezi produsele noastre
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
