import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ArrowUpRight, ArrowDownRight, Search, Download } from "lucide-react";

export const Route = createFileRoute("/admin/transactions")({
  component: AdminTransactions,
});

function AdminTransactions() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    supabase.from("orders").select("id, order_number, customer_name, customer_email, total, payment_method, payment_status, payment_reference, created_at")
      .order("created_at", { ascending: false }).limit(500).then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filterMethod !== "all" && o.payment_method !== filterMethod) return false;
      if (filterStatus !== "all" && o.payment_status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return o.order_number?.toLowerCase().includes(s) || o.customer_name?.toLowerCase().includes(s) || o.payment_reference?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [orders, search, filterMethod, filterStatus]);

  const stats = useMemo(() => {
    const paid = orders.filter(o => o.payment_status === "paid");
    const pending = orders.filter(o => o.payment_status === "pending");
    return {
      total_paid: paid.reduce((s, o) => s + Number(o.total || 0), 0),
      total_pending: pending.reduce((s, o) => s + Number(o.total || 0), 0),
      count_paid: paid.length,
      count_pending: pending.length,
    };
  }, [orders]);

  const paymentLabels: Record<string, string> = { ramburs: "Ramburs", netopia: "Card Online", transfer: "Transfer", mokka: "Rate" };
  const statusColors: Record<string, string> = { paid: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", failed: "bg-red-100 text-red-700", refunded: "bg-blue-100 text-blue-700" };

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Tranzacții</h1>
        <p className="text-sm text-muted-foreground">Vizualizare plăți și status tranzacții</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-green-600"><ArrowUpRight className="h-4 w-4" /><span className="text-xs font-medium">Încasate</span></div>
          <p className="mt-1 text-xl font-bold text-foreground">{stats.total_paid.toFixed(2)} RON</p>
          <p className="text-xs text-muted-foreground">{stats.count_paid} tranzacții</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-yellow-600"><ArrowDownRight className="h-4 w-4" /><span className="text-xs font-medium">În așteptare</span></div>
          <p className="mt-1 text-xl font-bold text-foreground">{stats.total_pending.toFixed(2)} RON</p>
          <p className="text-xs text-muted-foreground">{stats.count_pending} tranzacții</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-4 w-4" /><span className="text-xs font-medium">Total comenzi</span></div>
          <p className="mt-1 text-xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-4 w-4" /><span className="text-xs font-medium">Card Online</span></div>
          <p className="mt-1 text-xl font-bold text-foreground">{orders.filter(o => o.payment_method === "netopia").length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută comandă, client, referință..."
            className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="all">Toate metodele</option>
          <option value="ramburs">Ramburs</option>
          <option value="netopia">Card Online</option>
          <option value="transfer">Transfer</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="all">Toate statusurile</option>
          <option value="paid">Plătit</option>
          <option value="pending">În așteptare</option>
          <option value="failed">Eșuat</option>
          <option value="refunded">Rambursat</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comandă</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Metodă</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sumă</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0, 50).map(o => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                <td className="px-4 py-3">{o.customer_name}</td>
                <td className="px-4 py-3">{paymentLabels[o.payment_method] || o.payment_method}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[o.payment_status] || "bg-muted text-muted-foreground"}`}>{o.payment_status}</span></td>
                <td className="px-4 py-3 text-right font-semibold">{Number(o.total).toFixed(2)} RON</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nicio tranzacție găsită</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
