import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ArrowLeft, Package } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

export function NotFound() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = "404 — Pagina nu a fost găsită | Mama Lucica";
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");
    return () => {
      robots?.setAttribute("content", "index, follow");
    };
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate({ to: "/search", search: { q: term } as any });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <MarqueeBanner />
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-2xl text-center space-y-8">
          <h1
            className="font-serif font-bold leading-none tracking-tight text-accent"
            style={{ fontSize: "clamp(7rem, 20vw, 14rem)" }}
          >
            404
          </h1>

          <div className="space-y-3">
            <h2 className="font-serif text-2xl md:text-4xl font-semibold text-foreground">
              Pagina nu a fost găsită
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
              Se pare că pagina pe care o cauți nu mai există sau a fost mutată.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mx-auto max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Caută produse..."
                className="pl-10 h-12"
                aria-label="Caută produse"
              />
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" variant="default">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Înapoi la magazin
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/catalog">
                <Package className="mr-2 h-4 w-4" />
                Vezi toate produsele
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
