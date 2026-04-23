import { createFileRoute, Link } from "@tanstack/react-router";
import { setPageMeta, setCanonical, removeCanonical } from "@/lib/seo";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/categorie/$slug")({
  head: () => ({
    meta: [
      { title: "Categorie — Lumini.ro" },
      { name: "description", content: "Explorează produsele din această categorie." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCanonical(window.location.origin + "/categorie/" + slug);
    supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("visible", true)
      .single()
      .then(({ data: cat }) => {
        if (cat) {
          setCategory(cat);
          setPageMeta({ title: cat.name, description: cat.description || `Produse din categoria ${cat.name}`, image: cat.image_url || undefined });
          supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .eq("category_id", cat.id)
            .order("sort_order")
            .then(({ data }) => {
              setProducts(data || []);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });
    return () => removeCanonical();
  }, [slug]);

  return (
    <div className="min-h-screen">
      <MarqueeBanner /><TopBar /><SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{category?.name || "Categorie"}</span>
        </nav>

        {category ? (
          <>
            {/* Category header */}
            <div className="relative mb-8 overflow-hidden rounded-xl">
              {category.image_url && (
                <div className="relative h-48 md:h-64 overflow-hidden rounded-xl">
                  <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-foreground/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">{category.name}</h1>
                  </div>
                </div>
              )}
              {!category.image_url && (
                <h1 className="font-heading text-3xl font-bold text-foreground">{category.name}</h1>
              )}
              {category.description && (
                <p className="mt-3 text-muted-foreground">{category.description}</p>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
                    <div className="aspect-square bg-muted" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="py-16 text-center text-muted-foreground">Niciun produs în această categorie.</p>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{products.length} produse</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              </>
            )}
          </>
        ) : !loading ? (
          <div className="py-20 text-center">
            <h1 className="text-2xl font-bold text-foreground">Categoria nu a fost găsită</h1>
            <Link to="/catalog" className="mt-4 inline-block text-accent hover:underline">← Înapoi la catalog</Link>
          </div>
        ) : null}
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
