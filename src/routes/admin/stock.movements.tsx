import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/movements")({
  component: StockMovements,
});

const PAGE_SIZE = 25;

function StockMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const [movRes, prodRes] = await Promise.all([
        supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("products").select("id, name"),
      ]);
      setMovements(movRes.data || []);
      const map: Record<string, string> = {};
      (prodRes.data || []).forEach(p => { map[p.id] = p.name; });
      setProducts(map);
      setLoading(false);
    })();
  }, []);

  const filtered = movements.filter(m => {
    const pName = products[m.product_id] || "";
    return pName.toLowerCase().includes(search.toLowerCase()) || (m.reason || "").toLowerCase().includes(search.toLowerCase());
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const typeLabels: Record<string, string> = { in: "Intrare", out: "Ieșire", adjustment: "Ajustare", transfer: "Transfer" };

  if (loading) return <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Mișcări Stoc</h1>
        <p className="text-sm text-muted-foreground">{movements.length} mișcări înregistrate</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Caută produs sau motiv..." className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <ArrowUpDown className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Nicio mișcare înregistrată</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produs</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Tip</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Cantitate</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Stoc anterior</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Stoc nou</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Motiv</th>
              </tr></thead>
              <tbody>
                {paged.map(m => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-2 text-muted-foreground text-xs">{new Date(m.created_at).toLocaleDateString("ro-RO")}</td>
                    <td className="px-4 py-2 font-medium truncate max-w-[200px]">{products[m.product_id] || "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.movement_type === "in" ? "bg-chart-2/15 text-chart-2" : m.movement_type === "out" ? "bg-destructive/15 text-destructive" : "bg-accent/15 text-accent"
                      }`}>{typeLabels[m.movement_type] || m.movement_type}</span>
                    </td>
                    <td className={`px-4 py-2 text-right font-mono ${m.quantity > 0 ? "text-chart-2" : "text-destructive"}`}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{m.previous_stock ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{m.new_stock ?? "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs truncate max-w-[150px]">{m.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{filtered.length} mișcări</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm">{page}/{totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded border border-border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
