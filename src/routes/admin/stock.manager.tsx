import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Save, AlertTriangle, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/manager")({
  component: StockManager,
});

const PAGE_SIZE = 25;

function StockManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [edits, setEdits] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("id, name, sku, stock, price, min_stock_alert, image_url, is_active").order("name");
      setProducts(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (id: string) => {
    if (edits[id] === undefined) return;
    const { error } = await supabase.from("products").update({ stock: edits[id] }).eq("id", id);
    if (error) { toast.error("Eroare la salvare"); return; }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: edits[id] } : p));
    setEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success("Stoc actualizat");
  };

  if (loading) return <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Manager Stoc</h1>
        <p className="text-sm text-muted-foreground">Editează stocul rapid per produs</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Caută produs sau SKU..." className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Package className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Niciun produs găsit</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produs</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Stoc</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Prag</th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 w-16" />
              </tr></thead>
              <tbody>
                {paged.map(p => {
                  const stock = edits[p.id] !== undefined ? edits[p.id] : (p.stock || 0);
                  const threshold = p.min_stock_alert || 5;
                  const status = stock <= 0 ? "out" : stock <= threshold ? "low" : "ok";
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {p.image_url ? <img src={p.image_url} className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-secondary" />}
                          <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" value={stock} min={0}
                          onChange={e => setEdits(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))}
                          className="w-20 rounded border border-border bg-background px-2 py-1 text-right text-sm" />
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{threshold}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          status === "out" ? "bg-destructive/15 text-destructive" : status === "low" ? "bg-accent/15 text-accent" : "bg-chart-2/15 text-chart-2"
                        }`}>
                          {status === "out" ? "Epuizat" : status === "low" ? "Critic" : "În stoc"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {edits[p.id] !== undefined && (
                          <button onClick={() => handleSave(p.id)} className="rounded p-1 text-accent hover:bg-accent/10">
                            <Save className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{filtered.length} produse</span>
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
