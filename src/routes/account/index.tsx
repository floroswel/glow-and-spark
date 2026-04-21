import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Heart, MapPin, Package } from "lucide-react";

export const Route = createFileRoute("/account/")({
  component: AccountDashboard,
});

function AccountDashboard() {
  const { user, profile } = useAuth();
  const { count: favCount } = useFavorites();
  const [stats, setStats] = useState({ orders: 0, addresses: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [ordersRes, addressesRes] = await Promise.all([
        supabase.from("orders").select("id, order_number, total, status, created_at").eq("customer_email", user.email!).order("created_at", { ascending: false }).limit(5),
        supabase.from("addresses").select("id").eq("user_id", user.id),
      ]);
      const orders = ordersRes.data || [];
      setRecentOrders(orders);
      setStats({
        orders: orders.length,
        addresses: addressesRes.data?.length || 0,
        totalSpent: orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
      });
    })();
  }, [user]);

  const statCards = [
    { label: "Comenzi", value: stats.orders, icon: ShoppingBag, to: "/account/orders" },
    { label: "Favorite", value: favCount, icon: Heart, to: "/account/favorites" },
    { label: "Adrese", value: stats.addresses, icon: MapPin, to: "/account/addresses" },
    { label: "Total Cheltuit", value: `${stats.totalSpent.toFixed(2)} lei`, icon: Package, to: "/account/orders" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Bine ai revenit, {profile?.full_name?.split(" ")[0] || ""}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Iată un rezumat al contului tău.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link
            key={s.label}
            to={s.to as any}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      {recentOrders.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Comenzi Recente</h2>
            <Link to="/account/orders" className="text-xs font-medium text-accent hover:underline">
              Vezi toate
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">#{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{Number(order.total).toFixed(2)} lei</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === "completed" ? "bg-green-100 text-green-700" :
                    order.status === "processing" ? "bg-blue-100 text-blue-700" :
                    order.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.status === "pending" ? "În așteptare" :
                     order.status === "processing" ? "Se procesează" :
                     order.status === "completed" ? "Finalizată" :
                     order.status === "cancelled" ? "Anulată" : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
