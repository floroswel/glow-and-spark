import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye, X, Search, Download, Calendar, Printer, MessageSquare,
  ChevronLeft, ChevronRight, RefreshCw, Package, TrendingUp,
  CreditCard, Clock, CheckSquare, Square, Trash2, AlertTriangle,
  ArrowUpDown, FileText, Truck, Mail, Filter, MoreHorizontal,
  ArrowRight, DollarSign, ShoppingBag, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

const paymentMethodLabels: Record<string, string> = {
  ramburs: "Ramburs",
  card: "Card Online",
  transfer: "Transfer Bancar",
};

const PAGE_SIZE = 25;

function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [viewing, setViewing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Order notes (drawer)
  const [notes, setNotes] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [drawerTab, setDrawerTab] = useState<"details" | "products" | "notes" | "timeline">("details");

  // Bulk
  const [bulkAction, setBulkAction] = useState("");

  // Aggregate stats (independent of pagination)
  const [stats, setStats] = useState({ total: 0, count: 0, pending: 0, processing: 0, shipped: 0, aov: 0 });

  // Debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, filterPayment, filterPaymentStatus, dateFrom, dateTo, minValue, maxValue, sortField, sortDir]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("orders").select("*", { count: "exact" });
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (filterPayment !== "all") q = q.eq("payment_method", filterPayment);
    if (filterPaymentStatus !== "all") q = q.eq("payment_status", filterPaymentStatus);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    if (minValue) q = q.gte("total", Number(minValue));
    if (maxValue) q = q.lte("total", Number(maxValue));
    if (debouncedSearch) {
      const s = debouncedSearch.replace(/[%,()]/g, "");
      if (s) q = q.or(`customer_name.ilike.%${s}%,customer_email.ilike.%${s}%,order_number.ilike.%${s}%,customer_phone.ilike.%${s}%`);
    }
    q = q.order(sortField, { ascending: sortDir === "asc" });
    q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count } = await q;
    setOrders(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, debouncedSearch, filterStatus, filterPayment, filterPaymentStatus, dateFrom, dateTo, minValue, maxValue, sortField, sortDir]);

  const loadStats = useCallback(async () => {
    const [allRes, pendingRes, processingRes, shippedRes, totalsRes] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "processing"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "shipped"),
      supabase.from("orders").select("total"),
    ]);
    const totals = (totalsRes.data || []).reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const cnt = allRes.count || 0;
    setStats({
      total: totals,
      count: cnt,
      pending: pendingRes.count || 0,
      processing: processingRes.count || 0,
      shipped: shippedRes.count || 0,
      aov: cnt > 0 ? totals / cnt : 0,
    });
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { load(); loadStats(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, loadStats]);

  // Load notes & timeline for drawer
  useEffect(() => {
    if (!viewing) return;
    Promise.all([
      supabase.from("order_notes").select("*").eq("order_id", viewing.id).order("created_at", { ascending: false }),
      supabase.from("order_timeline").select("*").eq("order_id", viewing.id).order("created_at", { ascending: false }),
    ]).then(([n, t]) => {
      setNotes(n.data || []);
      setTimeline(t.data || []);
    });
  }, [viewing]);

  const filtered = orders;
  const paginated = orders;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));


  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((o) => o.id)));
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (user) {
      await supabase.from("order_timeline").insert({ order_id: id, action: `Status schimbat: ${statusLabels[status] || status}`, performed_by: user.id });
    }

    // Send email notification for shipped/completed
    const order = orders.find((o) => o.id === id);
    if (order && (status === "shipped" || status === "completed")) {
      supabase.functions.invoke("send-email", {
        body: {
          type: status === "shipped" ? "order_shipped" : "order_completed",
          to: order.customer_email,
          data: {
            orderNumber: order.order_number,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            tracking_number: order.awb_number || null,
            total: order.total,
          },
        },
      }).catch(() => {});
    }

    load();
    if (viewing?.id === id) setViewing({ ...viewing, status });
  };

  const updatePaymentStatus = async (id: string, payment_status: string) => {
    await supabase.from("orders").update({ payment_status, updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);
    if (bulkAction === "delete") {
      if (!confirm(`Ștergi ${ids.length} comenzi?`)) return;
      for (const id of ids) await supabase.from("orders").delete().eq("id", id);
    } else {
      for (const id of ids) await supabase.from("orders").update({ status: bulkAction }).eq("id", id);
    }
    setSelected(new Set());
    setBulkAction("");
    load();
  };

  const addNote = async () => {
    if (!newNote.trim() || !viewing || !user) return;
    await supabase.from("order_notes").insert({ order_id: viewing.id, user_id: user.id, note: newNote.trim() });
    await supabase.from("order_timeline").insert({ order_id: viewing.id, action: "Notă adăugată", details: { note: newNote.trim() }, performed_by: user.id });
    setNewNote("");
    const { data } = await supabase.from("order_notes").select("*").eq("order_id", viewing.id).order("created_at", { ascending: false });
    setNotes(data || []);
  };

  const exportCSV = () => {
    const headers = ["Număr", "Client", "Email", "Telefon", "Total", "Status", "Plată", "Status plată", "Data"];
    const rows = filtered.map((o) => [o.order_number, o.customer_name, o.customer_email, o.customer_phone || "", Number(o.total).toFixed(2), statusLabels[o.status] || o.status, paymentMethodLabels[o.payment_method] || o.payment_method || "", paymentStatusLabels[o.payment_status] || o.payment_status || "", new Date(o.created_at).toLocaleDateString("ro-RO")]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `comenzi_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">{children} <ArrowUpDown className="h-3 w-3 opacity-40" /></span>
    </th>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Comenzi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} comenzi {filterStatus !== "all" ? `(${statusLabels[filterStatus]})` : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary transition">
            <RefreshCw className="h-4 w-4" /> Reîmprospătează
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 py-2 text-sm hover:opacity-90 transition">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Venituri totale", value: `${stats.total.toFixed(0)} RON`, icon: DollarSign, color: "text-accent" },
          { label: "Total comenzi", value: stats.count, icon: ShoppingBag, color: "text-chart-1" },
          { label: "În așteptare", value: stats.pending, icon: Clock, color: "text-chart-3" },
          { label: "În procesare", value: stats.processing, icon: Package, color: "text-chart-4" },
          { label: "Valoare medie", value: `${stats.aov.toFixed(0)} RON`, icon: TrendingUp, color: "text-chart-2" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="mt-1.5 text-lg font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Caută după client, email, telefon, număr..." className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Toate statusurile</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterPaymentStatus} onChange={(e) => { setFilterPaymentStatus(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="all">Plată: Toate</option>
            {Object.entries(paymentStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary transition">
            <Filter className="h-4 w-4" /> Filtre
          </button>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">De la</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Până la</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valoare min (RON)</label>
              <input type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valoare max (RON)</label>
              <input type="number" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
            </div>
            <select value={filterPayment} onChange={(e) => { setFilterPayment(e.target.value); setPage(1); }} className="rounded border border-border bg-background px-2 py-1.5 text-sm">
              <option value="all">Metodă plată: Toate</option>
              {Object.entries(paymentMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selectate</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm">
            <option value="">Acțiune...</option>
            <option value="processing">→ În procesare</option>
            <option value="shipped">→ Expediată</option>
            <option value="delivered">→ Livrată</option>
            <option value="cancelled">→ Anulată</option>
            <option value="delete">🗑 Șterge</option>
          </select>
          <button onClick={handleBulkAction} disabled={!bulkAction} className="rounded-lg bg-accent text-accent-foreground px-3 py-1 text-sm font-medium disabled:opacity-50">Aplică</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 w-10">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                    {selected.size === paginated.length && paginated.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <SortHeader field="order_number">Nr.</SortHeader>
                <SortHeader field="customer_name">Client</SortHeader>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Produse</th>
                <SortHeader field="total">Total</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <SortHeader field="payment_method">Plată</SortHeader>
                <SortHeader field="payment_status">Status plată</SortHeader>
                <SortHeader field="created_at">Data</SortHeader>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={10} className="px-3 py-3"><div className="h-5 rounded bg-muted animate-pulse" /></td></tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-12 text-center text-muted-foreground">Nicio comandă găsită.</td></tr>
              ) : (
                paginated.map((o) => {
                  const items = Array.isArray(o.items) ? o.items : [];
                  return (
                    <tr key={o.id} className={`hover:bg-muted/20 transition cursor-pointer ${selected.has(o.id) ? "bg-accent/5" : ""}`} onClick={() => setViewing(o)}>
                      <td className="px-3 py-2.5" onClick={(e) => { e.stopPropagation(); toggleSelect(o.id); }}>
                        {selected.has(o.id) ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{o.order_number}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-foreground">{o.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex -space-x-1">
                          {items.slice(0, 3).map((item: any, idx: number) => (
                            item.image_url ? (
                              <img key={idx} src={item.image_url} alt="" className="h-7 w-7 rounded border-2 border-card object-cover" />
                            ) : (
                              <div key={idx} className="h-7 w-7 rounded border-2 border-card bg-muted flex items-center justify-center">
                                <Package className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )
                          ))}
                          {items.length > 3 && <div className="h-7 w-7 rounded border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">+{items.length - 3}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-semibold">{Number(o.total).toFixed(2)} RON</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>
                          {statusLabels[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{paymentMethodLabels[o.payment_method] || o.payment_method || "-"}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          o.payment_status === "paid" ? "bg-chart-2/15 text-chart-2" :
                          o.payment_status === "failed" ? "bg-destructive/15 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>{paymentStatusLabels[o.payment_status] || o.payment_status || "-"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("ro-RO")}
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setViewing(o)} className="rounded p-1 hover:bg-secondary transition"><Eye className="h-4 w-4 text-muted-foreground" /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">Pagina {page} din {totalPages} ({filtered.length} rezultate)</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded p-1.5 hover:bg-secondary disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : Math.min(page - 2 + i, totalPages);
                return (
                  <button key={p} onClick={() => setPage(p)} className={`rounded px-2.5 py-1 text-xs ${p === page ? "bg-accent text-accent-foreground" : "hover:bg-secondary"}`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded p-1.5 hover:bg-secondary disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-xl bg-background border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold">Comanda {viewing.order_number}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[viewing.status] || "bg-muted text-muted-foreground"}`}>
                  {statusLabels[viewing.status] || viewing.status}
                </span>
              </div>
              <button onClick={() => setViewing(null)} className="rounded-lg p-2 hover:bg-secondary transition"><X className="h-5 w-5" /></button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-6 flex gap-0">
              {(["details", "products", "notes", "timeline"] as const).map((tab) => (
                <button key={tab} onClick={() => setDrawerTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${drawerTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {tab === "details" ? "Detalii" : tab === "products" ? "Produse" : tab === "notes" ? "Note" : "Istoric"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              {drawerTab === "details" && (
                <>
                  {/* Customer Info */}
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Informații client</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Nume:</span> <span className="font-medium">{viewing.customer_name}</span></div>
                      <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{viewing.customer_email}</span></div>
                      <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{viewing.customer_phone || "-"}</span></div>
                      <div><span className="text-muted-foreground">Tip:</span> <span className="font-medium">{viewing.billing_type === "company" ? "Persoană juridică" : "Persoană fizică"}</span></div>
                    </div>
                    {viewing.billing_type === "company" && (
                      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border">
                        <div><span className="text-muted-foreground">Firmă:</span> <span className="font-medium">{viewing.company_name}</span></div>
                        <div><span className="text-muted-foreground">CUI:</span> <span className="font-medium">{viewing.company_cui}</span></div>
                      </div>
                    )}
                  </div>

                  {/* Delivery */}
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Adresă livrare</h3>
                    <p className="text-sm">{viewing.shipping_address}</p>
                    <p className="text-sm">{viewing.city}, {viewing.county} {viewing.postal_code}</p>
                  </div>

                  {/* Financial */}
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Financiar</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{Number(viewing.subtotal).toFixed(2)} RON</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Livrare</span><span>{Number(viewing.shipping_cost || 0).toFixed(2)} RON</span></div>
                      {Number(viewing.discount_amount) > 0 && (
                        <div className="flex justify-between text-chart-2"><span>Discount ({viewing.discount_code})</span><span>-{Number(viewing.discount_amount).toFixed(2)} RON</span></div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-1 border-t border-border"><span>Total</span><span>{Number(viewing.total).toFixed(2)} RON</span></div>
                    </div>
                  </div>

                  {/* AWB / Tracking */}
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">AWB & Tracking</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Număr AWB" defaultValue={viewing.awb_number || ""} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        onBlur={async (e) => { if (e.target.value !== (viewing.awb_number || "")) { await supabase.from("orders").update({ awb_number: e.target.value }).eq("id", viewing.id); setViewing({...viewing, awb_number: e.target.value}); }}} />
                      <select defaultValue={viewing.awb_carrier || ""} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        onChange={async (e) => { await supabase.from("orders").update({ awb_carrier: e.target.value }).eq("id", viewing.id); setViewing({...viewing, awb_carrier: e.target.value}); }}>
                        <option value="">Curier...</option>
                        <option value="fan">Fan Courier</option>
                        <option value="sameday">Sameday</option>
                        <option value="gls">GLS</option>
                        <option value="cargus">Cargus</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Schimbă status</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <button key={k} disabled={viewing.status === k} onClick={() => updateStatus(viewing.id, k)}
                          className={`text-xs rounded-full px-3 py-1 font-medium transition disabled:opacity-30 ${statusColors[k]}`}>{v}</button>
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground pt-2">Status plată</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(paymentStatusLabels).map(([k, v]) => (
                        <button key={k} disabled={viewing.payment_status === k} onClick={() => updatePaymentStatus(viewing.id, k)}
                          className="text-xs rounded-full px-3 py-1 font-medium border border-border hover:bg-secondary transition disabled:opacity-30">{v}</button>
                      ))}
                    </div>
                    {/* Print Invoice */}
                    <button onClick={() => {
                      const w = window.open("", "_blank");
                      if (!w) return;
                      const items = Array.isArray(viewing.items) ? viewing.items : [];
                      w.document.write(`<html><head><title>Factură ${viewing.order_number}</title><style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:auto}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.header{display:flex;justify-content:space-between}.total{font-size:18px;font-weight:bold;text-align:right}@media print{button{display:none}}</style></head><body>
                        <div class="header"><div><h1>FACTURĂ PROFORMĂ</h1><p>${viewing.order_number}</p><p>Data: ${new Date(viewing.created_at).toLocaleDateString("ro-RO")}</p></div></div>
                        <h3>Client</h3><p>${viewing.customer_name}<br>${viewing.customer_email}<br>${viewing.customer_phone || ""}<br>${viewing.shipping_address || ""}, ${viewing.city || ""}, ${viewing.county || ""}</p>
                        ${viewing.billing_type === "company" ? `<p>Firmă: ${viewing.company_name || ""} | CUI: ${viewing.company_cui || ""} | Reg: ${viewing.company_reg || ""}</p>` : ""}
                        <table><thead><tr><th>#</th><th>Produs</th><th>Cant.</th><th>Preț</th><th>Total</th></tr></thead><tbody>
                        ${items.map((it: any, i: number) => `<tr><td>${i+1}</td><td>${it.name||it.product_name||"Produs"}</td><td>${it.quantity||it.qty||1}</td><td>${Number(it.price||0).toFixed(2)} RON</td><td>${(Number(it.price||0)*Number(it.quantity||it.qty||1)).toFixed(2)} RON</td></tr>`).join("")}
                        </tbody></table>
                        <p>Subtotal: ${Number(viewing.subtotal).toFixed(2)} RON</p>
                        <p>Livrare: ${Number(viewing.shipping_cost||0).toFixed(2)} RON</p>
                        ${Number(viewing.discount_amount)>0?`<p>Discount: -${Number(viewing.discount_amount).toFixed(2)} RON</p>`:""}
                        <p class="total">TOTAL: ${Number(viewing.total).toFixed(2)} RON</p>
                        <button onclick="window.print()">🖨️ Printează</button></body></html>`);
                      w.document.close();
                    }} className="mt-3 w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-secondary transition flex items-center justify-center gap-2">
                      <Printer className="h-4 w-4" /> Printează Factură
                    </button>
                  </div>
                </>
              )}

              {drawerTab === "products" && (
                <div className="space-y-3">
                  {(Array.isArray(viewing.items) ? viewing.items : []).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 rounded-lg border border-border p-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name || item.product_name || "Produs"}</p>
                        {item.variant_name && <p className="text-xs text-muted-foreground">Variantă: {item.variant_name}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{Number(item.price || 0).toFixed(2)} RON</span>
                          <span>× {item.quantity || 1}</span>
                          <span className="font-semibold text-foreground">{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} RON</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Adaugă o notă internă..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addNote()} />
                    <button onClick={addNote} className="rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-medium">Salvează</button>
                  </div>
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nicio notă.</p>
                  ) : (
                    notes.map((n: any) => (
                      <div key={n.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm">{n.note}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("ro-RO")}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {drawerTab === "timeline" && (
                <div className="space-y-0">
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nicio activitate.</p>
                  ) : (
                    <div className="relative pl-6">
                      <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
                      {timeline.map((t: any) => (
                        <div key={t.id} className="relative pb-4">
                          <div className="absolute left-[-14px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-background" />
                          <p className="text-sm font-medium text-foreground">{t.action}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ro-RO")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
