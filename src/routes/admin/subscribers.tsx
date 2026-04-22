import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Download, Upload, Search, Users, ToggleLeft, ToggleRight, Trash2,
  TrendingUp, UserPlus, UserMinus, BarChart3, Mail, Filter,
  ChevronLeft, ChevronRight
} from "lucide-react";

export const Route = createFileRoute("/admin/subscribers")({
  component: AdminSubscribers,
});

const PAGE_SIZE = 25;

function AdminSubscribers() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = async () => {
    const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
    setSubs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("newsletter_subscribers").update({ is_active: !current }).eq("id", id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur dorești să ștergi acest abonat?")) return;
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    showToast("Abonat șters.");
    load();
  };

  const filtered = useMemo(() => {
    let list = subs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => (s.email || "").toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q));
    }
    if (filterStatus === "active") list = list.filter(s => s.is_active);
    if (filterStatus === "inactive") list = list.filter(s => !s.is_active);
    if (filterSource !== "all") list = list.filter(s => (s.source || "popup") === filterSource);
    return list;
  }, [subs, search, filterStatus, filterSource]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, filterStatus, filterSource]);

  // Stats
  const activeCount = subs.filter(s => s.is_active).length;
  const inactiveCount = subs.length - activeCount;
  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    subs.forEach(s => { const src = s.source || "popup"; map[src] = (map[src] || 0) + 1; });
    return map;
  }, [subs]);
  const uniqueSources = Object.keys(sources);

  // Growth: new this month vs last month
  const now = new Date();
  const thisMonth = subs.filter(s => {
    const d = new Date(s.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const lastMonth = subs.filter(s => {
    const d = new Date(s.created_at);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }).length;
  const growthPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(0) : thisMonth > 0 ? "+∞" : "0";
  const withDiscount = subs.filter(s => s.discount_code).length;

  const exportCSV = () => {
    const csv = "\ufeffEmail,Nume,Sursă,Cod Reducere,Data,Status\n" + filtered.map((s) =>
      `"${s.email}","${s.name || ""}","${s.source || "popup"}","${s.discount_code || ""}","${new Date(s.created_at).toLocaleDateString("ro-RO")}","${s.is_active ? "Activ" : "Inactiv"}"`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `abonati_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    showToast("📥 Export CSV complet!");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(1).filter(l => l.trim());
      const existingEmails = new Set(subs.map(s => s.email.toLowerCase()));
      const toInsert: any[] = [];
      for (const line of lines) {
        const parts = line.split(",").map(p => p.replace(/"/g, "").trim());
        const email = parts[0]?.toLowerCase();
        if (!email || !email.includes("@") || existingEmails.has(email)) continue;
        existingEmails.add(email);
        toInsert.push({ email, name: parts[1] || null, source: "import", is_active: true });
      }
      if (toInsert.length) {
        for (let i = 0; i < toInsert.length; i += 50) {
          await supabase.from("newsletter_subscribers").insert(toInsert.slice(i, i + 50));
        }
        showToast(`✅ ${toInsert.length} abonați importați!`);
        load();
      } else {
        showToast("Nu s-au găsit emailuri noi de importat.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Abonați Newsletter</h1>
          <p className="text-sm text-muted-foreground">{subs.length} total · {activeCount} activi · {thisMonth} noi luna aceasta</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition cursor-pointer">
            <Upload className="h-4 w-4" /> Import
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total abonați", value: subs.length, icon: Users, color: "text-foreground" },
          { label: "Activi", value: activeCount, icon: Mail, color: "text-chart-2" },
          { label: "Inactivi", value: inactiveCount, icon: UserMinus, color: "text-destructive" },
          { label: "Noi luna asta", value: thisMonth, icon: UserPlus, color: "text-chart-1" },
          { label: "Creștere", value: `${growthPct}%`, icon: TrendingUp, color: "text-accent" },
          { label: "Cu cupon", value: withDiscount, icon: BarChart3, color: "text-chart-4" },
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

      {/* Source breakdown */}
      {uniqueSources.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {uniqueSources.sort().map(src => (
            <div key={src} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">{src}: </span>
              <span className="font-semibold text-foreground">{sources[src]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Caută după email sau nume..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none">
          <option value="all">Toți</option>
          <option value="active">Activi</option>
          <option value="inactive">Inactivi</option>
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none">
          <option value="all">Toate sursele</option>
          {uniqueSources.sort().map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Nume</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Sursă</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Cod</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Data</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((s) => (
              <tr key={s.id} className="hover:bg-secondary/30 transition">
                <td className="px-4 py-3 text-foreground">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.name || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{s.source || "popup"}</span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground hidden md:table-cell">{s.discount_code || "—"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground text-xs hidden lg:table-cell">{new Date(s.created_at).toLocaleDateString("ro-RO")}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(s.id, s.is_active)} className="transition">
                    {s.is_active ? <ToggleRight className="h-6 w-6 text-accent" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun abonat găsit.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm text-muted-foreground">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
