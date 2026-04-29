import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Package } from "lucide-react";

export const Route = createFileRoute("/__error")({
  head: () => ({
    meta: [
      { title: "404 — Pagina nu a fost găsită | Mama Lucica" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Pagina căutată nu a fost găsită." },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate({ to: "/search", search: { q } as any });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <MarqueeBanner />
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-2xl w-full text-center space-y-8">
          <h1
            className="font-serif font-bold leading-none tracking-tight text-accent"
            style={{ fontSize: "clamp(7rem, 20vw, 14rem)" }}
          >
            404
          </h1>

          <div className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-serif font-semibold text-foreground">
              Pagina nu a fost găsită
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
              Se pare că pagina pe care o cauți nu mai există sau a fost mutată.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Caută produse..."
                className="pl-10 h-12"
                aria-label="Caută în magazin"
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

export { NotFoundPage };
