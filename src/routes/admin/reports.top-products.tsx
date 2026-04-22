import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Package, Download, Calendar } from "lucide-react";

export const Route = createFileRoute("/admin/reports/top-products")({
  component: TopProducts,
});

function TopProducts() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [sortBy, setSortBy] = useState<"qty" | "revenue">("revenue");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    const since = new Date(); since.setDate(since.getDate() - Number(period));
    Promise.all([
      supabase.from("orders").select("items, total, created_at").gte("created_at", since.toISOString()).not("status", "eq", "cancelled"),
      supabase.from("products").select("id, name, slug, price, cost_price, image_url, category_id, stock"),
      supabase.from("categories").select("id, name"),
    ]).then(([o, p, c]) => {
      setOrders(o.data || []);
      setProducts(p.data || []);
      setCategories(c.data || []);
      setLoading(false);
    });
  }, [period]);

  const productStats = useMemo(() => {
    const stats: Record<string, { qty: number; revenue: number; name: string; image: string; catId: string | null; price: number; cost: number }> = {};
    orders.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const pid = item.id || item.product_id;
        if (!pid) return;
        if (!stats[pid]) {
          const prod = products.find(p => p.id === pid);
          stats[pid] = { qty: 0, revenue: 0, name: prod?.name || item.name || "?", image: prod?.image_url || "", catId: prod?.category_id, price: prod?.price || 0, cost: prod?.cost_price || 0 };
        }
        stats[pid].qty += item.quantity || 1;
        stats[pid].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });
    let arr = Object.entries(stats).map(([id, s]) => ({ id, ...s, profit: s.revenue - (s.cost * s.qty) }));
    if (filterCat !== "all") arr = arr.filter(p => p.catId === filterCat);
    arr.sort((a, b) => sortBy === "revenue" ? b.revenue - a.revenue : b.qty - a.qty);
    return arr.slice(0, 50);
  }, [orders, products, sortBy, filterCat]);

  const maxVal = productStats[0]?.[sortBy] || 1;

  const exportCSV = () => {
    const csv = "Produs,Cantitate,Revenue,Profit\n" + productStats.map(p => `"${p.name}",${p.qty},${p.revenue.toFixed(2)},${p.profit.toFixed(2)}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "top-produse.csv"; a.click();
  };

  if (loading) return <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-secondary animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">🏆 Top Produse</h1>
        <div className="flex gap-2 flex-wrap">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="7">Ultimele 7 zile</option><option value="30">Ultimele 30 zile</option><option value="90">Ultimele 90 zile</option><option value="365">Ultimul an</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Toate categoriile</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="revenue">După venituri</option><option value="qty">După cantitate</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm"><Download className="h-4 w-4" />Export</button>
        </div>
      </div>

      {productStats.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Niciun produs vândut în această perioadă</p>
      ) : (
        <div className="space-y-2">
          {productStats.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3">
              <span className="text-lg font-bold text-muted-foreground w-8 text-right">#{i + 1}</span>
              {p.image ? <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.qty} vândute • {p.revenue.toFixed(0)} RON • Profit: {p.profit.toFixed(0)} RON</p>
              </div>
              <div className="w-32 hidden md:block">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(p[sortBy] / maxVal) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
