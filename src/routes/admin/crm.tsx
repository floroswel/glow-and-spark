import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Crown, TrendingUp, ShoppingBag, UserCheck, UserX, Search, Tag } from "lucide-react";

export const Route = createFileRoute("/admin/crm")({
  component: AdminCRM,
});

function AdminCRM() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"segments" | "vip" | "inactive">("segments");

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("orders").select("customer_email, customer_name, total, created_at"),
    ]).then(([{ data: p }, { data: o }]) => {
      setProfiles(p || []);
      setOrders(o || []);
      setLoading(false);
    });
  }, []);

  const enriched = useMemo(() => {
    const ordersByEmail: Record<string, { count: number; total: number; last: string }> = {};
    (orders || []).forEach(o => {
      const e = o.customer_email?.toLowerCase();
      if (!e) return;
      if (!ordersByEmail[e]) ordersByEmail[e] = { count: 0, total: 0, last: o.created_at };
      ordersByEmail[e].count++;
      ordersByEmail[e].total += Number(o.total || 0);
      if (o.created_at > ordersByEmail[e].last) ordersByEmail[e].last = o.created_at;
    });

    const uniqueEmails = new Set<string>();
    const allCustomers: any[] = [];

    (orders || []).forEach(o => {
      const e = o.customer_email?.toLowerCase();
      if (!e || uniqueEmails.has(e)) return;
      uniqueEmails.add(e);
      const stats = ordersByEmail[e];
      const daysSinceOrder = Math.floor((Date.now() - new Date(stats.last).getTime()) / 86400000);
      allCustomers.push({
        email: e,
        name: o.customer_name,
        orders: stats.count,
        total: stats.total,
        aov: stats.total / stats.count,
        lastOrder: stats.last,
        daysSince: daysSinceOrder,
        segment: stats.total >= 500 ? "vip" : stats.count >= 3 ? "loyal" : daysSinceOrder > 90 ? "inactive" : "regular",
      });
    });

    return allCustomers.sort((a, b) => b.total - a.total);
  }, [profiles, orders]);

  const segments = useMemo(() => ({
    vip: enriched.filter(c => c.segment === "vip"),
    loyal: enriched.filter(c => c.segment === "loyal"),
    regular: enriched.filter(c => c.segment === "regular"),
    inactive: enriched.filter(c => c.segment === "inactive"),
  }), [enriched]);

  const segmentConfig: Record<string, { label: string; icon: any; color: string; desc: string }> = {
    vip: { label: "VIP", icon: Crown, color: "bg-amber-100 text-amber-700", desc: "Comenzi totale > 500 RON" },
    loyal: { label: "Fideli", icon: UserCheck, color: "bg-green-100 text-green-700", desc: "3+ comenzi plasate" },
    regular: { label: "Regulari", icon: Users, color: "bg-blue-100 text-blue-700", desc: "Clienți activi sub 3 comenzi" },
    inactive: { label: "Inactivi", icon: UserX, color: "bg-red-100 text-red-700", desc: "Fără comandă >90 zile" },
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Segmente & Grupuri Clienți</h1>
        <p className="text-sm text-muted-foreground">Segmentare automată pe baza comportamentului de cumpărare</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(segmentConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`rounded-xl border p-4 text-left transition ${activeTab === key ? "border-accent ring-1 ring-accent" : "bg-card hover:border-accent/30"}`}>
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${cfg.color}`}><cfg.icon className="h-3.5 w-3.5" /></div>
              <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{segments[key as keyof typeof segments]?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">{cfg.desc}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Segment</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comenzi</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">AOV</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ultima comandă</th>
          </tr></thead>
          <tbody>
            {(segments[activeTab as keyof typeof segments] || enriched).slice(0, 50).map((c, i) => {
              const cfg = segmentConfig[c.segment];
              return (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3 text-right">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.total.toFixed(0)} RON</td>
                  <td className="px-4 py-3 text-right">{c.aov.toFixed(0)} RON</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.lastOrder).toLocaleDateString("ro-RO")} ({c.daysSince}z)</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
