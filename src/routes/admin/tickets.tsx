import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Headphones, Plus, Clock, CheckCircle, AlertCircle, MessageSquare,
  Search, X, Send, ChevronRight, Flag, User, Calendar
} from "lucide-react";

export const Route = createFileRoute("/admin/tickets")({
  component: AdminTickets,
});

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Deschis", color: "bg-red-100 text-red-700", icon: AlertCircle },
  in_progress: { label: "În lucru", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  resolved: { label: "Rezolvat", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Închis", color: "bg-muted text-muted-foreground", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-red-500 text-white" },
  high: { label: "Ridicat", color: "bg-orange-100 text-orange-700" },
  medium: { label: "Mediu", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "Scăzut", color: "bg-green-100 text-green-700" },
};

const categoryLabels: Record<string, string> = {
  general: "General", order: "Comandă", return: "Retur", product: "Produs", payment: "Plată", other: "Altele",
};

function AdminTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", customer_name: "", customer_email: "", customer_phone: "", priority: "medium", category: "general" });
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const loadData = async () => {
    const [{ data: tix }, { data: msgs }] = await Promise.all([
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("ticket_messages").select("*").order("created_at", { ascending: true }),
    ]);
    setTickets(tix || []);
    setMessages(msgs || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const ticketMessages = (ticketId: string) => messages.filter(m => m.ticket_id === ticketId);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.subject?.toLowerCase().includes(q) || t.customer_name?.toLowerCase().includes(q) || t.customer_email?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tickets, filterStatus, filterPriority, search]);

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    total: tickets.length,
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    await supabase.from("ticket_messages").insert({
      ticket_id: selected.id,
      sender_type: "admin",
      sender_name: "Echipa",
      content: reply.trim(),
    });
    if (selected.status === "open") {
      await supabase.from("support_tickets").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", selected.id);
    }
    setReply("");
    setSending(false);
    await loadData();
    showToast("✅ Răspuns trimis!");
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status, updated_at: new Date().toISOString(), ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }).eq("id", ticketId);
    await loadData();
    if (selected?.id === ticketId) setSelected({ ...selected, status });
    showToast(`Status actualizat: ${statusConfig[status]?.label}`);
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.customer_name || !newTicket.customer_email) return;
    await supabase.from("support_tickets").insert({
      ...newTicket,
      sla_deadline: new Date(Date.now() + (newTicket.priority === "urgent" ? 4 : newTicket.priority === "high" ? 8 : 24) * 3600000).toISOString(),
    });
    setShowNew(false);
    setNewTicket({ subject: "", description: "", customer_name: "", customer_email: "", customer_phone: "", priority: "medium", category: "general" });
    await loadData();
    showToast("✅ Tichet creat!");
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tichete Support</h1>
          <p className="text-sm text-muted-foreground">{stats.total} tichete · {stats.open} deschise · {stats.in_progress} în lucru</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
          <Plus className="h-4 w-4" /> Tichet Nou
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Deschise", value: stats.open, color: "text-red-600", icon: AlertCircle },
          { label: "În lucru", value: stats.in_progress, color: "text-yellow-600", icon: Clock },
          { label: "Rezolvate", value: stats.resolved, color: "text-green-600", icon: CheckCircle },
          { label: "Total", value: stats.total, color: "text-foreground", icon: Headphones },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className={`flex items-center gap-2 ${s.color}`}><s.icon className="h-4 w-4" /><span className="text-xs">{s.label}</span></div>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută tichet..."
            className="w-full rounded-lg border border-border pl-9 pr-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">Toate statusurile</option>
          <option value="open">Deschise</option>
          <option value="in_progress">În lucru</option>
          <option value="resolved">Rezolvate</option>
          <option value="closed">Închise</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="all">Toate prioritățile</option>
          <option value="urgent">Urgent</option>
          <option value="high">Ridicat</option>
          <option value="medium">Mediu</option>
          <option value="low">Scăzut</option>
        </select>
      </div>

      {/* Ticket list */}
      <div className="space-y-2">
        {filtered.map(ticket => {
          const cfg = statusConfig[ticket.status] || statusConfig.open;
          const pri = priorityConfig[ticket.priority] || priorityConfig.medium;
          const msgs = ticketMessages(ticket.id);
          const slaOverdue = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date() && ticket.status !== "resolved" && ticket.status !== "closed";
          return (
            <button key={ticket.id} onClick={() => setSelected(ticket)}
              className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition hover:border-accent/30 ${slaOverdue ? "border-red-300 bg-red-50/50" : "bg-card"}`}>
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${ticket.priority === "urgent" ? "bg-red-500 animate-pulse" : ticket.priority === "high" ? "bg-orange-500" : ticket.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pri.color}`}>{pri.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{categoryLabels[ticket.category] || ticket.category}</span>
                  {slaOverdue && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">SLA depășit!</span>}
                </div>
                <h3 className="font-medium text-sm mt-1 truncate">{ticket.subject}</h3>
                <p className="text-xs text-muted-foreground">{ticket.customer_name} · {ticket.customer_email} · {new Date(ticket.created_at).toLocaleDateString("ro-RO")}</p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">{msgs.length}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          );
        })}
        {!filtered.length && (
          <div className="text-center py-12">
            <Headphones className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun tichet găsit.</p>
          </div>
        )}
      </div>

      {/* ===== Ticket Detail Modal ===== */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-lg overflow-hidden bg-card shadow-2xl flex flex-col animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusConfig[selected.status]?.color}`}>{statusConfig[selected.status]?.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityConfig[selected.priority]?.color}`}>{priorityConfig[selected.priority]?.label}</span>
                  </div>
                  <h2 className="font-heading text-lg font-bold mt-1 truncate">{selected.subject}</h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{selected.customer_name}</span>
                    <span>{selected.customer_email}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(selected.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                  {selected.sla_deadline && (
                    <p className={`text-xs mt-1 ${new Date(selected.sla_deadline) < new Date() ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      SLA: {new Date(selected.sla_deadline).toLocaleString("ro-RO")}
                      {new Date(selected.sla_deadline) < new Date() && " — DEPĂȘIT!"}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
              </div>
              {/* Status actions */}
              <div className="flex gap-2 mt-3">
                {["open", "in_progress", "resolved", "closed"].map(s => (
                  <button key={s} onClick={() => handleStatusChange(selected.id, s)} disabled={selected.status === s}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${selected.status === s ? statusConfig[s]?.color + " ring-1 ring-current" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
                    {statusConfig[s]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.description && (
                <div className="rounded-lg bg-muted p-3 text-sm mr-8">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descriere inițială</p>
                  <p>{selected.description}</p>
                </div>
              )}
              {ticketMessages(selected.id).map((msg: any) => (
                <div key={msg.id} className={`rounded-lg p-3 text-sm ${msg.sender_type === "admin" ? "bg-accent/10 ml-8" : "bg-muted mr-8"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{msg.sender_type === "admin" ? (msg.sender_name || "Echipa") : selected.customer_name}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString("ro-RO")}</span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>

            {/* Reply */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Scrie un răspuns..."
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  onKeyDown={e => e.key === "Enter" && handleSendReply()} />
                <button onClick={handleSendReply} disabled={sending || !reply.trim()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40 transition">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== New Ticket Modal ===== */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-heading text-lg font-bold">Tichet Nou</h2>
              <button onClick={() => setShowNew(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <input placeholder="Subiect *" value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              <textarea placeholder="Descriere" value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none min-h-[80px]" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nume client *" value={newTicket.customer_name} onChange={e => setNewTicket({ ...newTicket, customer_name: e.target.value })}
                  className="rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                <input placeholder="Email client *" value={newTicket.customer_email} onChange={e => setNewTicket({ ...newTicket, customer_email: e.target.value })}
                  className="rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <input placeholder="Telefon client" value={newTicket.customer_phone} onChange={e => setNewTicket({ ...newTicket, customer_phone: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <option value="low">Prioritate: Scăzută</option>
                  <option value="medium">Prioritate: Medie</option>
                  <option value="high">Prioritate: Ridicată</option>
                  <option value="urgent">Prioritate: Urgentă</option>
                </select>
                <select value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="border-t border-border p-4 flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary transition">Anulează</button>
              <button onClick={handleCreateTicket} disabled={!newTicket.subject || !newTicket.customer_name || !newTicket.customer_email}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40 transition">Creează Tichet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
