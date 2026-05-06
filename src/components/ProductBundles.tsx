import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { Package, Tag, Check } from "lucide-react";
import { toast } from "sonner";

export function ProductBundles({ productId }: { productId: string }) {
  const [bundles, setBundles] = useState<any[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      // Find bundles that contain this product
      const { data: links } = await supabase
        .from("product_bundle_items")
        .select("bundle_id")
        .eq("product_id", productId);
      const bundleIds = (links ?? []).map((l: any) => l.bundle_id);
      if (bundleIds.length === 0) { setBundles([]); return; }

      const { data: bs } = await supabase
        .from("product_bundles")
        .select("*")
        .in("id", bundleIds)
        .eq("is_active", true);
      if (!bs || bs.length === 0) { setBundles([]); return; }

      const { data: items } = await supabase
        .from("product_bundle_items")
        .select("bundle_id, product_id, quantity")
        .in("bundle_id", bs.map((b: any) => b.id))
        .order("sort_order");
      const allProductIds = Array.from(new Set((items ?? []).map((i: any) => i.product_id)));
      const { data: prods } = await supabase
        .from("products_public")
        .select("id, name, slug, price, image_url, stock")
        .in("id", allProductIds);

      const enriched = bs.map((b: any) => ({
        ...b,
        items: (items ?? []).filter((i: any) => i.bundle_id === b.id).map((i: any) => ({
          ...i,
          product: (prods ?? []).find((p: any) => p.id === i.product_id),
        })).filter((i: any) => i.product),
      })).filter((b: any) => b.items.length > 1);
      setBundles(enriched);
    })();
  }, [productId]);

  const addBundleToCart = (b: any) => {
    let added = 0;
    b.items.forEach((it: any) => {
      const p = it.product;
      if (!p || p.stock < it.quantity) return;
      const finalPrice = Number(p.price) * (1 - b.discount_percent / 100);
      for (let i = 0; i < it.quantity; i++) {
        addItem({
          id: p.id,
          name: p.name,
          price: finalPrice,
          image_url: p.image_url,
          slug: p.slug,
        });
        added++;
      }
    });
    toast.success(`Pachet adăugat: ${added} produse cu -${b.discount_percent}% reducere`);
  };

  if (bundles.length === 0) return null;

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-accent" />
        <h2 className="font-heading text-xl font-bold text-foreground">Pachete avantajoase cu acest produs</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {bundles.map((b) => {
          const total = b.items.reduce((s: number, it: any) => s + Number(it.product.price) * it.quantity, 0);
          const discounted = total * (1 - b.discount_percent / 100);
          return (
            <div key={b.id} className="rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-bold">PACHET</span>
                <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-xs font-bold">-{b.discount_percent}%</span>
              </div>
              <h3 className="font-semibold text-foreground">{b.name}</h3>
              {b.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{b.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {b.items.map((it: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 rounded bg-card border border-border px-2 py-1 text-xs">
                    {it.product.image_url && <img src={it.product.image_url} alt="" className="h-6 w-6 rounded object-cover" />}
                    <span>{it.product.name}</span>
                    {it.quantity > 1 && <span className="text-accent font-bold">×{it.quantity}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-xs text-muted-foreground line-through">{total.toFixed(2)} RON</div>
                  <div className="text-xl font-bold text-foreground">{discounted.toFixed(2)} <span className="text-sm">RON</span></div>
                  <div className="text-xs text-emerald-600 font-semibold">Economisești {(total - discounted).toFixed(2)} RON</div>
                </div>
                <button onClick={() => addBundleToCart(b)} className="flex items-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:bg-accent/90">
                  <Check className="h-4 w-4" /> Adaugă pachetul
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
