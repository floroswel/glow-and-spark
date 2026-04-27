import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  RotateCcw, Search, Eye, X, ChevronLeft, ChevronRight,
  ArrowUpDown, Clock, CheckCircle, AlertTriangle, DollarSign,
  Package, RefreshCw, Download
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/returns")({
  component: AdminReturns,
});

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  approved: "Aprobat",
  rejected: "Respins",
  received: "Primit",
  refunded: "Rambursat",
};

const statusColors: Record<string, string> = {
  pending: "bg-accent/15 text-accent",
  approved: "bg-chart-1/15 text-chart-1",
  rejected: "bg-destructive/15 text-destructive",
  received: "bg-chart-4/15 text-chart-4",
  refunded: "bg-chart-2/15 text-chart-2",
};

const PAGE_SIZE = 20;

function AdminReturns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<any>(null);
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [rRes, oRes] = await Promise.all([
      supabase.from("returns").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("id, order_number, customer_name, customer_email, total"),
    ]);
    setReturns(rRes.data || []);
    setOrders(oRes.data || []);
    setLoading(false);
  }

  const getOrder = (orderId: string) => orders.find(o => o.id === orderId);

  const filtered = useMemo(() => {
    let list = [...returns];
    if (filterStatus !== "all") list = list.filter(r => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => {
        const order = getOrder(r.order_id);
        return order?.order_number?.toLowerCase().includes(q) ||
          order?.customer_name?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q);
      });
    }
    list.sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (sortField === "refund_amount") return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
      return sortDir === "asc" ? String(av || "").localeCompare(String(bv || "")) : String(bv || "").localeCompare(String(av || ""));
    });
    return list;
  }, [returns, filterStatus, search, sortField, sortDir, orders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: returns.length,
    pending: returns.filter(r => r.status === "pending").length,
    approved: returns.filter(r => r.status === "approved" || r.status === "received").length,
    totalRefunded: returns.filter(r => r.status === "refunded").reduce((s, r) => s + Number(r.refund_amount || 0), 0),
  }), [returns]);

  async function updateStatus(id: string, status: string) {
    await supabase.from("returns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);

    const ret = returns.find(r => r.id === id);
    if (ret && (status === "approved" || status === "rejected")) {
      const order = getOrder(ret.order_id);
      const customer_name = order?.customer_name || "Client";
      const customer_email = order?.customer_email || "";
      const orderNumber = order?.order_number || "";

      if (customer_email) {
        supabase.functions.invoke("send-email", {
          body: {
            type: status === "approved" ? "return_approved" : "return_rejected",
            customer_name,
            customer_email,
            orderNumber,
            reason: ret.reason,
          },
        }).catch(() => {});
      }

      if (ret.user_id) {
        supabase.from("user_notifications").insert({
          user_id: ret.user_id,
          title: status === "approved" ? "Retur aprobat ✓" : "Retur respins",
          message: status === "approved"
            ? "Returul tău a fost aprobat. Vei primi rambursarea în 3-5 zile lucrătoare."
            : "Returul tău a fost respins. Contactează-ne pentru detalii.",
          type: "system",
          link: "/account/orders",
          is_read: false,
        }).then(() => {});
      }
    }

    load();
    if (viewing?.id === id) setViewing({ ...viewing, status });
  }

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const exportCSV = () => {
    const headers = ["Comandă", "Client", "Motiv", "Suma ramburs", "Status", "Data"];
    const rows = filtered.map(r => {
      const o = getOrder(r.order_id);
      return [o?.order_number || "", o?.customer_name || "", r.reason, Number(r.refund_amount).toFixed(2), statusLabels[r.status] || r.status, new Date(r.created_at).toLocaleDateString("ro-RO")];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `retururi_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Retururi & Rambursări</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} retururi</p>
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

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total retururi", value: stats.total, icon: RotateCcw, color: "text-chart-1" },
          { label: "În așteptare", value: stats.pending, icon: Clock, color: "text-accent" },
          { label: "Aprobate/Primite", value: stats.approved, icon: CheckCircle, color: "text-chart-2" },
          { label: "Total rambursat", value: `${stats.totalRefunded.toFixed(0)} RON`, icon: DollarSign, color: "text-chart-4" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="mt-1.5 text-lg font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Caută după comandă, client, motiv..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">Toate statusurile</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort("created_at")}>
                <span className="flex items-center gap-1">Data <ArrowUpDown className="h-3 w-3 opacity-40" /></span>
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Comandă</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Client</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Motiv</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => toggleSort("refund_amount")}>
                <span className="flex items-center gap-1">Ramburs <ArrowUpDown className="h-3 w-3 opacity-40" /></span>
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Niciun retur găsit.
              </td></tr>
            ) : paginated.map(r => {
              const order = getOrder(r.order_id);
              return (
                <tr key={r.id} className="hover:bg-muted/20 transition cursor-pointer" onClick={() => setViewing(r)}>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{order?.order_number || "—"}</td>
                  <td className="px-3 py-2.5">{order?.customer_name || "—"}</td>
                  <td className="px-3 py-2.5 max-w-[200px] truncate">{r.reason}</td>
                  <td className="px-3 py-2.5 font-semibold">{Number(r.refund_amount).toFixed(2)} RON</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={e => { e.stopPropagation(); setViewing(r); }} className="text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Pagina {page} din {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border px-2 py-1 text-sm disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border px-2 py-1 text-sm disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setViewing(null)}>
          <div className="w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4 z-10">
              <h2 className="font-heading text-lg font-bold">Detalii Retur</h2>
              <button onClick={() => setViewing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Comandă</span>
                  <p className="font-mono text-sm font-semibold">{getOrder(viewing.order_id)?.order_number || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Client</span>
                  <p className="text-sm font-semibold">{getOrder(viewing.order_id)?.customer_name || "—"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Data</span>
                  <p className="text-sm">{new Date(viewing.created_at).toLocaleDateString("ro-RO")}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Sumă ramburs</span>
                  <p className="text-sm font-bold text-accent">{Number(viewing.refund_amount).toFixed(2)} RON</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Motiv</span>
                <p className="mt-1 text-sm bg-muted/30 rounded-lg p-3">{viewing.reason}</p>
              </div>
              {viewing.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Note</span>
                  <p className="mt-1 text-sm">{viewing.notes}</p>
                </div>
              )}
              {viewing.items && Array.isArray(viewing.items) && viewing.items.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Produse returnate</span>
                  <div className="mt-1 space-y-1">
                    {viewing.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm bg-muted/20 rounded-lg px-3 py-2">
                        <span>{item.name || item.product_name || `Produs ${i + 1}`}</span>
                        <span className="font-medium">x{item.quantity || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground mb-2 block">Schimbă status</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button key={key} onClick={() => updateStatus(viewing.id, key)}
                      disabled={viewing.status === key}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${viewing.status === key ? "ring-2 ring-accent opacity-100" : "opacity-60 hover:opacity-100"} ${statusColors[key] || "bg-muted"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
