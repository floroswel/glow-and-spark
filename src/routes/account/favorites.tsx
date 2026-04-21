import { createFileRoute, Link } from "@tanstack/react-router";
import { useFavorites } from "@/hooks/useFavorites";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export const Route = createFileRoute("/account/favorites")({
  component: AccountFavorites,
});

function AccountFavorites() {
  const { ids, toggle } = useFavorites();
  const { addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const arr = Array.from(ids);
    if (!arr.length) { setProducts([]); setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("products").select("*").in("id", arr);
      setProducts(data || []);
      setLoading(false);
    })();
  }, [ids]);

  if (loading) {
    return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  if (!products.length) {
    return (
      <div className="text-center py-16">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">Niciun produs favorit</h2>
        <p className="mt-1 text-sm text-muted-foreground">Adaugă produse la favorite apăsând pe inimioară.</p>
        <Link to="/catalog" className="mt-4 inline-flex items-center rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
          Explorează produse
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-foreground">Produsele Favorite ({products.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden group">
            <Link to="/produs/$slug" params={{ slug: p.slug }} className="block">
              <div className="aspect-square overflow-hidden bg-secondary">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">Fără imagine</div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <Link to="/produs/$slug" params={{ slug: p.slug }}>
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-accent transition">{p.name}</h3>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-accent">{Number(p.price).toFixed(2)} lei</span>
                {p.old_price && <span className="text-xs text-muted-foreground line-through">{Number(p.old_price).toFixed(2)} lei</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => addItem({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, slug: p.slug })}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition"
                >
                  <ShoppingCart className="h-3.5 w-3.5" /> Adaugă în coș
                </button>
                <button
                  onClick={() => toggle(p.id)}
                  className="rounded-lg border border-border p-2 hover:bg-destructive/10 hover:text-destructive transition"
                >
                  <Heart className="h-4 w-4 fill-current text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
