import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Headphones, Plus, Clock, CheckCircle, AlertCircle, MessageSquare, Search, X } from "lucide-react";

export const Route = createFileRoute("/admin/tickets")({
  component: AdminTickets,
});

interface Ticket {
  id: string; subject: string; customer_name: string; customer_email: string;
  status: "open" | "in_progress" | "resolved" | "closed"; priority: "low" | "medium" | "high";
  created_at: string; messages: { from: string; text: string; date: string }[];
}

const demoTickets: Ticket[] = [
  { id: "T-001", subject: "Comandă nelivrată #LM-1024", customer_name: "Maria Ionescu", customer_email: "maria@test.com", status: "open", priority: "high", created_at: "2026-04-21T10:00:00Z", messages: [{ from: "client", text: "Bună ziua, comanda mea nu a ajuns încă. Puteți verifica?", date: "2026-04-21T10:00:00Z" }] },
  { id: "T-002", subject: "Produs defect - lumânare spartă", customer_name: "Ion Popescu", customer_email: "ion@test.com", status: "in_progress", priority: "medium", created_at: "2026-04-20T14:30:00Z", messages: [{ from: "client", text: "Am primit lumânarea spartă. Vreau înlocuire.", date: "2026-04-20T14:30:00Z" }, { from: "admin", text: "Ne pare rău! Vă trimitem un produs nou.", date: "2026-04-20T15:00:00Z" }] },
  { id: "T-003", subject: "Informații despre parfumul lavandă", customer_name: "Ana Dumitrescu", customer_email: "ana@test.com", status: "resolved", priority: "low", created_at: "2026-04-19T09:00:00Z", messages: [{ from: "client", text: "Ce tip de ceară folosiți?", date: "2026-04-19T09:00:00Z" }, { from: "admin", text: "Folosim ceară de soia 100% naturală.", date: "2026-04-19T09:30:00Z" }] },
];

function AdminTickets() {
  const [tickets] = useState<Ticket[]>(demoTickets);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reply, setReply] = useState("");

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    open: { label: "Deschis", color: "bg-red-100 text-red-700", icon: AlertCircle },
    in_progress: { label: "În lucru", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    resolved: { label: "Rezolvat", color: "bg-green-100 text-green-700", icon: CheckCircle },
    closed: { label: "Închis", color: "bg-muted text-muted-foreground", icon: CheckCircle },
  };

  const priorityColors: Record<string, string> = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" };

  const filtered = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.subject.toLowerCase().includes(s) || t.customer_name.toLowerCase().includes(s) || t.id.toLowerCase().includes(s);
    }
    return true;
  });

  const stats = { open: tickets.filter(t => t.status === "open").length, in_progress: tickets.filter(t => t.status === "in_progress").length, resolved: tickets.filter(t => t.status === "resolved").length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Tichete Support</h1>
          <p className="text-sm text-muted-foreground">Gestionare cereri și reclamații clienți</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-red-600"><AlertCircle className="h-4 w-4" /><span className="text-xs">Deschise</span></div><p className="mt-1 text-2xl font-bold">{stats.open}</p></div>
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-yellow-600"><Clock className="h-4 w-4" /><span className="text-xs">În lucru</span></div><p className="mt-1 text-2xl font-bold">{stats.in_progress}</p></div>
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-4 w-4" /><span className="text-xs">Rezolvate</span></div><p className="mt-1 text-2xl font-bold">{stats.resolved}</p></div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută tichet..." className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="all">Toate</option>
          <option value="open">Deschise</option>
          <option value="in_progress">În lucru</option>
          <option value="resolved">Rezolvate</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(ticket => {
          const cfg = statusConfig[ticket.status];
          return (
            <button key={ticket.id} onClick={() => setSelected(ticket)}
              className="w-full flex items-center gap-4 rounded-xl border bg-card p-4 text-left hover:border-accent/30 transition">
              <div className={`h-2 w-2 rounded-full ${priorityColors[ticket.priority]}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <h3 className="font-medium text-sm mt-0.5">{ticket.subject}</h3>
                <p className="text-xs text-muted-foreground">{ticket.customer_name} • {new Date(ticket.created_at).toLocaleDateString("ro-RO")}</p>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" /><span className="text-xs">{ticket.messages.length}</span></div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{selected.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusConfig[selected.status].color}`}>{statusConfig[selected.status].label}</span>
                </div>
                <h2 className="font-heading text-lg font-bold mt-1">{selected.subject}</h2>
                <p className="text-xs text-muted-foreground">{selected.customer_name} ({selected.customer_email})</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages.map((msg, i) => (
                <div key={i} className={`rounded-lg p-3 text-sm ${msg.from === "admin" ? "bg-accent/10 ml-8" : "bg-muted mr-8"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{msg.from === "admin" ? "Echipa" : selected.customer_name}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.date).toLocaleString("ro-RO")}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Scrie un răspuns..."
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm" />
                <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Trimite</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
