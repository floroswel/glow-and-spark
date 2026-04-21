import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, Star, BookOpen, Eye, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  processing: "Se procesează",
  shipped: "Expediată",
  delivered: "Livrată",
  cancelled: "Anulată",
};

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, subscribers: 0, revenue: 0, reviews: 0, blogPosts: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [productsRes, ordersRes, subsRes, reviewsRes, blogRes, recentRes, pendingRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total"),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const revenue = (ordersRes.data || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      setStats({
        products: productsRes.count || 0,
        orders: (ordersRes.data || []).length,
        subscribers: subsRes.count || 0,
        revenue,
        reviews: reviewsRes.count || 0,
        blogPosts: blogRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);
      setPendingReviews(pendingRes.count || 0);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const cards = [
    { label: "Venituri Totale", value: `${stats.revenue.toFixed(2)} RON`, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Comenzi", value: stats.orders, icon: ShoppingCart, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: "Produse", value: stats.products, icon: Package, color: "text-chart-1", bg: "bg-chart-1/10" },
    { label: "Abonați", value: stats.subscribers, icon: Users, color: "text-chart-3", bg: "bg-chart-3/10" },
  ];

  const quickLinks = [
    { label: "Adaugă Produs", to: "/admin/products", icon: Package },
    { label: "Vezi Comenzi", to: "/admin/orders", icon: ShoppingCart },
    { label: "Moderează Recenzii", to: "/admin/reviews", icon: Star, badge: pendingReviews },
    { label: "Scrie Articol", to: "/admin/blog", icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bine ai venit în panoul de administrare LUMINI.RO</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <div className={`rounded-lg p-2 ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Comenzi Recente</h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-accent hover:underline">
              Vezi toate <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nicio comandă încă.</div>
            ) : (
              recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.customer_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">{o.order_number}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(o.created_at).toLocaleDateString("ro-RO")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{Number(o.total).toFixed(2)} RON</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      o.status === "delivered" || o.status === "completed" ? "bg-accent/15 text-accent" :
                      o.status === "cancelled" ? "bg-destructive/15 text-destructive" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions + stats */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Acțiuni Rapide</h2>
            <div className="space-y-2">
              {quickLinks.map((q) => (
                <Link
                  key={q.label}
                  to={q.to as any}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                >
                  <span className="flex items-center gap-2">
                    <q.icon className="h-4 w-4" />
                    {q.label}
                  </span>
                  {q.badge ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">{q.badge}</span>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Sumar</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recenzii</span>
                <span className="font-semibold text-foreground">{stats.reviews}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recenzii în așteptare</span>
                <span className={`font-semibold ${pendingReviews > 0 ? "text-destructive" : "text-foreground"}`}>{pendingReviews}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Articole blog</span>
                <span className="font-semibold text-foreground">{stats.blogPosts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
