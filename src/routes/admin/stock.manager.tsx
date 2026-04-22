import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package, Search, Save, ArrowLeft, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stock/manager")({
  component: StockManager,
});

function StockManager() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "out" | "critical" | "ok">("all");
  const [edited, setEdited] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("id, name, slug, image_url, stock, min_stock_alert, price, cost_price, sku, category_id, is_active").order("name"),
        supabase.from("categories").select("id, name"),
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s) || (p.sku || "").toLowerCase().includes(s));
    }
    if (filter === "out") list = list.filter(p => (p.stock ?? 0) <= 0);
    else if (filter === "critical") list = list.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.min_stock_alert ?? 5));
    else if (filter === "ok") list = list.filter(p => (p.stock ?? 0) > (p.min_stock_alert ?? 5));
    return list;
  }, [products, search, filter]);

  const handleStockChange = (id: string, val: number) => {
    setEdited(prev => ({ ...prev, [id]: val }));
  };

  const saveAll = async () => {
    setSaving(true);
    const entries = Object.entries(edited);
    for (const [id, newStock] of entries) {
      const product = products.find(p => p.id === id);
      const oldStock = product?.stock ?? 0;
      await supabase.from("products").update({ stock: newStock }).eq("id", id);
      await supabase.from("stock_movements").insert({
        product_id: id,
        movement_type: newStock > oldStock ? "entry" : "exit",
        quantity: newStock - oldStock,
        previous_stock: oldStock,
        new_stock: newStock,
        reason: "Ajustare manuală din Manager Stoc",
        reference_type: "manual",
        performed_by: user?.id,
      });
    }
    setProducts(prev => prev.map(p => edited[p.id] !== undefined ? { ...p, stock: edited[p.id] } : p));
    setEdited({});
    setSaving(false);
    toast.success(`${entries.length} produse actualizate`);
  };

  const getCatName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";
  const getStockStatus = (p: any) => {
    const stock = edited[p.id] ?? p.stock ?? 0;
    if (stock <= 0) return { label: "Epuizat", cls: "bg-destructive/10 text-destructive" };
    if (stock <= (p.min_stock_alert ?? 5)) return { label: "Critic", cls: "bg-amber-500/10 text-amber-600" };
    return { label: "În stoc", cls: "bg-chart-2/10 text-chart-2" };
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;

  const hasChanges = Object.keys(edited).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">Manager Stoc</h1>
          <span className="text-sm text-muted-foreground">({filtered.length} produse)</span>
        </div>
        {hasChanges && (
          <Button onClick={saveAll} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> Salvează {Object.keys(edited).length} modificări
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută produs sau SKU..." className="pl-9" />
        </div>
        <div className="flex gap-1">
          {(["all", "out", "critical", "ok"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition ${filter === f ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f === "all" ? "Toate" : f === "out" ? "Epuizate" : f === "critical" ? "Critice" : "În stoc"}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Produs</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">SKU</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Categorie</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Stoc</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Prag</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Val. Stoc</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = getStockStatus(p);
                  const currentStock = edited[p.id] ?? p.stock ?? 0;
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {p.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                          <span className="font-medium text-foreground truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                      <td className="p-3 text-muted-foreground">{getCatName(p.category_id)}</td>
                      <td className="p-3 text-center">
                        <input type="number" value={currentStock}
                          onChange={e => handleStockChange(p.id, Number(e.target.value))}
                          className={`w-20 rounded border px-2 py-1 text-center text-sm font-medium ${edited[p.id] !== undefined ? "border-accent bg-accent/5" : "border-border bg-transparent"}`}
                        />
                      </td>
                      <td className="p-3 text-center text-muted-foreground">{p.min_stock_alert ?? 5}</td>
                      <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span></td>
                      <td className="p-3 text-right font-medium">{(currentStock * (p.cost_price || p.price || 0)).toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
