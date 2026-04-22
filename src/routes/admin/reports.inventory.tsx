import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, DollarSign, AlertTriangle, BarChart3, Search, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/reports/inventory")({
  component: AdminInventoryReport,
});

const PAGE_SIZE = 30;

function AdminInventoryReport() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from("products").select("id, name, sku, price, cost_price, stock, min_stock_alert, category_id, is_active, image_url"),
      supabase.from("categories").select("id, name"),
    ]);
    setProducts(pRes.data || []);
    setCategories(cRes.data || []);
    setLoading(false);
  }

  const getCatName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";

  const filtered = useMemo(() => {
    let list = [...products];
    if (filterCat !== "all") list = list.filter(p => p.category_id === filterCat);
    if (filterStock === "out") list = list.filter(p => (p.stock || 0) <= 0);
    if (filterStock === "low") list = list.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.min_stock_alert || 5));
    if (filterStock === "ok") list = list.filter(p => (p.stock || 0) > (p.min_stock_alert || 5));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    return list;
  }, [products, filterCat, filterStock, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const totalRetailValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);
    const totalCostValue = products.reduce((s, p) => s + (p.cost_price || 0) * (p.stock || 0), 0);
    const totalUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
    const outOfStock = products.filter(p => (p.stock || 0) <= 0 && p.is_active).length;
    const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.min_stock_alert || 5) && p.is_active).length;
    const potentialProfit = totalRetailValue - totalCostValue;
    return { totalRetailValue, totalCostValue, totalUnits, outOfStock, lowStock, potentialProfit };
  }, [products]);

  const exportCSV = () => {
    const headers = ["Produs", "SKU", "Categorie", "Stoc", "Preț vânzare", "Cost", "Valoare retail", "Valoare cost", "Profit potențial"];
    const rows = filtered.map(p => [
      p.name, p.sku || "", getCatName(p.category_id), p.stock || 0,
      (p.price || 0).toFixed(2), (p.cost_price || 0).toFixed(2),
      ((p.price || 0) * (p.stock || 0)).toFixed(2),
      ((p.cost_price || 0) * (p.stock || 0)).toFixed(2),
      (((p.price || 0) - (p.cost_price || 0)) * (p.stock || 0)).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inventar_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Raport Inventar & Valoare Stoc</h1>
          <p className="text-sm text-muted-foreground">{products.length} produse în catalog</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary transition">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 py-2 text-sm hover:opacity-90 transition">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Valoare retail", value: `${stats.totalRetailValue.toFixed(0)} RON`, icon: DollarSign, color: "text-accent" },
          { label: "Valoare cost", value: `${stats.totalCostValue.toFixed(0)} RON`, icon: DollarSign, color: "text-chart-1" },
          { label: "Profit potențial", value: `${stats.potentialProfit.toFixed(0)} RON`, icon: BarChart3, color: "text-chart-2" },
          { label: "Unități totale", value: stats.totalUnits, icon: Package, color: "text-chart-4" },
          { label: "Stoc epuizat", value: stats.outOfStock, icon: AlertTriangle, color: "text-destructive" },
          { label: "Stoc scăzut", value: stats.lowStock, icon: AlertTriangle, color: "text-accent" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="mt-1.5 text-lg font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Caută produs sau SKU..." className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">Toate categoriile</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStock} onChange={e => { setFilterStock(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">Tot stocul</option>
          <option value="out">Epuizat</option>
          <option value="low">Stoc scăzut</option>
          <option value="ok">Stoc OK</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Produs</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">SKU</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Categorie</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Stoc</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Preț</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Cost</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Val. retail</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Val. cost</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-12 text-center text-muted-foreground">Niciun produs.</td></tr>
            ) : paginated.map(p => {
              const retailVal = (p.price || 0) * (p.stock || 0);
              const costVal = (p.cost_price || 0) * (p.stock || 0);
              const profit = retailVal - costVal;
              const isLow = (p.stock || 0) <= (p.min_stock_alert || 5) && (p.stock || 0) > 0;
              const isOut = (p.stock || 0) <= 0;
              return (
                <tr key={p.id} className={`hover:bg-muted/20 transition ${isOut ? "bg-destructive/5" : isLow ? "bg-accent/5" : ""}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                      <span className="font-medium truncate max-w-[180px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.sku || "—"}</td>
                  <td className="px-3 py-2.5 text-xs">{getCatName(p.category_id)}</td>
                  <td className={`px-3 py-2.5 text-right font-bold ${isOut ? "text-destructive" : isLow ? "text-accent" : "text-foreground"}`}>{p.stock || 0}</td>
                  <td className="px-3 py-2.5 text-right">{(p.price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{(p.cost_price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{retailVal.toFixed(0)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{costVal.toFixed(0)}</td>
                  <td className={`px-3 py-2.5 text-right font-bold ${profit >= 0 ? "text-chart-2" : "text-destructive"}`}>{profit.toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/20 border-t-2 border-border">
            <tr>
              <td colSpan={6} className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">TOTAL:</td>
              <td className="px-3 py-2.5 text-right font-bold text-foreground">{stats.totalRetailValue.toFixed(0)} RON</td>
              <td className="px-3 py-2.5 text-right font-bold text-muted-foreground">{stats.totalCostValue.toFixed(0)} RON</td>
              <td className="px-3 py-2.5 text-right font-bold text-chart-2">{stats.potentialProfit.toFixed(0)} RON</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Pagina {page} din {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border px-2 py-1 text-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border px-2 py-1 text-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
