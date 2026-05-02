import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 8;

export function addToRecentlyViewed(productId: string) {
  if (typeof window === "undefined") return;
  try {
    const stored: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = stored.filter((id) => id !== productId);
    filtered.unshift(productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch { /* ignore */ }
}

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const ids = stored.filter((id) => id !== excludeId).slice(0, 4);
      if (!ids.length) return;
      supabase
        .from("products")
        .select("*")
        .in("id", ids)
        .eq("is_active", true)
        .then(({ data }) => {
          if (data) {
            // Sort by order in localStorage
            const sorted = ids.map((id) => data.find((p) => p.id === id)).filter(Boolean);
            setProducts(sorted as any[]);
          }
        });
    } catch { /* ignore */ }
  }, [excludeId]);

  if (!products.length) return null;

  return (
    <div className="mt-16">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Vizualizate recent</h2>
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
    </div>
  );
}
