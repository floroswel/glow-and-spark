import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, ArrowUp, ArrowDown, Download, Package } from "lucide-react";

export const Route = createFileRoute("/admin/reports/profit")({
  component: ProfitReport,
});

function ProfitReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const since = new Date(); since.setDate(since.getDate() - Number(period));
    Promise.all([
      supabase.from("orders").select("items, total, shipping_cost, discount_amount, created_at, status").gte("created_at", since.toISOString()).not("status", "eq", "cancelled"),
      supabase.from("products").select("id, name, price, cost_price, category_id"),
      supabase.from("categories").select("id, name"),
    ]).then(([o, p, c]) => {
      setOrders(o.data || []);
      setProducts(p.data || []);
      setCategories(c.data || []);
      setLoading(false);
    });
  }, [period]);

  const stats = useMemo(() => {
    let revenue = 0, cogs = 0, shipping = 0, discounts = 0;
    const catProfit: Record<string, { revenue: number; cost: number; name: string }> = {};

    orders.forEach(o => {
      revenue += o.total || 0;
      shipping += o.shipping_cost || 0;
      discounts += o.discount_amount || 0;
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const prod = products.find(p => p.id === (item.id || item.product_id));
        const cost = (prod?.cost_price || 0) * (item.quantity || 1);
        cogs += cost;
        const catId = prod?.category_id || "uncategorized";
        const catName = categories.find(c => c.id === catId)?.name || "Fără categorie";
        if (!catProfit[catId]) catProfit[catId] = { revenue: 0, cost: 0, name: catName };
        catProfit[catId].revenue += (item.price || 0) * (item.quantity || 1);
        catProfit[catId].cost += cost;
      });
    });

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - shipping;
    const margin = revenue ? (grossProfit / revenue) * 100 : 0;
    const vat = revenue * 0.19 / 1.19;

    return { revenue, cogs, grossProfit, netProfit, shipping, discounts, margin, vat, catProfit: Object.values(catProfit).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost)) };
  }, [orders, products, categories]);

  const fmt = (n: number) => n.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-secondary animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">💰 Profit & Costuri</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="7">7 zile</option><option value="30">30 zile</option><option value="90">90 zile</option><option value="365">1 an</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Venituri totale", value: `${fmt(stats.revenue)} RON`, color: "text-foreground" },
          { label: "Cost mărfuri (COGS)", value: `${fmt(stats.cogs)} RON`, color: "text-red-500" },
          { label: "Profit brut", value: `${fmt(stats.grossProfit)} RON`, color: "text-accent" },
          { label: "Marjă", value: `${stats.margin.toFixed(1)}%`, color: "text-accent" },
        ].map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Cost livrare</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmt(stats.shipping)} RON</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Discount-uri acordate</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmt(stats.discounts)} RON</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">TVA colectat (estimat)</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmt(stats.vat)} RON</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Profit per categorie</h3>
        {stats.catProfit.length === 0 ? <p className="text-muted-foreground text-sm">Nu sunt date</p> : (
          <div className="space-y-3">
            {stats.catProfit.map((c, i) => {
              const profit = c.revenue - c.cost;
              const margin = c.revenue ? (profit / c.revenue) * 100 : 0;
              const maxProfit = stats.catProfit[0] ? stats.catProfit[0].revenue - stats.catProfit[0].cost : 1;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground w-40 truncate">{c.name}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${maxProfit > 0 ? (profit / maxProfit) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium text-foreground w-24 text-right">{fmt(profit)} RON</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{margin.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
