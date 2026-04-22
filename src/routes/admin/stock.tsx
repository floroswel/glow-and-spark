import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/stock")({
  component: StockLayout,
});

function StockLayout() {
  const location = useLocation();
  const isIndex = location.pathname === "/admin/stock" || location.pathname === "/admin/stock/";
  
  if (!isIndex) return <Outlet />;
  
  return <StockDashboard />;
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, AlertTriangle, Warehouse, TrendingUp, ArrowUpDown, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StockDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalValue: 0, outOfStock: 0, lowStock: 0, movements: 0 });

  useEffect(() => {
    (async () => {
      const { data: products } = await supabase.from("products").select("id, stock, price, min_stock_alert, is_active").eq("is_active", true);
      const { count: movCount } = await supabase.from("stock_movements").select("id", { count: "exact", head: true });
      
      const prods = products || [];
      setStats({
        totalProducts: prods.length,
        totalValue: prods.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0),
        outOfStock: prods.filter(p => (p.stock || 0) <= 0).length,
        lowStock: prods.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.min_stock_alert || 5)).length,
        movements: movCount || 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  const cards = [
    { label: "Total Produse", value: stats.totalProducts, icon: Package, color: "text-chart-1" },
    { label: "Valoare Stoc", value: `${stats.totalValue.toLocaleString("ro-RO")} RON`, icon: TrendingUp, color: "text-chart-2" },
    { label: "Epuizate", value: stats.outOfStock, icon: AlertTriangle, color: "text-destructive" },
    { label: "Stoc Critic", value: stats.lowStock, icon: AlertTriangle, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Stoc</h1>
        <p className="text-sm text-muted-foreground">Privire de ansamblu asupra stocurilor</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs">{c.label}</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { to: "/admin/stock/manager", label: "Manager Stoc", desc: "Gestionează stocul pe produse" },
          { to: "/admin/stock/warehouses", label: "Depozite", desc: "Administrează depozitele" },
          { to: "/admin/stock/movements", label: "Mișcări Stoc", desc: "Istoric mișcări" },
          { to: "/admin/stock/transfers", label: "Transferuri", desc: "Transfer între depozite" },
          { to: "/admin/stock/suppliers", label: "Furnizori", desc: "Gestionează furnizori" },
          { to: "/admin/stock/purchase-orders", label: "Comenzi Furnizori", desc: "Comenzi de achiziție" },
          { to: "/admin/stock/batches", label: "Loturi", desc: "Loturi produse" },
          { to: "/admin/stock/alerts", label: "Alerte Stoc", desc: "Configurare alerte" },
        ].map(link => (
          <Link key={link.to} to={link.to as any} className="rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition group">
            <h3 className="font-medium text-foreground group-hover:text-accent transition">{link.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
