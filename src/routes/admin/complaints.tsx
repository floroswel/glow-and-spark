import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, Search, Eye, X, ChevronLeft, ChevronRight,
  ArrowUpDown, Clock, CheckCircle, RefreshCw, Download, Plus, MessageSquare
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/complaints")({
  component: AdminComplaints,
});

const statusLabels: Record<string, string> = {
  open: "Deschisă",
  in_progress: "În lucru",
  resolved: "Rezolvată",
  closed: "Închisă",
};

const statusColors: Record<string, string> = {
  open: "bg-destructive/15 text-destructive",
  in_progress: "bg-accent/15 text-accent",
  resolved: "bg-chart-2/15 text-chart-2",
  closed: "bg-muted text-muted-foreground",
};

const priorityLabels: Record<string, string> = {
  low: "Scăzută",
  medium: "Medie",
  high: "Ridicată",
  urgent: "Urgentă",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent/15 text-accent",
  high: "bg-chart-3/15 text-chart-3",
  urgent: "bg-destructive/15 text-destructive",
};

const PAGE_SIZE = 20;

function AdminComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ customer_name: "", customer_email: "", subject: "", description: "", priority: "medium", order_id: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = [...complaints];
    if (filterStatus !== "all") list = list.filter(c => c.status === filterStatus);
    if (filterPriority !== "all") list = list.filter(c => c.priority === filterPriority);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.customer_name?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q) || c.customer_email?.toLowerCase().includes(q));
    }
    return list;
  }, [complaints, filterStatus, filterPriority, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter(c => c.status === "open").length,
    inProgress: complaints.filter(c => c.status === "in_progress").length,
    overdue: complaints.filter(c => c.sla_deadline && new Date(c.sla_deadline) < new Date() && c.status !== "resolved" && c.status !== "closed").length,
  }), [complaints]);

  async function updateStatus(id: string, status: string) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    await supabase.from("complaints").update(updates).eq("id", id);
    load();
    if (viewing?.id === id) setViewing({ ...viewing, ...updates });
  }

  async function createComplaint() {
    if (!newForm.customer_name || !newForm.customer_email || !newForm.subject) return;
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + (newForm.priority === "urgent" ? 4 : newForm.priority === "high" ? 24 : 72));
    await supabase.from("complaints").insert({
      ...newForm,
      order_id: newForm.order_id || null,
      sla_deadline: slaDeadline.toISOString(),
    });
    setShowNew(false);
    setNewForm({ customer_name: "", customer_email: "", subject: "", description: "", priority: "medium", order_id: "" });
    load();
  }

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Reclamații</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} reclamații</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary transition">
            <RefreshCw className="h-4 w-4" /> Reîmprospătează
          </button>
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 py-2 text-sm hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> Reclamație Nouă
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: MessageSquare, color: "text-chart-1" },
          { label: "Deschise", value: stats.open, icon: AlertTriangle, color: "text-destructive" },
          { label: "În lucru", value: stats.inProgress, icon: Clock, color: "text-accent" },
          { label: "Depășit SLA", value: stats.overdue, icon: AlertTriangle, color: "text-destructive" },
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
            placeholder="Caută după client, subiect..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">Toate statusurile</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">Toate prioritățile</option>
          {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Data</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Client</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Subiect</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Prioritate</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">SLA</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />Nicio reclamație.
              </td></tr>
            ) : paginated.map(c => {
              const overdue = c.sla_deadline && new Date(c.sla_deadline) < new Date() && c.status !== "resolved" && c.status !== "closed";
              return (
                <tr key={c.id} className={`hover:bg-muted/20 transition cursor-pointer ${overdue ? "bg-destructive/5" : ""}`} onClick={() => setViewing(c)}>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ro-RO")}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-sm">{c.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{c.customer_email}</p>
                  </td>
                  <td className="px-3 py-2.5 max-w-[200px] truncate">{c.subject}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[c.priority] || "bg-muted"}`}>
                      {priorityLabels[c.priority] || c.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || "bg-muted"}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {c.sla_deadline ? (
                      <span className={overdue ? "text-destructive font-bold" : "text-muted-foreground"}>
                        {overdue ? "⚠ Depășit" : new Date(c.sla_deadline).toLocaleDateString("ro-RO")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={e => { e.stopPropagation(); setViewing(c); }} className="text-muted-foreground hover:text-foreground">
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
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border px-2 py-1 text-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border px-2 py-1 text-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* New complaint dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">Reclamație Nouă</h2>
              <button onClick={() => setShowNew(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <input value={newForm.customer_name} onChange={e => setNewForm(p => ({ ...p, customer_name: e.target.value }))}
                placeholder="Nume client *" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={newForm.customer_email} onChange={e => setNewForm(p => ({ ...p, customer_email: e.target.value }))}
                placeholder="Email client *" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input value={newForm.subject} onChange={e => setNewForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Subiect *" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea value={newForm.description} onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descriere..." rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <select value={newForm.priority} onChange={e => setNewForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button onClick={createComplaint} className="w-full rounded-lg bg-accent text-accent-foreground py-2 text-sm font-medium hover:opacity-90 transition">
                Crează Reclamație
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setViewing(null)}>
          <div className="w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4 z-10">
              <h2 className="font-heading text-lg font-bold">Detalii Reclamație</h2>
              <button onClick={() => setViewing(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-muted-foreground">Client</span><p className="text-sm font-semibold">{viewing.customer_name}</p></div>
                <div><span className="text-xs text-muted-foreground">Email</span><p className="text-sm">{viewing.customer_email}</p></div>
                <div><span className="text-xs text-muted-foreground">Data</span><p className="text-sm">{new Date(viewing.created_at).toLocaleDateString("ro-RO")}</p></div>
                <div><span className="text-xs text-muted-foreground">Prioritate</span>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[viewing.priority]}`}>{priorityLabels[viewing.priority]}</span>
                </div>
              </div>
              <div><span className="text-xs text-muted-foreground">Subiect</span><p className="mt-1 text-sm font-medium">{viewing.subject}</p></div>
              {viewing.description && (
                <div><span className="text-xs text-muted-foreground">Descriere</span><p className="mt-1 text-sm bg-muted/30 rounded-lg p-3">{viewing.description}</p></div>
              )}
              <div>
                <span className="text-xs text-muted-foreground mb-2 block">Schimbă status</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button key={key} onClick={() => updateStatus(viewing.id, key)}
                      disabled={viewing.status === key}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${viewing.status === key ? "ring-2 ring-accent" : "opacity-60 hover:opacity-100"} ${statusColors[key]}`}>
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
