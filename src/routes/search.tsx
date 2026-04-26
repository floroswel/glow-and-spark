import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: ({ match }) => {
    const q = (match.search as { q?: string })?.q || "";
    return {
      meta: [
        { title: q ? `Rezultate căutare: ${q} — Mama Lucica` : "Căutare — Mama Lucica" },
        { name: "description", content: q ? `Rezultate pentru „${q}" în catalogul Mama Lucica.` : "Caută produse și articole." },
        { name: "robots", content: "noindex, follow" },
      ],
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(q);
  const [products, setProducts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(q);
  }, [q]);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setProducts([]);
      setPosts([]);
      return;
    }
    setLoading(true);
    const like = `%${term}%`;
    Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .or(`name.ilike.${like},description.ilike.${like},sku.ilike.${like}`)
        .limit(24),
      supabase
        .from("blog_posts")
        .select("id,slug,title,excerpt,image_url,published_at")
        .eq("status", "published")
        .or(`title.ilike.${like},content.ilike.${like}`)
        .limit(5),
    ]).then(([prodRes, postRes]) => {
      setProducts(prodRes.data || []);
      setPosts(postRes.data || []);
      setLoading(false);
    });
  }, [q]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = input.trim();
    navigate({ to: "/search", search: { q: term } });
  };

  const term = q.trim();
  const empty = !loading && term && products.length === 0 && posts.length === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
          Căutare
        </h1>
        {term && (
          <p className="text-muted-foreground mb-6">
            Rezultate pentru „<span className="text-foreground font-medium">{term}</span>"
          </p>
        )}

        <form onSubmit={onSubmit} className="relative max-w-xl mb-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Caută produse, articole..."
            className="w-full rounded-full border border-border bg-secondary px-5 py-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-foreground p-2.5 text-primary-foreground transition hover:bg-accent"
            aria-label="Caută"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </form>

        {loading && (
          <p className="text-center text-muted-foreground py-12">Se caută...</p>
        )}

        {!loading && !term && (
          <div className="text-center py-16">
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Introdu un termen de căutare pentru a vedea rezultate.</p>
          </div>
        )}

        {empty && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <p className="text-lg text-foreground mb-2">
              Niciun rezultat pentru „{term}"
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Încearcă alt termen sau explorează catalogul nostru.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 transition"
            >
              Vezi toate produsele
            </Link>
          </div>
        )}

        {!loading && products.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              Produse ({products.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  image={p.image_url || ""}
                  title={p.name}
                  description={p.short_description || ""}
                  price={Number(p.price)}
                  oldPrice={p.old_price ? Number(p.old_price) : undefined}
                  rating={Number(p.rating || 0)}
                  reviews={p.reviews_count || 0}
                  badge={p.badge}
                  badgeType={p.badge_type as any}
                  searchQuery={term}
                />
              ))}
            </div>
          </section>
        )}

        {!loading && posts.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              Articole blog ({posts.length})
            </h2>
            <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="flex items-center gap-4 p-4 hover:bg-secondary transition"
                  >
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-16 w-16 rounded-lg object-cover bg-muted flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{post.excerpt}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
