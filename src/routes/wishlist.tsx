import { createFileRoute, Link } from "@tanstack/react-router";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Heart, ShoppingCart, ChevronRight, Trash2 } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Lista de Dorințe — Lumini.ro" },
      { name: "description", content: "Produsele tale favorite salvate pentru mai târziu." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
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

  return (
    <>
      <TopBar />
      <SiteHeader />
      <div className="bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition">Acasă</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Lista de Dorințe</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Lista de Dorințe</h1>
        <p className="text-sm text-muted-foreground mt-1">{products.length} {products.length === 1 ? "produs" : "produse"} salvate</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
            {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : !products.length ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground/40 mx-auto" />
            <h2 className="mt-5 font-heading text-xl font-semibold text-foreground">Lista ta de dorințe este goală</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">Explorează colecția noastră și adaugă produsele preferate apăsând pe inimioară.</p>
            <Link to="/catalog" className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
              Explorează produse
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden group">
                <Link to="/produs/$slug" params={{ slug: p.slug }} className="block">
                  <div className="aspect-square overflow-hidden bg-secondary relative">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">Fără imagine</div>
                    )}
                    {p.badge && (
                      <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-md ${
                        p.badge_type === "promo" ? "bg-sale text-sale-foreground" : "bg-accent text-accent-foreground"
                      }`}>{p.badge}</span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to="/produs/$slug" params={{ slug: p.slug }}>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-accent transition">{p.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-lg font-bold text-accent">{Number(p.price).toFixed(2)} lei</span>
                    {p.old_price && <span className="text-xs text-muted-foreground line-through">{Number(p.old_price).toFixed(2)} lei</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => addItem({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, slug: p.slug })}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Adaugă în coș
                    </button>
                    <button
                      onClick={() => toggle(p.id)}
                      className="rounded-lg border border-border p-2.5 hover:bg-destructive/10 hover:text-destructive transition"
                      title="Elimină din favorite"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
