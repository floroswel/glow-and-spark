import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Heart, MapPin, Package, Star, Trophy } from "lucide-react";

export const Route = createFileRoute("/account/")({
  component: AccountDashboard,
});

const TIERS = [
  { name: "Bronze", min: 0, max: 500, color: "text-amber-700", bg: "bg-amber-100", accent: "bg-amber-500" },
  { name: "Silver", min: 500, max: 2000, color: "text-slate-500", bg: "bg-slate-100", accent: "bg-slate-400" },
  { name: "Gold", min: 2000, max: Infinity, color: "text-yellow-600", bg: "bg-yellow-100", accent: "bg-yellow-500" },
];

function getTierInfo(lifetime: number) {
  const tier = TIERS.find((t) => lifetime >= t.min && lifetime < t.max) || TIERS[2];
  const nextTier = TIERS.find((t) => t.min > lifetime);
  const progress = nextTier
    ? ((lifetime - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;
  return { tier, nextTier, progress: Math.min(progress, 100) };
}

function AccountDashboard() {
  const { user, profile } = useAuth();
  const { count: favCount } = useFavorites();
  const [stats, setStats] = useState({ orders: 0, addresses: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [points, setPoints] = useState<{ balance: number; lifetime_points: number; tier: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [ordersRes, addressesRes, pointsRes] = await Promise.all([
        supabase.from("orders").select("id, order_number, total, status, created_at").eq("customer_email", user.email!).order("created_at", { ascending: false }).limit(5),
        supabase.from("addresses").select("id").eq("user_id", user.id),
        supabase.from("user_points").select("balance, lifetime_points, tier").eq("user_id", user.id).maybeSingle(),
      ]);
      const orders = ordersRes.data || [];
      setRecentOrders(orders);
      setStats({
        orders: orders.length,
        addresses: addressesRes.data?.length || 0,
        totalSpent: orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
      });
      if (pointsRes.data) setPoints(pointsRes.data);
    })();
  }, [user]);

  const tierInfo = getTierInfo(points?.lifetime_points || 0);

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

      {/* Loyalty Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tierInfo.tier.bg}`}>
            <Trophy className={`h-5 w-5 ${tierInfo.tier.color}`} />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Programul de Fidelitate</h2>
            <p className="text-xs text-muted-foreground">Câștigi 1 punct pentru fiecare 1 RON cheltuit</p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Balance + Tier */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 rounded-xl bg-secondary/50 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="text-3xl font-bold text-foreground">{points?.balance ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Puncte disponibile</p>
              <p className="text-xs text-accent font-medium mt-0.5">= {((points?.balance ?? 0) / 10).toFixed(1)} RON reducere</p>
            </div>
            <div className="flex-1 rounded-xl bg-secondary/50 p-4 text-center">
              <span className={`inline-flex items-center gap-1.5 text-lg font-bold ${tierInfo.tier.color}`}>
                <Trophy className="h-5 w-5" />
                {tierInfo.tier.name}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Nivel actual</p>
              <p className="text-xs text-muted-foreground mt-0.5">{points?.lifetime_points ?? 0} puncte totale</p>
            </div>
          </div>

          {/* Progress bar */}
          {tierInfo.nextTier && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-semibold ${tierInfo.tier.color}`}>{tierInfo.tier.name}</span>
                <span className="text-muted-foreground">
                  {tierInfo.nextTier.min - (points?.lifetime_points ?? 0)} puncte până la{" "}
                  <span className="font-semibold">{tierInfo.nextTier.name}</span>
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${tierInfo.tier.accent} transition-all duration-500`}
                  style={{ width: `${tierInfo.progress}%` }}
                />
              </div>
            </div>
          )}
          {!tierInfo.nextTier && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 text-center">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">🏆 Ai atins nivelul maxim — Gold!</p>
            </div>
          )}

          {/* Tiers explanation */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`rounded-xl border p-3 transition ${
                  tierInfo.tier.name === t.name ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <p className={`text-sm font-bold ${t.color}`}>{t.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t.max === Infinity ? `${t.min}+ pts` : `${t.min}–${t.max} pts`}
                </p>
              </div>
            ))}
          </div>

          {/* Points value */}
          <div className="rounded-lg bg-secondary/30 px-4 py-3 text-xs text-muted-foreground text-center">
            <strong className="text-foreground">Cum funcționează:</strong> Primești 1 punct pentru fiecare 1 RON cheltuit.
            10 puncte = 1 RON reducere la comenzile viitoare.
          </div>
        </div>
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
