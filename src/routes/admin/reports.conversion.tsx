import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, ShoppingCart, CreditCard, Package, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/reports/conversion")({
  component: ConversionReport,
});

function ConversionReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const since = new Date(); since.setDate(since.getDate() - Number(period));
    Promise.all([
      supabase.from("orders").select("id, total, status, payment_method, created_at").gte("created_at", since.toISOString()),
      supabase.from("abandoned_carts").select("id, total, recovered, created_at").gte("created_at", since.toISOString()),
    ]).then(([o, c]) => {
      setOrders(o.data || []);
      setCarts(c.data || []);
      setLoading(false);
    });
  }, [period]);

  const funnel = useMemo(() => {
    const totalSessions = orders.length + carts.length;
    const addedToCart = totalSessions;
    const reachedCheckout = orders.length + carts.filter(c => c.recovered).length;
    const completed = orders.filter(o => o.status !== "cancelled").length;
    const paid = orders.filter(o => o.status !== "cancelled" && o.status !== "pending").length;
    return [
      { label: "Coșuri create", icon: ShoppingCart, count: addedToCart, pct: 100 },
      { label: "Checkout inițiat", icon: CreditCard, count: reachedCheckout, pct: addedToCart ? Math.round((reachedCheckout / addedToCart) * 100) : 0 },
      { label: "Comenzi plasate", icon: Package, count: completed, pct: addedToCart ? Math.round((completed / addedToCart) * 100) : 0 },
      { label: "Comenzi plătite", icon: TrendingUp, count: paid, pct: addedToCart ? Math.round((paid / addedToCart) * 100) : 0 },
    ];
  }, [orders, carts]);

  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = {};
    orders.forEach(o => { methods[o.payment_method || "necunoscut"] = (methods[o.payment_method || "necunoscut"] || 0) + 1; });
    return Object.entries(methods).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-secondary animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">📊 Conversie & Funnel</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="7">7 zile</option><option value="30">30 zile</option><option value="90">90 zile</option>
        </select>
      </div>

      <div className="space-y-3">
        {funnel.map((step, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <step.icon className="h-5 w-5 text-accent" />
                <span className="font-medium text-foreground text-sm">{step.label}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-foreground">{step.count}</span>
                <span className="text-muted-foreground text-sm ml-2">({step.pct}%)</span>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${step.pct}%` }} />
            </div>
            {i > 0 && funnel[i - 1].count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Drop-off: {funnel[i - 1].count - step.count} ({Math.round(((funnel[i - 1].count - step.count) / funnel[i - 1].count) * 100)}%)
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Metode de plată</h3>
        <div className="space-y-2">
          {paymentBreakdown.map(([method, count]) => (
            <div key={method} className="flex items-center justify-between">
              <span className="text-sm text-foreground capitalize">{method}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent/70 rounded-full" style={{ width: `${(count / orders.length) * 100}%` }} />
                </div>
                <span className="text-sm font-medium w-12 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-accent">{carts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Coșuri abandonate</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{carts.filter(c => c.recovered).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Coșuri recuperate</p>
        </div>
      </div>
    </div>
  );
}
