import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, AlertTriangle, TrendingDown, ArrowUpDown, Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/stock")({
  component: StockDashboard,
});

function StockDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pRes, wRes, mRes] = await Promise.all([
        supabase.from("products").select("id, name, slug, image_url, stock, min_stock_alert, price, cost_price, category_id, is_active").order("stock", { ascending: true }),
        supabase.from("warehouses").select("*").eq("is_active", true),
        supabase.from("stock_movements").select("*, products(name)").order("created_at", { ascending: false }).limit(20),
      ]);
      setProducts(pRes.data || []);
      setWarehouses(wRes.data || []);
      setMovements(mRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(p => (p.stock ?? 0) <= 0).length;
    const critical = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.min_stock_alert ?? 5)).length;
    const totalValue = products.reduce((s, p) => s + (p.stock ?? 0) * (p.cost_price || p.price || 0), 0);
    const totalUnits = products.reduce((s, p) => s + (p.stock ?? 0), 0);
    return { total, outOfStock, critical, totalValue, totalUnits };
  }, [products]);

  const criticalProducts = useMemo(() =>
    products.filter(p => (p.stock ?? 0) <= (p.min_stock_alert ?? 5)).slice(0, 10),
  [products]);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
    </div>
  );

  const kpis = [
    { label: "Total Produse", value: stats.total, icon: Package, color: "text-accent" },
    { label: "Unități în Stoc", value: stats.totalUnits.toLocaleString("ro-RO"), icon: Warehouse, color: "text-chart-2" },
    { label: "Valoare Stoc", value: `${stats.totalValue.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON`, icon: TrendingDown, color: "text-chart-1" },
    { label: "Epuizate", value: stats.outOfStock, icon: AlertTriangle, color: "text-destructive" },
    { label: "Stoc Critic", value: stats.critical, icon: AlertTriangle, color: "text-amber-500" },
  ];

  const movementTypeLabels: Record<string, string> = {
    entry: "Intrare", exit: "Ieșire", transfer_in: "Transfer Intrare", transfer_out: "Transfer Ieșire",
    adjustment: "Ajustare", return: "Retur",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">📦 Stoc & Depozit</h1>
        <div className="flex gap-2">
          <Link to="/admin/stock/manager" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition">Manager Stoc</Link>
          <Link to="/admin/stock/warehouses" className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">Depozite</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Critical Stock */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Produse cu Stoc Critic
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criticalProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Toate produsele au stoc suficient 🎉</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {criticalProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Prag: {p.min_stock_alert ?? 5}</p>
                    </div>
                    <span className={`text-sm font-bold ${(p.stock ?? 0) <= 0 ? "text-destructive" : "text-amber-500"}`}>
                      {p.stock ?? 0} buc.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-accent" /> Mișcări Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nicio mișcare de stoc înregistrată</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {movements.map(m => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <div className={`h-8 w-8 rounded flex items-center justify-center text-xs font-bold ${
                      m.movement_type?.includes("entry") || m.movement_type === "return" ? "bg-chart-2/10 text-chart-2" :
                      m.movement_type?.includes("exit") ? "bg-destructive/10 text-destructive" :
                      "bg-accent/10 text-accent"
                    }`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{(m as any).products?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{movementTypeLabels[m.movement_type] || m.movement_type} · {m.reason || "—"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: "/admin/stock/movements", label: "Mișcări Stoc", icon: "📋" },
          { to: "/admin/stock/transfers", label: "Transferuri", icon: "🔄" },
          { to: "/admin/stock/adjustments", label: "Ajustări", icon: "✏️" },
          { to: "/admin/stock/suppliers", label: "Furnizori", icon: "🏭" },
          { to: "/admin/stock/purchase-orders", label: "Comenzi Furnizori", icon: "📄" },
          { to: "/admin/stock/batches", label: "Loturi & Expirare", icon: "📦" },
          { to: "/admin/stock/alerts", label: "Alerte Stoc", icon: "🔔" },
          { to: "/admin/stock/inventory", label: "Inventar", icon: "📊" },
        ].map(link => (
          <Link key={link.to} to={link.to as any} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition">
            <span className="text-2xl">{link.icon}</span>
            <span className="text-sm font-medium text-foreground">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
