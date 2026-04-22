import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, ArrowUp, ArrowDown, Download } from "lucide-react";

export const Route = createFileRoute("/admin/reports/customers")({
  component: CustomerReports,
});

function CustomerReports() {
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("customer_email, total, created_at, status").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, created_at"),
    ]).then(([o, p]) => {
      setOrders(o.data || []);
      setProfiles(p.data || []);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const since = new Date(); since.setDate(now.getDate() - Number(period));
    const prevSince = new Date(); prevSince.setDate(since.getDate() - Number(period));
    const periodOrders = orders.filter(o => new Date(o.created_at) >= since);
    const prevOrders = orders.filter(o => { const d = new Date(o.created_at); return d >= prevSince && d < since; });

    const uniqueEmails = new Set(periodOrders.map(o => o.customer_email));
    const prevUniqueEmails = new Set(prevOrders.map(o => o.customer_email));
    const allEmails = new Set(orders.filter(o => new Date(o.created_at) < since).map(o => o.customer_email));
    const returning = [...uniqueEmails].filter(e => allEmails.has(e)).length;
    const newCustomers = uniqueEmails.size - returning;

    const newProfiles = profiles.filter(p => new Date(p.created_at) >= since).length;
    const prevNewProfiles = profiles.filter(p => { const d = new Date(p.created_at); return d >= prevSince && d < since; }).length;

    const totalRevenue = periodOrders.reduce((s, o) => s + (o.total || 0), 0);
    const aov = periodOrders.length ? totalRevenue / periodOrders.length : 0;

    return { uniqueEmails: uniqueEmails.size, prevUnique: prevUniqueEmails.size, returning, newCustomers, newProfiles, prevNewProfiles, totalRevenue, aov, totalOrders: periodOrders.length };
  }, [orders, profiles, period]);

  const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-secondary animate-pulse rounded-lg" />)}</div>;

  const cards = [
    { label: "Clienți unici", value: stats.uniqueEmails, prev: stats.prevUnique },
    { label: "Conturi noi", value: stats.newProfiles, prev: stats.prevNewProfiles },
    { label: "Revenitori", value: stats.returning, prev: 0 },
    { label: "AOV", value: `${stats.aov.toFixed(0)} RON`, prev: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">👥 Rapoarte Clienți</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="7">7 zile</option><option value="30">30 zile</option><option value="90">90 zile</option><option value="365">1 an</option>
        </select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const pct = typeof c.value === "number" ? pctChange(c.value, c.prev) : 0;
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{c.value}</p>
              {c.prev > 0 && <p className={`text-xs mt-1 flex items-center gap-1 ${pct >= 0 ? "text-green-500" : "text-red-500"}`}>{pct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{Math.abs(pct)}%</p>}
            </div>
          );
        })}
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Distribuție</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <p className="text-3xl font-bold text-accent">{stats.newCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">Clienți noi</p>
          </div>
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <p className="text-3xl font-bold text-foreground">{stats.returning}</p>
            <p className="text-xs text-muted-foreground mt-1">Clienți revenitori</p>
          </div>
        </div>
        {stats.uniqueEmails > 0 && (
          <div className="mt-4 h-3 bg-secondary rounded-full overflow-hidden flex">
            <div className="h-full bg-accent" style={{ width: `${(stats.newCustomers / stats.uniqueEmails) * 100}%` }} />
            <div className="h-full bg-foreground/30" style={{ width: `${(stats.returning / stats.uniqueEmails) * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
