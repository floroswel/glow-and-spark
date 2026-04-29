import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Pause, Play, X, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Abonamente Recurente — Admin" }] }),
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("product_subscriptions").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data: subs } = await q;
    if (!subs?.length) { setRows([]); setLoading(false); return; }
    const productIds = [...new Set(subs.map(s => s.product_id))];
    const userIds = [...new Set(subs.map(s => s.user_id))];
    const [{ data: products }, { data: profiles }] = await Promise.all([
      supabase.from("products").select("id,name,price,image_url").in("id", productIds),
      supabase.from("profiles").select("user_id,full_name").in("user_id", userIds),
    ]);
    setRows(subs.map(s => ({
      ...s,
      product: products?.find(p => p.id === s.product_id),
      profile: profiles?.find(p => p.user_id === s.user_id),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
    const { error } = await supabase.from("product_subscriptions").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status actualizat");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Repeat className="h-6 w-6" />Abonamente Recurente</h1>
          <p className="text-sm text-muted-foreground mt-1">Clienți cu livrare automată recurentă</p>
        </div>
        <button onClick={load} className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="flex gap-2">
        {["all", "active", "paused", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === s ? "bg-accent text-accent-foreground" : "bg-card border hover:bg-muted"}`}>
            {s === "all" ? "Toate" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">Niciun abonament încă</div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Produs</th>
                <th className="px-4 py-3 text-left">Frecvență</th>
                <th className="px-4 py-3 text-left">Următoarea livrare</th>
                <th className="px-4 py-3 text-left">Reducere</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.profile?.full_name || "—"}</td>
                  <td className="px-4 py-3 font-medium">{r.product?.name || "Produs șters"} <span className="text-xs text-muted-foreground">×{r.quantity}</span></td>
                  <td className="px-4 py-3">la {r.frequency_days} zile</td>
                  <td className="px-4 py-3">{new Date(r.next_delivery_date).toLocaleDateString("ro-RO")}</td>
                  <td className="px-4 py-3">-{r.discount_percent}%</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "paused" ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {r.status === "active" && <button onClick={() => setStatus(r.id, "paused")} className="rounded p-1.5 hover:bg-muted" title="Pauză"><Pause className="h-4 w-4" /></button>}
                      {r.status === "paused" && <button onClick={() => setStatus(r.id, "active")} className="rounded p-1.5 hover:bg-muted" title="Reia"><Play className="h-4 w-4" /></button>}
                      {r.status !== "cancelled" && <button onClick={() => setStatus(r.id, "cancelled")} className="rounded p-1.5 hover:bg-muted text-rose-600" title="Anulează"><X className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
