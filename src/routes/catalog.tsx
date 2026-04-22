import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight, Copy, Check, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

const catalogSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["newest", "price_asc", "price_desc", "popular"]), "newest").default("newest"),
  page: fallback(z.number().int().min(1), 1).default(1),
  minPrice: fallback(z.number().min(0), 0).default(0),
  maxPrice: fallback(z.number().min(0), 1000).default(1000),
});

export const Route = createFileRoute("/catalog")({
  validateSearch: zodValidator(catalogSearchSchema),
  head: () => ({
    meta: [
      { title: "Catalog Produse — Lumini.ro" },
      { name: "description", content: "Explorează catalogul complet de lumânări artizanale, odorizante și seturi cadou." },
      { property: "og:title", content: "Catalog Produse — Lumini.ro" },
      { property: "og:description", content: "Explorează catalogul complet de lumânări artizanale premium." },
    ],
  }),
  beforeLoad: ({ navigate }) => {
    if (typeof window !== "undefined" && window.location.hash.length > 1) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const search: z.infer<typeof catalogSearchSchema> = {
        q: hashParams.get("q") || "",
        category: hashParams.get("category") || "",
        sort: (hashParams.get("sort") as any) || "newest",
        page: hashParams.has("page") ? Number(hashParams.get("page")) : 1,
        minPrice: hashParams.has("minPrice") ? Number(hashParams.get("minPrice")) : 0,
        maxPrice: hashParams.has("maxPrice") ? Number(hashParams.get("maxPrice")) : 1000,
      };

      const hasValues = search.q || search.category || search.sort !== "newest" || search.page !== 1 || search.minPrice > 0 || search.maxPrice < 1000;
      if (hasValues) {
        window.history.replaceState(null, "", window.location.pathname);
        throw navigate({ to: "/catalog", search, replace: true });
      }
    }
  },
  component: CatalogPage,
});

const ITEMS_PER_PAGE = 12;

function CatalogPage() {
  const { q, category, sort, page, minPrice, maxPrice } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Helper to update search params
  const updateSearch = (updates: Partial<z.infer<typeof catalogSearchSchema>>) => {
    navigate({ search: (prev: z.infer<typeof catalogSearchSchema>) => ({ ...prev, ...updates }) });
  };

  // Fetch categories
  useEffect(() => {
    supabase.from("categories").select("*").eq("visible", true).order("sort_order").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      let query = supabase.from("products").select("*, categories!products_category_id_fkey(slug, name)", { count: "exact" }).eq("is_active", true);

      if (q.trim()) {
        const { data: matchIds } = await supabase.rpc("search_product_ids_unaccent", { term: q.trim() });
        if (matchIds && matchIds.length > 0) {
          query = query.in("id", matchIds.map((r: any) => r.id));
        } else {
          setProducts([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      if (category) {
        const cat = categories.find((c) => c.slug === category);
        if (cat) query = query.eq("category_id", cat.id);
      }

      if (minPrice > 0) query = query.gte("price", minPrice);
      if (maxPrice < 1000) query = query.lte("price", maxPrice);

      switch (sort) {
        case "price_asc": query = query.order("price", { ascending: true }); break;
        case "price_desc": query = query.order("price", { ascending: false }); break;
        case "popular": query = query.order("is_featured", { ascending: false }).order("rating", { ascending: false }); break;
        default: query = query.order("created_at", { ascending: false }); break;
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data, count } = await query;
      setProducts(data || []);
      setTotalCount(count || 0);
      setLoading(false);
    };
    fetchProducts();
  }, [q, category, sort, minPrice, maxPrice, page, categories]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const activeCat = categories.find((c) => c.slug === category);

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">
            {activeCat ? activeCat.name : "Catalog"}
          </span>
        </nav>

        <div className="sticky top-0 z-30 -mx-4 mb-8 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {q ? `Rezultate pentru „${q}"` : activeCat ? activeCat.name : "Toate Produsele"}
            </h1>
            <div className="flex items-center gap-3">
              {q && (
                <button
                  onClick={() => updateSearch({ q: "", page: 1 })}
                  className="text-sm text-accent hover:underline"
                >
                  ✕ Șterge căutarea
                </button>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success("Link copiat în clipboard!", { duration: 2000 });
                  });
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiat!" : "Copiază link"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Categorii</h3>
              <div className="space-y-1">
                <button
                  onClick={() => updateSearch({ category: "", page: 1 })}
                  className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition ${!category ? "bg-accent/15 text-accent font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                >
                  Toate produsele
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateSearch({ category: cat.slug, page: 1 })}
                    className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition ${category === cat.slug ? "bg-accent/15 text-accent font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price filter */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Preț</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => updateSearch({ minPrice: Number(e.target.value), page: 1 })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Min"
                  min={0}
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => updateSearch({ maxPrice: Number(e.target.value), page: 1 })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Max"
                  min={0}
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Sortare</h3>
              <select
                value={sort}
                onChange={(e) => updateSearch({ sort: e.target.value as any, page: 1 })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-card"
              >
                <option value="newest">Cele mai noi</option>
                <option value="price_asc">Preț crescător</option>
                <option value="price_desc">Preț descrescător</option>
                <option value="popular">Populare</option>
              </select>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
                    <div className="aspect-square bg-muted" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                      <div className="h-5 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-lg font-medium text-foreground">
                  {q ? `Niciun rezultat pentru „${q}"` : "Niciun produs găsit"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {q
                    ? "Încearcă altă aromă, categorie sau verifică ortografia"
                    : "Modifică filtrele pentru a vedea mai multe produse"}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {q && (
                    <button
                      onClick={() => updateSearch({ q: "", page: 1 })}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition"
                    >
                      Șterge căutarea
                    </button>
                  )}
                  <button
                    onClick={() => updateSearch({ category: "", minPrice: 0, maxPrice: 1000, q: "", page: 1, sort: "newest" })}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
                  >
                    Resetează toate filtrele
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{totalCount} produse</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      slug={p.slug}
                      image={p.image_url || ""}
                      title={p.name}
                      description={p.short_description || ""}
                      price={p.price}
                      oldPrice={p.old_price}
                      rating={p.rating || 0}
                      reviews={p.reviews_count || 0}
                      badge={p.badge}
                      badgeType={p.badge_type}
                      searchQuery={q}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateSearch({ page: Math.max(1, page - 1) })}
                      disabled={page === 1}
                      className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
                    >
                      ← Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .map((p, idx, arr) => (
                        <span key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted-foreground">...</span>}
                          <button
                            onClick={() => updateSearch({ page: p })}
                            className={`rounded-lg px-3 py-2 text-sm ${p === page ? "bg-foreground text-primary-foreground" : "border border-border hover:bg-secondary"}`}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => updateSearch({ page: Math.min(totalPages, page + 1) })}
                      disabled={page === totalPages}
                      className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
                    >
                      Următor →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
