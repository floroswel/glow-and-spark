import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/batches")({
  component: StockBatches,
});

function StockBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [bRes, pRes] = await Promise.all([
        supabase.from("product_batches").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name"),
      ]);
      setBatches(bRes.data || []);
      const map: Record<string, string> = {};
      (pRes.data || []).forEach(p => { map[p.id] = p.name; });
      setProducts(map);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Loturi Produse</h1>
        <p className="text-sm text-muted-foreground">{batches.length} loturi înregistrate</p>
      </div>

      {batches.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Layers className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Niciun lot înregistrat</p>
          <p className="text-xs mt-1">Loturile produselor cu dată producție și expirare</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nr. Lot</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produs</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantitate</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Preț cost</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Producție</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Expirare</th>
            </tr></thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono text-xs">{b.batch_number}</td>
                  <td className="px-4 py-2">{products[b.product_id] || "—"}</td>
                  <td className="px-4 py-2 text-right">{b.quantity || 0}</td>
                  <td className="px-4 py-2 text-right">{(b.cost_price || 0).toFixed(2)} RON</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{b.production_date || "—"}</td>
                  <td className="px-4 py-2 text-xs">{b.expiry_date ? <span className={new Date(b.expiry_date) < new Date() ? "text-destructive" : "text-muted-foreground"}>{b.expiry_date}</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
