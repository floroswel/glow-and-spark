import { createFileRoute, Link } from "@tanstack/react-router";
import { useCompare } from "@/hooks/useCompare";
import { useCart } from "@/hooks/useCart";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GitCompareArrows, ShoppingCart, ChevronRight, X, Star } from "lucide-react";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compară Produse — Lumini.ro" },
      { name: "description", content: "Compară până la 4 produse una lângă alta." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const { addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) { setProducts([]); setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("products").select("*, categories(name)").in("id", ids);
      setProducts(data || []);
      setLoading(false);
    })();
  }, [ids]);

  const rows: { label: string; render: (p: any) => React.ReactNode }[] = [
    { label: "Imagine", render: (p) => (
      <Link to="/produs/$slug" params={{ slug: p.slug }} className="block">
        <div className="aspect-square rounded-lg overflow-hidden bg-secondary mx-auto w-32">
          {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">N/A</div>}
        </div>
      </Link>
    )},
    { label: "Nume", render: (p) => <Link to="/produs/$slug" params={{ slug: p.slug }} className="text-sm font-semibold text-foreground hover:text-accent transition">{p.name}</Link> },
    { label: "Preț", render: (p) => (
      <div>
        <span className="text-lg font-bold text-accent">{Number(p.price).toFixed(2)} lei</span>
        {p.old_price && <span className="text-xs text-muted-foreground line-through ml-2">{Number(p.old_price).toFixed(2)} lei</span>}
      </div>
    )},
    { label: "Categorie", render: (p) => <span className="text-sm text-muted-foreground">{(p.categories as any)?.name || "—"}</span> },
    { label: "Rating", render: (p) => (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-accent text-accent" />
        <span className="text-sm font-medium text-foreground">{Number(p.rating || 0).toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({p.reviews_count || 0})</span>
      </div>
    )},
    { label: "Greutate", render: (p) => <span className="text-sm text-muted-foreground">{p.weight || "—"}</span> },
    { label: "Stoc", render: (p) => {
      const stock = p.stock ?? 0;
      return stock > 5 ? <span className="text-sm text-accent font-medium">În stoc ({stock})</span>
        : stock > 0 ? <span className="text-sm text-yellow-600 font-medium">Stoc limitat ({stock})</span>
        : <span className="text-sm text-destructive font-medium">Epuizat</span>;
    }},
    { label: "Acțiune", render: (p) => (
      <button
        onClick={() => addItem({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, slug: p.slug })}
        disabled={(p.stock ?? 0) === 0}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="h-3.5 w-3.5" /> Adaugă în coș
      </button>
    )},
  ];

  return (
    <>
      <TopBar />
      <SiteHeader />
      <div className="bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition">Acasă</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Compară Produse</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Compară Produse</h1>
            <p className="text-sm text-muted-foreground mt-1">{ids.length}/4 produse selectate</p>
          </div>
          {ids.length > 0 && (
            <button onClick={clear} className="text-sm text-destructive hover:underline font-medium">Golește comparația</button>
          )}
        </div>

        {loading ? (
          <div className="mt-8 h-96 rounded-xl bg-muted animate-pulse" />
        ) : !products.length ? (
          <div className="text-center py-20">
            <GitCompareArrows className="h-16 w-16 text-muted-foreground/40 mx-auto" />
            <h2 className="mt-5 font-heading text-xl font-semibold text-foreground">Niciun produs de comparat</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">Adaugă produse la comparație din pagina de catalog sau de produs.</p>
            <Link to="/catalog" className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
              Explorează produse
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3 w-28 border-b border-border">Atribut</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-3 border-b border-border min-w-[180px] relative">
                      <button
                        onClick={() => remove(p.id)}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                        title="Elimină din comparație"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                    <td className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border">{row.label}</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 text-center">{row.render(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
