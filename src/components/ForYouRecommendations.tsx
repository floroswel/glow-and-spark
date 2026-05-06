import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

const STORAGE_KEY = "recently_viewed";

interface Props {
  excludeIds?: string[];
  categoryId?: string | null;
  limit?: number;
}

export function ForYouRecommendations({ excludeIds = [], categoryId, limit = 4 }: Props) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      // Get recently viewed category IDs for affinity
      let affinityCategories: string[] = [];
      try {
        const stored: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const recentIds = stored.slice(0, 8);
        if (recentIds.length) {
          const { data: recentProducts } = await supabase
            .from("products_public")
            .select("category_id")
            .in("id", recentIds)
            .eq("is_active", true);
          if (recentProducts) {
            affinityCategories = [...new Set(recentProducts.map((p) => p.category_id).filter(Boolean))] as string[];
          }
        }
      } catch { /* ignore */ }

      // Combine current category with affinity categories
      const targetCategories = [...new Set([
        ...(categoryId ? [categoryId] : []),
        ...affinityCategories,
      ])];

      let results: any[] = [];

      if (targetCategories.length) {
        // Fetch products from related categories
        let query = supabase
          .from("products_public")
          .select("*")
          .eq("is_active", true)
          .in("category_id", targetCategories)
          .order("is_featured", { ascending: false })
          .order("rating", { ascending: false })
          .limit(limit + excludeIds.length + 4);

        const { data } = await query;
        if (data) {
          results = data.filter((p) => !excludeIds.includes(p.id)).slice(0, limit);
        }
      }

      // Fallback: if not enough, fill with popular products
      if (results.length < limit) {
        const existingIds = [...excludeIds, ...results.map((p) => p.id)];
        const { data: popular } = await supabase
          .from("products_public")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("rating", { ascending: false })
          .limit(limit + existingIds.length);

        if (popular) {
          const extra = popular.filter((p) => !existingIds.includes(p.id)).slice(0, limit - results.length);
          results = [...results, ...extra];
        }
      }

      setProducts(results);
    })();
  }, [categoryId, excludeIds.join(","), limit]);

  if (!products.length) return null;

  return (
    <div className="mt-16">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">✨ Recomandate pentru tine</h2>
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
