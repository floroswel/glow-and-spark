import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Package, ShoppingCart, Users, Download } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    ordersByStatus: {} as Record<string, number>,
    topProducts: [] as any[],
    revenueByMonth: [] as { month: string; total: number }[],
    conversionRate: 0,
    cancelledRate: 0,
  });
  const [period, setPeriod] = useState("30");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - Number(period));
      const sinceStr = since.toISOString();

      const [ordersRes, productsRes, customersRes] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", sinceStr),
        supabase.from("products").select("id, name, slug, price, image_url"),
        supabase.from("profiles").select("id"),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.filter((o: any) => o.status !== "cancelled").reduce((s, o: any) => s + Number(o.total || 0), 0);
      const ordersByStatus: Record<string, number> = {};
      orders.forEach((o: any) => { ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1; });

      const cancelled = orders.filter((o: any) => o.status === "cancelled").length;
      const completed = orders.filter((o: any) => o.status === "completed" || o.status === "delivered").length;

      const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          if (!productCounts[item.name]) productCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
          productCounts[item.name].count += Number(item.quantity || item.qty || 1);
          productCounts[item.name].revenue += Number(item.price || 0) * Number(item.quantity || item.qty || 1);
        });
      });
      const topProducts = Object.values(productCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

      const monthMap: Record<string, number> = {};
      orders.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = (monthMap[key] || 0) + Number(o.total || 0);
      });
      const revenueByMonth = Object.entries(monthMap).sort().map(([month, total]) => ({ month, total }));

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
        totalCustomers: customersRes.data?.length || 0,
        totalProducts: productsRes.data?.length || 0,
        ordersByStatus,
        topProducts,
        revenueByMonth,
        conversionRate: orders.length ? Math.round((completed / orders.length) * 100) : 0,
        cancelledRate: orders.length ? Math.round((cancelled / orders.length) * 100) : 0,
      });
      setLoading(false);
    })();
  }, [period]);

  const handleExportReport = () => {
    let csv = "Raport LUMINI.RO\n\n";
    csv += `Perioadă: Ultimele ${period} zile\n`;
    csv += `Venituri: ${stats.totalRevenue.toFixed(2)} lei\n`;
    csv += `Comenzi: ${stats.totalOrders}\n`;
    csv += `Valoare medie: ${stats.avgOrderValue.toFixed(2)} lei\n`;
    csv += `Clienți: ${stats.totalCustomers}\n\n`;
    csv += "Venituri pe lună\nLună,Total\n";
    stats.revenueByMonth.forEach(r => { csv += `${r.month},${r.total.toFixed(2)}\n`; });
    csv += "\nTop Produse\nProdus,Cantitate,Venituri\n";
    stats.topProducts.forEach(p => { csv += `"${p.name}",${p.count},${p.revenue.toFixed(2)}\n`; });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `raport-${period}zile.csv`; a.click();
    showToast("Raport exportat!");
  };

  const statusLabels: Record<string, string> = {
    pending: "În așteptare", processing: "Se procesează",
    completed: "Finalizată", cancelled: "Anulată", shipped: "Expediată", delivered: "Livrată",
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;

  const maxRevenue = Math.max(...stats.revenueByMonth.map(r => r.total), 1);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Rapoarte</h1>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => { setLoading(true); setPeriod(e.target.value); }}
            className="rounded-lg border border-border px-4 py-2 text-sm focus:border-accent focus:outline-none">
            <option value="7">Ultimele 7 zile</option>
            <option value="30">Ultimele 30 zile</option>
            <option value="90">Ultimele 90 zile</option>
            <option value="365">Ultimul an</option>
          </select>
          <button onClick={handleExportReport} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Venituri", value: `${stats.totalRevenue.toFixed(2)} lei`, icon: TrendingUp },
          { label: "Comenzi", value: stats.totalOrders, icon: ShoppingCart },
          { label: "Valoare Medie", value: `${stats.avgOrderValue.toFixed(2)} lei`, icon: BarChart3 },
          { label: "Clienți", value: stats.totalCustomers, icon: Users },
          { label: "Produse", value: stats.totalProducts, icon: Package },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className="h-5 w-5 text-accent" />
            <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Conversion & cancellation rates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Rată finalizare</p>
          <p className="text-2xl font-bold text-chart-2">{stats.conversionRate}%</p>
          <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-chart-2 rounded-full transition-all" style={{ width: `${stats.conversionRate}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Rată anulare</p>
          <p className="text-2xl font-bold text-destructive">{stats.cancelledRate}%</p>
          <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${stats.cancelledRate}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.revenueByMonth.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Venituri pe Lună</h2>
            <div className="space-y-3">
              {stats.revenueByMonth.map(r => (
                <div key={r.month} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{r.month}</span>
                  <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(r.total / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-24 text-right">{r.total.toFixed(0)} lei</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Comenzi pe Status</h2>
          <div className="space-y-3">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{statusLabels[status] || status}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${stats.totalOrders ? (count / stats.totalOrders) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-bold text-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
            {!Object.keys(stats.ordersByStatus).length && <p className="text-sm text-muted-foreground">Nicio comandă în această perioadă.</p>}
          </div>
        </div>
      </div>

      {stats.topProducts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Top Produse Vândute</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 font-semibold text-muted-foreground">#</th>
                <th className="text-left pb-2 font-semibold text-muted-foreground">Produs</th>
                <th className="text-center pb-2 font-semibold text-muted-foreground">Cantitate</th>
                <th className="text-right pb-2 font-semibold text-muted-foreground">Venituri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.topProducts.map((p, i) => (
                <tr key={p.name}>
                  <td className="py-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 font-medium text-foreground">{p.name}</td>
                  <td className="py-2 text-center text-muted-foreground">{p.count}</td>
                  <td className="py-2 text-right font-semibold text-foreground">{p.revenue.toFixed(2)} lei</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
