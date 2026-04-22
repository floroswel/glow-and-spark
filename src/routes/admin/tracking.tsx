import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Truck, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/tracking")({
  component: AdminTracking,
});

function AdminTracking() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    supabase.from("orders").select("*")
      .in("status", ["processing", "shipping", "delivered"])
      .order("updated_at", { ascending: false }).limit(200)
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return o.order_number?.toLowerCase().includes(s) || o.customer_name?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [orders, search, filterStatus]);

  const stats = useMemo(() => ({
    processing: orders.filter(o => o.status === "processing").length,
    shipping: orders.filter(o => o.status === "shipping").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  }), [orders]);

  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    processing: { label: "Procesare", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
    shipping: { label: "În livrare", icon: Truck, color: "bg-blue-100 text-blue-700" },
    delivered: { label: "Livrat", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Tracking Colete</h1>
        <p className="text-sm text-muted-foreground">Monitorizare comenzi în procesare și livrare</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(stats).map(([key, val]) => {
          const cfg = statusConfig[key];
          return (
            <div key={key} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2"><cfg.icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">{cfg.label}</span></div>
              <p className="mt-1 text-2xl font-bold text-foreground">{val}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută comandă, client..."
            className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="all">Toate</option>
          <option value="processing">Procesare</option>
          <option value="shipping">În livrare</option>
          <option value="delivered">Livrate</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(order => {
          const cfg = statusConfig[order.status] || statusConfig.processing;
          return (
            <div key={order.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
              <div className={`rounded-full p-2 ${cfg.color}`}><cfg.icon className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">{order.order_number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{order.customer_name} • {order.city}, {order.county}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{Number(order.total).toFixed(2)} RON</p>
                <p className="text-xs text-muted-foreground">{new Date(order.updated_at || order.created_at).toLocaleDateString("ro-RO")}</p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">Nicio comandă în tracking</div>}
      </div>
    </div>
  );
}
