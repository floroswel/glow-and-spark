import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye, X, Search, Download, Calendar, Printer, MessageSquare,
  ChevronLeft, ChevronRight, RefreshCw, Package, TrendingUp,
  CreditCard, Clock, CheckSquare, Square, Trash2, AlertTriangle,
  ArrowUpDown, FileText, Truck, Mail
} from "lucide-react";

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
  refunded: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  processing: "În procesare",
  shipped: "Expediată",
  delivered: "Livrată",
  completed: "Finalizată",
  cancelled: "Anulată",
  refunded: "Rambursată",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "În așteptare",
  paid: "Plătită",
  failed: "Eșuată",
  refunded: "Rambursată",
};

const PAGE_SIZE = 25;

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewing, setViewing] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState("details");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (filterPayment !== "all") q = q.eq("payment_method", filterPayment);
    if (filterPaymentStatus !== "all") q = q.eq("payment_status", filterPaymentStatus);
    if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [filterStatus, filterPayment, filterPaymentStatus, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = orders.filter(o => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (o.order_number || "").toLowerCase().includes(s) ||
        (o.customer_name || "").toLowerCase().includes(s) ||
        (o.customer_email || "").toLowerCase().includes(s) ||
        (o.customer_phone || "").includes(s);
    });
    list.sort((a: any, b: any) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [orders, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    showToast(`Status actualizat: ${statusLabels[status]}`);
    load();
    if (viewing?.id === id) setViewing({ ...viewing, status });
  };

  const updatePaymentStatus = async (id: string, payment_status: string) => {
    await supabase.from("orders").update({ payment_status, updated_at: new Date().toISOString() }).eq("id", id);
    showToast(`Status plată: ${paymentStatusLabels[payment_status]}`);
    load();
    if (viewing?.id === id) setViewing({ ...viewing, payment_status });
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkAction) return;
    const ids = Array.from(selectedIds);
    if (bulkAction === "delete") {
      if (!confirm(`Ștergi ${ids.length} comenzi selectate? Acțiunea este ireversibilă.`)) return;
      for (const id of ids) await supabase.from("orders").delete().eq("id", id);
      showToast(`${ids.length} comenzi șterse.`);
    } else if (Object.keys(statusLabels).includes(bulkAction)) {
      for (const id of ids) await supabase.from("orders").update({ status: bulkAction }).eq("id", id);
      showToast(`${ids.length} comenzi actualizate: ${statusLabels[bulkAction]}`);
    }
    setSelectedIds(new Set());
    setBulkAction("");
    load();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(o => o.id)));
  };

  const handleExportCSV = () => {
    const headers = "Nr.Comandă,Client,Email,Telefon,Total,Subtotal,Livrare,Discount,Status,Status Plată,Metodă Plată,Adresă,Oraș,Județ,Data\n";
    const rows = filtered.map(o =>
      `"${o.order_number}","${o.customer_name}","${o.customer_email}","${o.customer_phone || ""}",${o.total},${o.subtotal},${o.shipping_cost || 0},${o.discount_amount || 0},"${statusLabels[o.status] || o.status}","${paymentStatusLabels[o.payment_status] || o.payment_status || ""}","${o.payment_method || ""}","${o.shipping_address || ""}","${o.city || ""}","${o.county || ""}","${new Date(o.created_at).toLocaleDateString("ro-RO")}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `comenzi_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    showToast("📥 CSV exportat!");
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
      <p class="meta">Comandă: <strong>${order.order_number}</strong> | Data: ${new Date(order.created_at).toLocaleDateString("ro-RO")} | Status: ${statusLabels[order.status] || order.status}</p>
      <hr/>
      <div style="display:flex;gap:40px">
        <div><p><strong>Client:</strong></p><p>${order.customer_name}<br/>${order.customer_email}<br/>${order.customer_phone || ""}</p></div>
        <div><p><strong>Livrare:</strong></p><p>${order.shipping_address || ""}<br/>${order.city || ""}, ${order.county || ""} ${order.postal_code || ""}</p></div>
      </div>
      ${order.billing_type === "company" ? `<p style="margin-top:10px"><strong>Firmă:</strong> ${order.company_name} | CUI: ${order.company_cui} | Reg: ${order.company_reg || ""}</p>` : ""}
      <table><thead><tr><th>Produs</th><th>Cant.</th><th>Preț unit.</th><th>Total</th></tr></thead>
      <tbody>${items.map((it: any) => `<tr><td>${it.name}</td><td>${it.qty || it.quantity || 1}</td><td>${Number(it.price).toFixed(2)} RON</td><td>${(Number(it.price) * Number(it.qty || it.quantity || 1)).toFixed(2)} RON</td></tr>`).join("")}</tbody></table>
      <p>Subtotal: ${order.subtotal} RON</p>
      <p>Livrare: ${Number(order.shipping_cost) === 0 ? "GRATUITĂ" : order.shipping_cost + " RON"}</p>
      ${Number(order.discount_amount) > 0 ? `<p>Reducere (${order.discount_code}): -${order.discount_amount} RON</p>` : ""}
      <p class="total">Total: ${order.total} RON</p>
      <p class="meta">Metoda plată: ${order.payment_method || "—"} | Status plată: ${paymentStatusLabels[order.payment_status] || order.payment_status || "—"}</p>
      ${order.notes ? `<p class="meta" style="margin-top:20px;border-top:1px solid #eee;padding-top:10px"><strong>Note:</strong> ${order.notes}</p>` : ""}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const stats = useMemo(() => {
    const nonCancelled = orders.filter(o => o.status !== "cancelled");
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      processing: orders.filter(o => o.status === "processing").length,
      shipped: orders.filter(o => o.status === "shipped").length,
      delivered: orders.filter(o => o.status === "delivered" || o.status === "completed").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      revenue: nonCancelled.reduce((s: number, o: any) => s + Number(o.total), 0),
      avgOrder: nonCancelled.length ? nonCancelled.reduce((s: number, o: any) => s + Number(o.total), 0) / nonCancelled.length : 0,
      todayOrders: orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length,
      todayRevenue: orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString() && o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0),
    };
  }, [orders]);

  const selectClass = "rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none";
  const thBtn = "flex items-center gap-1 cursor-pointer hover:text-foreground transition";

  if (loading && orders.length === 0) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      <div className="h-96 bg-muted animate-pulse rounded-xl" />
    </div>
  );

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Comenzi</h1>
          <p className="text-sm text-muted-foreground">{orders.length} comenzi total · Azi: {stats.todayOrders} comenzi, {stats.todayRevenue.toFixed(0)} RON</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Package, color: "text-foreground" },
          { label: "Azi", value: stats.todayOrders, icon: Clock, color: "text-chart-1" },
          { label: "Așteptare", value: stats.pending, icon: Clock, color: "text-accent" },
          { label: "Procesare", value: stats.processing, icon: Package, color: "text-chart-1" },
          { label: "Expediate", value: stats.shipped, icon: Truck, color: "text-chart-4" },
          { label: "Livrate", value: stats.delivered, icon: CheckSquare, color: "text-chart-2" },
          { label: "Anulate", value: stats.cancelled, icon: AlertTriangle, color: "text-destructive" },
          { label: "Venituri", value: `${(stats.revenue / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-chart-2" },
          { label: "Medie", value: `${stats.avgOrder.toFixed(0)}`, icon: CreditCard, color: "text-chart-3" },
          { label: "Venituri azi", value: `${stats.todayRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-accent" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută nr. comandă, client, email, telefon..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-sm focus:border-accent focus:outline-none" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
          <option value="all">Toate statusurile</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className={selectClass}>
          <option value="all">Toate metodele</option>
          <option value="ramburs">Ramburs</option>
          <option value="card">Card</option>
          <option value="transfer">Transfer</option>
        </select>
        <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)} className={selectClass}>
          <option value="all">Status plată</option>
          {Object.entries(paymentStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
          <span className="text-muted-foreground text-xs">—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{selectedIds.size} selectate</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className={selectClass}>
            <option value="">Acțiune în masă...</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>→ {v}</option>)}
            <option value="delete">🗑️ Șterge</option>
          </select>
          {bulkAction && (
            <button onClick={handleBulkAction} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
              Aplică
            </button>
          )}
          <button onClick={() => { setSelectedIds(new Set()); setBulkAction(""); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                  {selectedIds.size === paginated.length && paginated.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("order_number")} className={thBtn}><span className="font-medium text-muted-foreground">Comandă</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("total")} className={thBtn}><span className="font-medium text-muted-foreground">Total</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Plată</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Produse</th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("created_at")} className={thBtn}><span className="font-medium text-muted-foreground">Data</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((o) => {
              const itemCount = Array.isArray(o.items) ? o.items.reduce((s: number, it: any) => s + Number(it.qty || it.quantity || 1), 0) : 0;
              return (
                <tr key={o.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition ${selectedIds.has(o.id) ? "bg-accent/5" : ""}`}>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleSelect(o.id)} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.has(o.id) ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-foreground">{o.order_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground font-medium truncate max-w-[150px]">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{Number(o.total).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">RON</p>
                  </td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border-0 cursor-pointer ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>
                      {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-muted-foreground capitalize">{o.payment_method || "—"}</p>
                    <p className={`text-[10px] font-medium ${o.payment_status === "paid" ? "text-chart-2" : "text-muted-foreground"}`}>{paymentStatusLabels[o.payment_status] || "—"}</p>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-muted-foreground">{itemCount} produse</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => printInvoice(o)} title="Printează factură" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"><Printer className="h-4 w-4" /></button>
                      <button onClick={() => { setViewing(o); setAdminNote(o.notes || ""); setActiveTab("details"); }} title="Detalii" className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-accent transition"><Eye className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Nicio comandă găsită.</td></tr>
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
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pNum = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return (
                <button key={pNum} onClick={() => setPage(pNum)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${page === pNum ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                  {pNum}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setViewing(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-xl">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Comandă #{viewing.order_number}</h2>
                <p className="text-xs text-muted-foreground">{new Date(viewing.created_at).toLocaleDateString("ro-RO")} {new Date(viewing.created_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printInvoice(viewing)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition flex items-center gap-1">
                  <Printer className="h-3.5 w-3.5" /> Factură
                </button>
                <button onClick={() => setViewing(null)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-6">
              <div className="flex gap-1">
                {[
                  { key: "details", label: "📋 Detalii" },
                  { key: "products", label: "📦 Produse" },
                  { key: "notes", label: "📝 Note" },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition whitespace-nowrap ${activeTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-4 text-sm">
              {activeTab === "details" && (
                <>
                  {/* Status bar */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Status comandă</label>
                      <select value={viewing.status} onChange={(e) => updateStatus(viewing.id, e.target.value)}
                        className={`mt-1 block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium ${statusColors[viewing.status]}`}>
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Status plată</label>
                      <select value={viewing.payment_status || "pending"} onChange={(e) => updatePaymentStatus(viewing.id, e.target.value)}
                        className="mt-1 block rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        {Object.entries(paymentStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary p-4">
                      <p className="text-xs text-muted-foreground mb-2 uppercase font-medium">👤 Client</p>
                      <p className="font-medium text-foreground">{viewing.customer_name}</p>
                      <p className="text-muted-foreground">{viewing.customer_email}</p>
                      <p className="text-muted-foreground">{viewing.customer_phone || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <p className="text-xs text-muted-foreground mb-2 uppercase font-medium">📍 Livrare</p>
                      <p className="text-foreground">{viewing.shipping_address || "—"}</p>
                      <p className="text-foreground">{viewing.city}, {viewing.county} {viewing.postal_code}</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-4">
                      <p className="text-xs text-muted-foreground mb-2 uppercase font-medium">💳 Plată</p>
                      <p className="text-foreground capitalize">{viewing.payment_method || "—"}</p>
                      <p className="text-muted-foreground">Ref: {viewing.payment_reference || "—"}</p>
                    </div>
                    {viewing.billing_type === "company" && (
                      <div className="rounded-lg bg-secondary p-4">
                        <p className="text-xs text-muted-foreground mb-2 uppercase font-medium">🏢 Date firmă</p>
                        <p className="text-foreground">{viewing.company_name}</p>
                        <p className="text-muted-foreground">CUI: {viewing.company_cui} | Reg: {viewing.company_reg || "—"}</p>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{viewing.subtotal} RON</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Livrare</span><span className="text-foreground">{Number(viewing.shipping_cost) === 0 ? "GRATUITĂ" : `${viewing.shipping_cost} RON`}</span></div>
                    {Number(viewing.discount_amount) > 0 && (
                      <div className="flex justify-between text-accent"><span>Reducere ({viewing.discount_code})</span><span>-{viewing.discount_amount} RON</span></div>
                    )}
                    <div className="flex justify-between font-bold text-lg text-foreground pt-2 border-t border-border">
                      <span>Total</span><span>{viewing.total} RON</span>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "products" && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produs</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Cant.</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Preț unit.</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(viewing.items as any[])?.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.image_url && <img src={item.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" />}
                              <div>
                                <p className="font-medium text-foreground">{item.name}</p>
                                {item.sku && <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-foreground">{item.qty || item.quantity || 1}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{Number(item.price).toFixed(2)} RON</td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">{(Number(item.price) * Number(item.qty || item.quantity || 1)).toFixed(2)} RON</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2 uppercase">
                      <MessageSquare className="h-3.5 w-3.5" /> Note interne
                    </label>
                    <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={5} placeholder="Adaugă note interne despre această comandă..."
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                    <button onClick={async () => {
                      await supabase.from("orders").update({ notes: adminNote, updated_at: new Date().toISOString() }).eq("id", viewing.id);
                      showToast("✅ Notă salvată!");
                    }} className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
                      Salvează nota
                    </button>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4 text-xs text-muted-foreground space-y-1">
                    <p>Creat: {new Date(viewing.created_at).toLocaleString("ro-RO")}</p>
                    {viewing.updated_at && <p>Ultima actualizare: {new Date(viewing.updated_at).toLocaleString("ro-RO")}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
