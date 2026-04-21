import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, X } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  processing: "În procesare",
  shipped: "Expediată",
  delivered: "Livrată",
  cancelled: "Anulată",
};

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewing, setViewing] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");

  const load = async () => {
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (filterPayment !== "all") q = q.eq("payment_method", filterPayment);
    const { data } = await q;
    setOrders(data || []);
  };

  useEffect(() => { load(); }, [filterStatus, filterPayment]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
    if (viewing?.id === id) setViewing({ ...viewing, status });
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders.filter((o) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0),
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Comenzi</h1>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "În așteptare", value: stats.pending, color: "text-yellow-600" },
          { label: "Procesare", value: stats.processing, color: "text-blue-600" },
          { label: "Livrate", value: stats.delivered, color: "text-green-600" },
          { label: "Venituri", value: `${stats.revenue.toFixed(0)} RON`, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">Toate statusurile</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">Toate plățile</option>
          <option value="ramburs">Ramburs</option>
          <option value="card">Card</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nr. Comandă</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plată</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{o.order_number}</td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{o.total} RON</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{o.payment_method}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewing(o)} className="text-muted-foreground hover:text-accent"><Eye className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nicio comandă încă.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">Comandă #{viewing.order_number}</h2>
              <button onClick={() => setViewing(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Client:</span> <strong>{viewing.customer_name}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> {viewing.customer_email}</div>
                <div><span className="text-muted-foreground">Telefon:</span> {viewing.customer_phone || "-"}</div>
                <div><span className="text-muted-foreground">Plată:</span> {viewing.payment_method}</div>
                {viewing.billing_type === "company" && (
                  <>
                    <div><span className="text-muted-foreground">Firmă:</span> {viewing.company_name}</div>
                    <div><span className="text-muted-foreground">CUI:</span> {viewing.company_cui}</div>
                  </>
                )}
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-muted-foreground mb-1">Adresa:</p>
                <p>{viewing.shipping_address}, {viewing.city}, {viewing.county} {viewing.postal_code}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-muted-foreground mb-2">Produse:</p>
                {(viewing.items as any[])?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-1">
                    <span>{item.name} × {item.qty}</span>
                    <span>{(item.price * item.qty).toFixed(2)} RON</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="flex justify-between"><span>Subtotal</span><span>{viewing.subtotal} RON</span></div>
                <div className="flex justify-between"><span>Livrare</span><span>{Number(viewing.shipping_cost) === 0 ? "GRATUITĂ" : `${viewing.shipping_cost} RON`}</span></div>
                {Number(viewing.discount_amount) > 0 && (
                  <div className="flex justify-between text-chart-2"><span>Reducere ({viewing.discount_code})</span><span>-{viewing.discount_amount} RON</span></div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span><span>{viewing.total} RON</span>
                </div>
              </div>
              <div className="pt-2">
                <label className="text-xs text-muted-foreground">Schimbă status:</label>
                <select value={viewing.status} onChange={(e) => updateStatus(viewing.id, e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
