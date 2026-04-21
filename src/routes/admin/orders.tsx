import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, X, Search, Download, Calendar, Printer, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const statusColors: Record<string, string> = {
  pending: "bg-accent/15 text-accent",
  processing: "bg-chart-1/15 text-chart-1",
  shipped: "bg-chart-4/15 text-chart-4",
  delivered: "bg-chart-2/15 text-chart-2",
  completed: "bg-chart-2/15 text-chart-2",
  cancelled: "bg-destructive/15 text-destructive",
};

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  processing: "În procesare",
  shipped: "Expediată",
  delivered: "Livrată",
  completed: "Finalizată",
  cancelled: "Anulată",
};

const PAGE_SIZE = 25;

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewing, setViewing] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = async () => {
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (filterPayment !== "all") q = q.eq("payment_method", filterPayment);
    if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    const { data } = await q;
    setOrders(data || []);
  };

  useEffect(() => { load(); }, [filterStatus, filterPayment, dateFrom, dateTo]);

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (o.order_number || "").toLowerCase().includes(s) ||
      (o.customer_name || "").toLowerCase().includes(s) ||
      (o.customer_email || "").toLowerCase().includes(s) ||
      (o.customer_phone || "").includes(s);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    showToast(`Status actualizat: ${statusLabels[status]}`);
    load();
    if (viewing?.id === id) setViewing({ ...viewing, status });
  };

  const handleExportCSV = () => {
    const headers = "Nr.Comandă,Client,Email,Telefon,Total,Status,Plată,Data\n";
    const rows = filtered.map(o =>
      `"${o.order_number}","${o.customer_name}","${o.customer_email}","${o.customer_phone || ""}",${o.total},"${statusLabels[o.status] || o.status}","${o.payment_method || ""}","${new Date(o.created_at).toLocaleDateString("ro-RO")}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "comenzi.csv"; a.click();
    showToast("CSV exportat!");
  };

  const printInvoice = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Factură ${order.order_number}</title>
      <style>body{font-family:system-ui;padding:40px;max-width:800px;margin:0 auto} table{width:100%;border-collapse:collapse;margin:20px 0} th,td{padding:8px 12px;border-bottom:1px solid #eee;text-align:left} th{font-weight:600;font-size:12px;text-transform:uppercase;color:#888} .total{font-size:18px;font-weight:bold} h1{font-size:24px} .meta{color:#666;font-size:14px} @media print{body{padding:20px}}</style>
      </head><body>
      <h1>LUMINI.RO</h1>
      <p class="meta">Comandă: <strong>${order.order_number}</strong> | Data: ${new Date(order.created_at).toLocaleDateString("ro-RO")}</p>
      <hr/>
      <p><strong>${order.customer_name}</strong><br/>${order.customer_email}<br/>${order.customer_phone || ""}</p>
      <p>${order.shipping_address || ""}, ${order.city || ""}, ${order.county || ""} ${order.postal_code || ""}</p>
      ${order.billing_type === "company" ? `<p>Firmă: ${order.company_name} | CUI: ${order.company_cui} | Reg: ${order.company_reg || ""}</p>` : ""}
      <table><thead><tr><th>Produs</th><th>Cant.</th><th>Preț unit.</th><th>Total</th></tr></thead>
      <tbody>${items.map((it: any) => `<tr><td>${it.name}</td><td>${it.qty || it.quantity || 1}</td><td>${Number(it.price).toFixed(2)} RON</td><td>${(Number(it.price) * Number(it.qty || it.quantity || 1)).toFixed(2)} RON</td></tr>`).join("")}</tbody></table>
      <p>Subtotal: ${order.subtotal} RON</p>
      <p>Livrare: ${Number(order.shipping_cost) === 0 ? "GRATUITĂ" : order.shipping_cost + " RON"}</p>
      ${Number(order.discount_amount) > 0 ? `<p>Reducere (${order.discount_code}): -${order.discount_amount} RON</p>` : ""}
      <p class="total">Total: ${order.total} RON</p>
      <p class="meta">Plată: ${order.payment_method || "—"}</p>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const stats = {
    total: filtered.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered" || o.status === "completed").length,
    revenue: orders.filter((o) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0),
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Comenzi</h1>
        <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "În așteptare", value: stats.pending, color: "text-accent" },
          { label: "Procesare", value: stats.processing, color: "text-chart-1" },
          { label: "Livrate", value: stats.delivered, color: "text-chart-2" },
          { label: "Venituri", value: `${stats.revenue.toFixed(0)} RON`, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută nr. comandă, client, email, telefon..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-sm focus:border-accent focus:outline-none" />
        </div>
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
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm" placeholder="De la" />
          <span className="text-muted-foreground text-xs">—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm" placeholder="Până la" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
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
            {paginated.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition">
                <td className="px-4 py-3 font-medium text-foreground font-mono text-xs">{o.order_number}</td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{Number(o.total).toFixed(2)} RON</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className={`rounded-full px-2.5 py-1 text-xs font-medium border-0 cursor-pointer ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize text-xs">{o.payment_method || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("ro-RO")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => printInvoice(o)} title="Printează" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"><Printer className="h-4 w-4" /></button>
                    <button onClick={() => { setViewing(o); setAdminNote(o.notes || ""); }} title="Detalii" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-accent transition"><Eye className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nicio comandă găsită.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Afișând {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pNum => (
              <button key={pNum} onClick={() => setPage(pNum)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${page === pNum ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                {pNum}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Comandă #{viewing.order_number}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => printInvoice(viewing)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition flex items-center gap-1">
                  <Printer className="h-3.5 w-3.5" /> Printează
                </button>
                <button onClick={() => setViewing(null)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="font-medium text-foreground">{viewing.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{viewing.customer_email}</p>
                  <p className="text-xs text-muted-foreground">{viewing.customer_phone || "—"}</p>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-1">Plată & Status</p>
                  <p className="text-foreground capitalize">{viewing.payment_method || "—"}</p>
                  <p className="text-xs text-muted-foreground">Status plată: {viewing.payment_status || "—"}</p>
                  <p className="text-xs text-muted-foreground">Ref: {viewing.payment_reference || "—"}</p>
                </div>
              </div>

              {viewing.billing_type === "company" && (
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground mb-1">Date firmă</p>
                  <p className="text-foreground">{viewing.company_name} | CUI: {viewing.company_cui} | Reg: {viewing.company_reg || "—"}</p>
                </div>
              )}

              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground mb-1">Adresă livrare</p>
                <p className="text-foreground">{viewing.shipping_address}, {viewing.city}, {viewing.county} {viewing.postal_code}</p>
              </div>

              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground mb-2">Produse</p>
                {(viewing.items as any[])?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/50 last:border-0 text-foreground">
                    <span>{item.name} × {item.qty || item.quantity || 1}</span>
                    <span className="font-medium">{(Number(item.price) * Number(item.qty || item.quantity || 1)).toFixed(2)} RON</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-border">
                <div className="flex justify-between text-foreground"><span>Subtotal</span><span>{viewing.subtotal} RON</span></div>
                <div className="flex justify-between text-foreground"><span>Livrare</span><span>{Number(viewing.shipping_cost) === 0 ? "GRATUITĂ" : `${viewing.shipping_cost} RON`}</span></div>
                {Number(viewing.discount_amount) > 0 && (
                  <div className="flex justify-between text-accent"><span>Reducere ({viewing.discount_code})</span><span>-{viewing.discount_amount} RON</span></div>
                )}
                <div className="flex justify-between font-bold text-base text-foreground pt-1">
                  <span>Total</span><span>{viewing.total} RON</span>
                </div>
              </div>

              {/* Admin notes */}
              <div className="border-t border-border pt-3">
                <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <MessageSquare className="h-3.5 w-3.5" /> Note interne
                </label>
                <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} placeholder="Adaugă o notă internă..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                <button onClick={async () => {
                  await supabase.from("orders").update({ notes: adminNote }).eq("id", viewing.id);
                  showToast("Notă salvată!");
                }} className="mt-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition">
                  Salvează nota
                </button>
              </div>

              <div className="pt-2">
                <label className="text-xs text-muted-foreground">Schimbă status:</label>
                <select value={viewing.status} onChange={(e) => updateStatus(viewing.id, e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none">
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
