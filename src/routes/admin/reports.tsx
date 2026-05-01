import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, TrendingUp, Package, ShoppingCart, Users, Download,
  Calendar, DollarSign, ArrowUp, ArrowDown, Percent, Clock,
  Star, RefreshCw, CreditCard, Layers
} from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [period, setPeriod] = useState("30");
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - Number(period));
      const sinceStr = since.toISOString();

      const previousSince = new Date();
      previousSince.setDate(previousSince.getDate() - Number(period) * 2);
      const previousSinceStr = previousSince.toISOString();

      const [ordersRes, allOrdersRes, productsRes, customersRes, categoriesRes] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", sinceStr),
        supabase.from("orders").select("*").gte("created_at", previousSinceStr).lt("created_at", sinceStr),
        supabase.from("products").select("id, name, slug, price, image_url, category_id, stock"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("categories").select("id, name"),
      ]);

      setOrders(ordersRes.data || []);
      setAllOrders(allOrdersRes.data || []);
      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
      setCategories(categoriesRes.data || []);
      setLoading(false);
    })();
  }, [period]);

  const stats = useMemo(() => {
    const nonCancelled = orders.filter((o: any) => o.status !== "cancelled");
    const prevNonCancelled = allOrders.filter((o: any) => o.status !== "cancelled");
    const totalRevenue = nonCancelled.reduce((s, o: any) => s + Number(o.total || 0), 0);
    const prevRevenue = prevNonCancelled.reduce((s, o: any) => s + Number(o.total || 0), 0);

    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o: any) => { ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1; });

    const paymentMethods: Record<string, { count: number; revenue: number }> = {};
    nonCancelled.forEach((o: any) => {
      const m = o.payment_method || "necunoscut";
      if (!paymentMethods[m]) paymentMethods[m] = { count: 0, revenue: 0 };
      paymentMethods[m].count++;
      paymentMethods[m].revenue += Number(o.total || 0);
    });

    const productCounts: Record<string, { name: string; count: number; revenue: number; image_url?: string }> = {};
    orders.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const key = item.name || "Necunoscut";
        if (!productCounts[key]) productCounts[key] = { name: key, count: 0, revenue: 0, image_url: item.image_url };
        productCounts[key].count += Number(item.quantity || item.qty || 1);
        productCounts[key].revenue += Number(item.price || 0) * Number(item.quantity || item.qty || 1);
      });
    });
    const topProducts = Object.values(productCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 15);

    // Category revenue
    const catRevenue: Record<string, number> = {};
    orders.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const prod = products.find(p => p.name === item.name);
        const catId = prod?.category_id || "uncategorized";
        catRevenue[catId] = (catRevenue[catId] || 0) + Number(item.price || 0) * Number(item.quantity || item.qty || 1);
      });
    });

    // Revenue by day
    const dailyMap: Record<string, number> = {};
    nonCancelled.forEach((o: any) => {
      const key = new Date(o.created_at).toISOString().split("T")[0];
      dailyMap[key] = (dailyMap[key] || 0) + Number(o.total || 0);
    });
    const revenueByDay = Object.entries(dailyMap).sort().map(([day, total]) => ({ day, total }));

    // Revenue by month
    const monthMap: Record<string, number> = {};
    nonCancelled.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + Number(o.total || 0);
    });
    const revenueByMonth = Object.entries(monthMap).sort().map(([month, total]) => ({ month, total }));

    // Hourly distribution
    const hourlyMap: Record<number, number> = {};
    orders.forEach((o: any) => {
      const h = new Date(o.created_at).getHours();
      hourlyMap[h] = (hourlyMap[h] || 0) + 1;
    });

    const cancelled = orders.filter((o: any) => o.status === "cancelled").length;
    const completed = orders.filter((o: any) => o.status === "completed" || o.status === "delivered").length;

    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = allOrders.length > 0 ? ((orders.length - allOrders.length) / allOrders.length) * 100 : 0;

    return {
      totalRevenue,
      prevRevenue,
      revenueChange,
      ordersChange,
      totalOrders: orders.length,
      avgOrderValue: nonCancelled.length ? totalRevenue / nonCancelled.length : 0,
      totalCustomers: customers.length,
      totalProducts: products.length,
      ordersByStatus,
      paymentMethods,
      topProducts,
      catRevenue,
      revenueByDay,
      revenueByMonth,
      hourlyMap,
      conversionRate: orders.length ? Math.round((completed / orders.length) * 100) : 0,
      cancelledRate: orders.length ? Math.round((cancelled / orders.length) * 100) : 0,
      lowStockProducts: products.filter(p => (p.stock ?? 0) <= 5).length,
    };
  }, [orders, allOrders, products, customers]);

  const statusLabels: Record<string, string> = {
    pending: "În așteptare", processing: "Se procesează",
    completed: "Finalizată", cancelled: "Anulată", shipped: "Expediată", delivered: "Livrată", refunded: "Rambursată",
  };

  const handleExportReport = () => {
    let csv = "Raport Mama Lucica\n\n";
    csv += `Perioadă: Ultimele ${period} zile\n`;
    csv += `Venituri: ${stats.totalRevenue.toFixed(2)} RON\n`;
    csv += `Comenzi: ${stats.totalOrders}\n`;
    csv += `Valoare medie: ${stats.avgOrderValue.toFixed(2)} RON\n`;
    csv += `Rată finalizare: ${stats.conversionRate}%\n`;
    csv += `Rată anulare: ${stats.cancelledRate}%\n\n`;
    csv += "Venituri pe zi\nZi,Total\n";
    stats.revenueByDay.forEach(r => { csv += `${r.day},${r.total.toFixed(2)}\n`; });
    csv += "\nVenituri pe lună\nLună,Total\n";
    stats.revenueByMonth.forEach(r => { csv += `${r.month},${r.total.toFixed(2)}\n`; });
    csv += "\nTop Produse\nProdus,Cantitate,Venituri\n";
    stats.topProducts.forEach(p => { csv += `"${p.name}",${p.count},${p.revenue.toFixed(2)}\n`; });
    csv += "\nMetode plată\nMetodă,Comenzi,Venituri\n";
    Object.entries(stats.paymentMethods).forEach(([m, d]) => { csv += `"${m}",${d.count},${d.revenue.toFixed(2)}\n`; });
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `raport-${period}zile-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    showToast("📥 Raport exportat!");
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}</div>
      <div className="grid grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}</div>
    </div>
  );

  const maxMonthRevenue = Math.max(...stats.revenueByMonth.map(r => r.total), 1);
  const maxDayRevenue = Math.max(...stats.revenueByDay.map(r => r.total), 1);
  const maxHourly = Math.max(...Object.values(stats.hourlyMap), 1);

  const ChangeIndicator = ({ value }: { value: number }) => (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${value >= 0 ? "text-chart-2" : "text-destructive"}`}>
      {value >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Rapoarte</h1>
          <p className="text-sm text-muted-foreground">Ultimele {period} zile vs. perioada anterioară</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-border px-4 py-2 text-sm focus:border-accent focus:outline-none">
            <option value="7">7 zile</option>
            <option value="30">30 zile</option>
            <option value="90">90 zile</option>
            <option value="180">6 luni</option>
            <option value="365">1 an</option>
          </select>
          <button onClick={handleExportReport} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Main KPIs with trends */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-chart-2" />
            <ChangeIndicator value={stats.revenueChange} />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalRevenue.toFixed(0)} RON</p>
          <p className="text-xs text-muted-foreground">Venituri totale</p>
          <p className="text-[10px] text-muted-foreground mt-1">Anterior: {stats.prevRevenue.toFixed(0)} RON</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            <ChangeIndicator value={stats.ordersChange} />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Comenzi</p>
          <p className="text-[10px] text-muted-foreground mt-1">Anterior: {allOrders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <DollarSign className="h-5 w-5 text-chart-3 mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.avgOrderValue.toFixed(0)} RON</p>
          <p className="text-xs text-muted-foreground">Valoare medie comandă</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Percent className="h-5 w-5 text-chart-2 mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.conversionRate}%</p>
          <p className="text-xs text-muted-foreground">Rată finalizare</p>
          <p className="text-[10px] text-destructive mt-1">{stats.cancelledRate}% anulate</p>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Produse", value: stats.totalProducts, icon: Package },
          { label: "Clienți", value: stats.totalCustomers, icon: Users },
          { label: "Stoc scăzut", value: stats.lowStockProducts, icon: Layers, color: stats.lowStockProducts > 0 ? "text-destructive" : "text-muted-foreground" },
          ...Object.entries(stats.ordersByStatus).slice(0, 3).map(([k, v]) => ({
            label: statusLabels[k] || k, value: v, icon: Clock,
          })),
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <s.icon className={`h-4 w-4 ${"color" in s ? (s as any).color : "text-muted-foreground"} mb-1`} />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: "overview", label: "📊 Grafice" },
            { key: "products", label: "🏆 Top Produse" },
            { key: "payments", label: "💳 Plăți" },
            { key: "hourly", label: "🕐 Pe ore" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition whitespace-nowrap ${activeTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by month */}
            {stats.revenueByMonth.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Venituri pe Lună</h2>
                <div className="space-y-3">
                  {stats.revenueByMonth.map(r => (
                    <div key={r.month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16 shrink-0 font-mono">{r.month}</span>
                      <div className="flex-1 h-7 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all flex items-center justify-end pr-2" style={{ width: `${Math.max((r.total / maxMonthRevenue) * 100, 8)}%` }}>
                          {(r.total / maxMonthRevenue) * 100 > 30 && <span className="text-[10px] text-accent-foreground font-medium">{r.total.toFixed(0)}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-foreground w-20 text-right">{r.total.toFixed(0)} RON</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders by status */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Comenzi pe Status</h2>
              <div className="space-y-3">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{statusLabels[status] || status}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-24 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${stats.totalOrders ? (count / stats.totalOrders) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-bold text-foreground w-8 text-right">{count}</span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right">{stats.totalOrders ? Math.round((count / stats.totalOrders) * 100) : 0}%</span>
                    </div>
                  </div>
                ))}
                {!Object.keys(stats.ordersByStatus).length && <p className="text-sm text-muted-foreground">Nicio comandă.</p>}
              </div>
            </div>

            {/* Revenue by day (mini chart) */}
            {stats.revenueByDay.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-5 col-span-1 lg:col-span-2">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Venituri Zilnice</h2>
                <div className="flex items-end gap-[2px] h-40">
                  {stats.revenueByDay.map((d, i) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center group relative" title={`${d.day}: ${d.total.toFixed(0)} RON`}>
                      <div className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all" style={{ height: `${Math.max((d.total / maxDayRevenue) * 100, 2)}%` }} />
                      <div className="absolute -top-6 bg-foreground text-primary-foreground text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition pointer-events-none">
                        {d.total.toFixed(0)} RON
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{stats.revenueByDay[0]?.day}</span>
                  <span className="text-[10px] text-muted-foreground">{stats.revenueByDay[stats.revenueByDay.length - 1]?.day}</span>
                </div>
              </div>
            )}

            {/* Categories revenue */}
            {Object.keys(stats.catRevenue).length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Venituri pe Categorie</h2>
                <div className="space-y-3">
                  {Object.entries(stats.catRevenue).sort((a, b) => b[1] - a[1]).map(([catId, revenue]) => {
                    const cat = categories.find(c => c.id === catId);
                    const maxCatRev = Math.max(...Object.values(stats.catRevenue));
                    return (
                      <div key={catId} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-28 truncate">{cat?.name || "Necategorizat"}</span>
                        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-chart-1 rounded-full" style={{ width: `${(revenue / maxCatRev) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-foreground w-20 text-right">{revenue.toFixed(0)} RON</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Top Produse Vândute</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left pb-3 font-medium text-muted-foreground">Produs</th>
                  <th className="text-center pb-3 font-medium text-muted-foreground">Cantitate</th>
                  <th className="text-right pb-3 font-medium text-muted-foreground">Venituri</th>
                  <th className="text-right pb-3 font-medium text-muted-foreground">% din total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.topProducts.map((p, i) => (
                  <tr key={p.name} className="hover:bg-secondary/30 transition">
                    <td className="py-3 text-muted-foreground w-8">
                      {i < 3 ? <span className="text-accent font-bold">{["🥇", "🥈", "🥉"][i]}</span> : i + 1}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover border border-border" />}
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-xs font-medium">{p.count}</span>
                    </td>
                    <td className="py-3 text-right font-semibold text-foreground">{p.revenue.toFixed(0)} RON</td>
                    <td className="py-3 text-right text-muted-foreground text-xs">
                      {stats.totalRevenue > 0 ? ((p.revenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.topProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nicio vânzare în această perioadă.</p>}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Metode de Plată</h2>
              <div className="space-y-4">
                {Object.entries(stats.paymentMethods).map(([method, data]) => (
                  <div key={method} className="flex items-center gap-4">
                    <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground capitalize">{method}</span>
                        <span className="text-xs text-muted-foreground">{data.count} comenzi</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${stats.totalOrders ? (data.count / stats.totalOrders) * 100 : 0}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{data.revenue.toFixed(0)} RON</p>
                    </div>
                  </div>
                ))}
                {Object.keys(stats.paymentMethods).length === 0 && <p className="text-sm text-muted-foreground">Nicio plată.</p>}
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Pâlnie Conversie</h2>
              <div className="space-y-3">
                {[
                  { label: "Comenzi plasate", value: stats.totalOrders, pct: 100 },
                  { label: "Procesate", value: (stats.ordersByStatus["processing"] || 0) + (stats.ordersByStatus["shipped"] || 0) + (stats.ordersByStatus["delivered"] || 0) + (stats.ordersByStatus["completed"] || 0), pct: stats.totalOrders ? Math.round(((stats.totalOrders - (stats.ordersByStatus["pending"] || 0) - (stats.ordersByStatus["cancelled"] || 0)) / stats.totalOrders) * 100) : 0 },
                  { label: "Livrate/Finalizate", value: (stats.ordersByStatus["delivered"] || 0) + (stats.ordersByStatus["completed"] || 0), pct: stats.conversionRate },
                ].map((step, i) => (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{step.label}</span>
                      <span className="text-sm font-bold text-foreground">{step.value} ({step.pct}%)</span>
                    </div>
                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                      <div className={`h-full rounded-lg transition-all ${i === 0 ? "bg-chart-1/50" : i === 1 ? "bg-chart-2/50" : "bg-accent"}`} style={{ width: `${step.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "hourly" && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Comenzi pe Ore (distribuție)</h2>
            <div className="flex items-end gap-1 h-48">
              {Array.from({ length: 24 }, (_, h) => {
                const count = stats.hourlyMap[h] || 0;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center group relative">
                    <div className="w-full bg-accent/70 hover:bg-accent rounded-t transition-all" style={{ height: `${Math.max((count / maxHourly) * 100, 2)}%` }} />
                    <span className="text-[9px] text-muted-foreground mt-1">{h}</span>
                    <div className="absolute -top-6 bg-foreground text-primary-foreground text-[9px] px-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition pointer-events-none">
                      {count} comenzi
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">Ora zilei (0-23) · Arată când cumpără clienții tăi</p>
          </div>
        )}
      </div>
    </div>
  );
}
