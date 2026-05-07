import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { Plus } from "lucide-react";

export function CheckoutUpsell() {
  const { items, addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const ids = items.map((i) => i.id);
    supabase
      .from("products_public" as any)
      .select("id, name, slug, price, old_price, image_url")
      .eq("is_active", true)
      .not("id", "in", `(${ids.join(",")})`)
      .order("popularity_score", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setProducts(data as any[]);
      });
  }, [items]);

  if (products.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5">
      <h3 className="font-heading text-base font-bold text-foreground mb-4">
        ✨ Completează experiența
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="group relative rounded-lg border border-border bg-background p-2 text-center transition hover:border-accent/40 hover:shadow-sm">
            {p.image_url && (
              <img
                src={p.image_url}
                alt={p.name}
                loading="lazy"
                className="mx-auto mb-2 h-20 w-20 rounded-lg object-cover"
              />
            )}
            <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-1">
              {p.name}
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="text-sm font-bold text-foreground">{Number(p.price).toFixed(2)} RON</span>
              {p.old_price && Number(p.old_price) > Number(p.price) && (
                <span className="text-[10px] text-muted-foreground line-through">{Number(p.old_price).toFixed(2)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                addItem({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: Number(p.price),
                  old_price: p.old_price ? Number(p.old_price) : null,
                  image_url: p.image_url,
                })
              }
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground transition hover:opacity-90"
            >
              <Plus className="h-3 w-3" /> Adaugă
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
