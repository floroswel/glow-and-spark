import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, subscribers: 0, revenue: 0 });

  useEffect(() => {
    async function loadStats() {
      const [productsRes, ordersRes, subsRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total"),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      ]);
      const revenue = (ordersRes.data || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      setStats({
        products: productsRes.count || 0,
        orders: (ordersRes.data || []).length,
        subscribers: subsRes.count || 0,
        revenue,
      });
    }
    loadStats();
  }, []);

  const cards = [
    { label: "Produse", value: stats.products, icon: Package, color: "text-accent" },
    { label: "Comenzi", value: stats.orders, icon: ShoppingCart, color: "text-chart-2" },
    { label: "Abonați", value: stats.subscribers, icon: Users, color: "text-chart-1" },
    { label: "Venituri", value: `${stats.revenue.toFixed(2)} RON`, icon: TrendingUp, color: "text-chart-3" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Bine ai venit în panoul de administrare Lumini.ro</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
