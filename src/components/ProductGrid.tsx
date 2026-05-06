import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

export function ProductGrid() {
  const { homepage } = useSiteSettings();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("products_public")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(Number(homepage?.bestsellers_count) || 8)
      .then(({ data }) => {
        if (data) setProducts(data);
        setLoading(false);
      });
  }, [homepage?.bestsellers_count]);

  if (homepage?.show_products === false) return null;

  const title = homepage?.products_title || "Preferatele clienților";
  const subtitle = homepage?.products_subtitle || "Fiecare lumânare este turnată manual, insuflând atmosferă și caracter în spațiul tău.";

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <p className="text-center text-muted-foreground">Niciun produs disponibil momentan.</p>
      ) : (
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
              lowestPrice30d={(p as any).lowest_price_30d}
              rating={p.rating || 0}
              reviews={p.reviews_count || 0}
              badge={p.badge}
              badgeType={p.badge_type}
            />
          ))}
        </div>
      )}
    </section>
  );
}
