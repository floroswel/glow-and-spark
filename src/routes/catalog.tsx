import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalog Produse — Lumini.ro" },
      { name: "description", content: "Explorează catalogul complet de lumânări artizanale, odorizante și seturi cadou." },
      { property: "og:title", content: "Catalog Produse — Lumini.ro" },
      { property: "og:description", content: "Explorează catalogul complet de lumânări artizanale premium." },
    ],
  }),
  component: CatalogPage,
});

const ITEMS_PER_PAGE = 12;

function CatalogPage() {
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [categorySlug, setCategorySlug] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

      if (searchQuery.trim()) {
        query = query.ilike("name", `%${searchQuery.trim()}%`);
      }

      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
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
  }, [searchQuery, categorySlug, sort, minPrice, maxPrice, page, categories]);

  // Update URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (categorySlug) params.set("category", categorySlug);
    if (sort !== "newest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    window.history.replaceState({}, "", `/catalog${qs ? `?${qs}` : ""}`);
  }, [searchQuery, categorySlug, sort, page]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const activeCat = categories.find((c) => c.slug === categorySlug);

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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {searchQuery ? `Rezultate pentru „${searchQuery}"` : activeCat ? activeCat.name : "Toate Produsele"}
          </h1>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setPage(1); }}
              className="text-sm text-accent hover:underline"
            >
              ✕ Șterge căutarea
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Categorii</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setCategorySlug(""); setPage(1); }}
                  className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition ${!categorySlug ? "bg-accent/15 text-accent font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                >
                  Toate produsele
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategorySlug(cat.slug); setPage(1); }}
                    className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition ${categorySlug === cat.slug ? "bg-accent/15 text-accent font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
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
                  onChange={(e) => { setMinPrice(Number(e.target.value)); setPage(1); }}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  placeholder="Min"
                  min={0}
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }}
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
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
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
                <p className="text-lg text-muted-foreground">Niciun produs găsit.</p>
                <button onClick={() => { setCategorySlug(""); setMinPrice(0); setMaxPrice(1000); }} className="mt-4 text-accent hover:underline">
                  Resetează filtrele
                </button>
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
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                            onClick={() => setPage(p)}
                            className={`rounded-lg px-3 py-2 text-sm ${p === page ? "bg-foreground text-primary-foreground" : "border border-border hover:bg-secondary"}`}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
