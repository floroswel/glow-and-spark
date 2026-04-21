import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

export function ProductGrid() {
  const { homepage } = useSiteSettings();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(8)
      .then(({ data }) => {
        if (data) setProducts(data);
      });
  }, []);

  if (homepage?.show_products === false) return null;

  const title = homepage?.products_title || "Preferatele clienților";
  const subtitle = homepage?.products_subtitle || "Fiecare lumânare este turnată manual, insuflând atmosferă și caracter în spațiul tău.";

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
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
    </section>
  );
}
