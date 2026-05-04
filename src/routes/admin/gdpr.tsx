import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Download, Trash2, FileEdit, Check, X, Clock, Search, CalendarDays, Filter, ExternalLink, ArrowUpDown, FileDown, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { GDPR_RESPONSE_DAYS } from "@/lib/compliance";

export const Route = createFileRoute("/admin/gdpr")({
  component: AdminGdprPage,
});

const STATUS_OPTS = [
  { value: "all", label: "Toate", cls: "bg-secondary" },
  { value: "pending", label: "Noi", cls: "bg-amber-100 text-amber-800" },
  { value: "processing", label: "În lucru", cls: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Finalizate", cls: "bg-emerald-100 text-emerald-800" },
  { value: "rejected", label: "Respinse", cls: "bg-red-100 text-red-800" },
] as const;

const TYPE_OPTS = [
  { value: "all", label: "Toate tipurile" },
  { value: "export", label: "Export date" },
  { value: "rectify", label: "Rectificare" },
  { value: "delete", label: "Ștergere cont" },
] as const;

const TYPE_LABEL: Record<string, string> = { export: "Export date", delete: "Ștergere cont", rectify: "Rectificare" };

function AdminGdprPage() {
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "processed_desc" | "processed_asc">("created_desc");
  const [logOpen, setLogOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [gdprEnabled, setGdprEnabled] = useState(false);
  const [gdprToggleLoading, setGdprToggleLoading] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "gdpr_section_enabled").maybeSingle()
      .then(({ data }) => {
        if (data) setGdprEnabled(data.value === "true" || data.value === true);
      });
  }, []);

  const toggleGdprSection = async () => {
    setGdprToggleLoading(true);
    const newVal = !gdprEnabled;
    const { error } = await supabase.from("site_settings").update({ value: String(newVal) }).eq("key", "gdpr_section_enabled");
    if (error) toast.error("Eroare la salvare");
    else { setGdprEnabled(newVal); toast.success(newVal ? "Secțiunea GDPR activată pentru clienți" : "Secțiunea GDPR dezactivată pentru clienți"); }
    setGdprToggleLoading(false);
  };

  const load = async () => {
    let q = supabase.from("gdpr_requests").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (typeFilter !== "all") q = q.eq("request_type", typeFilter);
    if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    const { data } = await q;
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!logOpen || logEntries.length > 0) return;
    setLogLoading(true);
    supabase
      .from("admin_notifications")
      .select("id, title, message, created_at, is_read")
      .ilike("title", "%GDPR%")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => { setLogEntries(data ?? []); setLogLoading(false); });
  }, [logOpen]);

  const filtered = useMemo(() => {
    let list = items;
    if (searchEmail.trim()) {
      const term = searchEmail.toLowerCase();
      list = list.filter((r) => r.email?.toLowerCase().includes(term));
    }
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "processed_desc":
          return (b.processed_at ? new Date(b.processed_at).getTime() : 0) - (a.processed_at ? new Date(a.processed_at).getTime() : 0);
        case "processed_asc":
          return (a.processed_at ? new Date(a.processed_at).getTime() : 0) - (b.processed_at ? new Date(b.processed_at).getTime() : 0);
        default: // created_desc
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [items, searchEmail, sortBy]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("gdpr_requests")
      .update({ status, processed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Eroare"); else { toast.success("Actualizat"); load(); }
  };

  const stats = useMemo(() => {
    const all = items;
    return {
      total: all.length,
      pending: all.filter((r) => r.status === "pending").length,
      processing: all.filter((r) => r.status === "processing").length,
      completed: all.filter((r) => r.status === "completed").length,
    };
  }, [items]);

  const ICONS: Record<string, any> = { export: Download, delete: Trash2, rectify: FileEdit };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-accent" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Cereri GDPR</h1>
            <p className="text-sm text-muted-foreground">Răspuns obligatoriu în {GDPR_RESPONSE_DAYS} zile calendaristice</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleGdprSection}
            disabled={gdprToggleLoading}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              gdprEnabled
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${gdprEnabled ? "bg-emerald-500" : "bg-red-500"}`} />
            {gdprEnabled ? "Secțiune client ACTIVĂ" : "Secțiune client DEZACTIVATĂ"}
          </button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">{stats.pending} noi</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{stats.processing} în lucru</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">{stats.completed} finalizate</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="h-4 w-4" />
          Filtre
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s.value
                  ? s.value === "all" ? "bg-foreground text-primary-foreground" : s.cls + " ring-2 ring-offset-1 ring-accent/30"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Type filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Tip cerere</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              {TYPE_OPTS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> De la
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> Până la
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>

          {/* Email search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Search className="h-3 w-3" /> Caută email
            </label>
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="email@exemplu.ro"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" /> Sortare
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="created_desc">Dată creare (nou → vechi)</option>
              <option value="created_asc">Dată creare (vechi → nou)</option>
              <option value="processed_desc">Dată procesare (nou → vechi)</option>
              <option value="processed_asc">Dată procesare (vechi → nou)</option>
            </select>
          </div>

          {/* Reset */}
          {(typeFilter !== "all" || dateFrom || dateTo || searchEmail || sortBy !== "created_desc") && (
            <button
              onClick={() => { setTypeFilter("all"); setDateFrom(""); setDateTo(""); setSearchEmail(""); setSortBy("created_desc"); }}
              className="text-xs text-accent hover:underline py-1.5"
            >
              Resetează
            </button>
          )}
        </div>
      </div>

      {/* Results count + CSV export */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{filtered.length} cereri găsite</p>
        <button
          onClick={() => {
            const sortLabels: Record<string, string> = {
              created_desc: "Dată creare (nou → vechi)",
              created_asc: "Dată creare (vechi → nou)",
              processed_desc: "Dată procesare (nou → vechi)",
              processed_asc: "Dată procesare (vechi → nou)",
            };
            const statusLabel = STATUS_OPTS.find((s) => s.value === statusFilter)?.label ?? statusFilter;
            const typeLabel = TYPE_OPTS.find((t) => t.value === typeFilter)?.label ?? typeFilter;
            const meta = [
              `# Export GDPR — ${new Date().toLocaleString("ro-RO")}`,
              `# Status: ${statusLabel}`,
              `# Tip cerere: ${typeLabel}`,
              searchEmail ? `# Căutare email: ${searchEmail}` : "",
              dateFrom ? `# De la: ${dateFrom}` : "",
              dateTo ? `# Până la: ${dateTo}` : "",
              `# Sortare: ${sortLabels[sortBy] ?? sortBy}`,
              `# Total rezultate: ${filtered.length}`,
              "",
            ].filter(Boolean).join("\n") + "\n";
            const header = "ID,Tip,Status,Email,Creat,Procesat,Detalii\n";
            const rows = filtered.map((r: any) => {
              const t = TYPE_LABEL[r.request_type] ?? r.request_type;
              const s = r.status;
              const created = new Date(r.created_at).toLocaleString("ro-RO");
              const processed = r.processed_at ? new Date(r.processed_at).toLocaleString("ro-RO") : "";
              const details = (r.details ?? "").replace(/"/g, '""');
              return `GDPR-${r.id.slice(0, 8).toUpperCase()},"${t}","${s}","${r.email}","${created}","${processed}","${details}"`;
            }).join("\n");
            const bom = "\uFEFF";
            const blob = new Blob([bom + meta + header + rows], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `gdpr-export-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition disabled:opacity-50"
        >
          <FileDown className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nicio cerere.</p>}
        {filtered.map((r) => {
          const Icon = ICONS[r.request_type] ?? Shield;
          const daysSince = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
          const daysLeft = Math.max(0, GDPR_RESPONSE_DAYS - daysSince);
          const overdue = daysLeft === 0 && r.status !== "completed" && r.status !== "rejected";

          return (
            <div key={r.id} className={`p-4 flex flex-wrap items-start gap-4 ${overdue ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
              <Icon className="h-5 w-5 text-accent mt-0.5" />
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <Link to="/admin/gdpr/$id" params={{ id: r.id }} className="font-semibold text-foreground hover:text-accent transition">
                    {TYPE_LABEL[r.request_type] ?? r.request_type}
                  </Link>
                  <code className="text-[10px] text-muted-foreground font-mono">GDPR-{r.id.slice(0, 8).toUpperCase()}</code>
                  {overdue && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">TERMEN DEPĂȘIT</span>
                  )}
                  <Link to="/admin/gdpr/$id" params={{ id: r.id }} className="text-accent hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {r.email} · {new Date(r.created_at).toLocaleString("ro-RO")}
                  {r.status !== "completed" && r.status !== "rejected" && (
                    <span className={`ml-2 ${overdue ? "text-red-600 font-medium" : ""}`}>
                      · <Clock className="inline h-3 w-3" /> {daysLeft > 0 ? `${daysLeft}z rămase` : "termen expirat"}
                    </span>
                  )}
                </div>
                {r.details && <p className="mt-2 text-sm bg-secondary/50 rounded p-2">{r.details}</p>}
                {r.processed_at && (
                  <div className="text-xs text-muted-foreground mt-1">Procesat: {new Date(r.processed_at).toLocaleString("ro-RO")}</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {r.status === "pending" && (
                  <button onClick={() => updateStatus(r.id, "processing")} className="rounded-md bg-blue-500 text-white px-3 py-1.5 text-xs hover:bg-blue-600 transition">În lucru</button>
                )}
                {r.status !== "completed" && r.status !== "rejected" && (
                  <>
                    <button onClick={() => updateStatus(r.id, "completed")} className="rounded-md bg-emerald-500 text-white px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-emerald-600 transition"><Check className="h-3 w-3" />Finalizează</button>
                    <button onClick={() => updateStatus(r.id, "rejected")} className="rounded-md bg-red-500 text-white px-3 py-1.5 text-xs flex items-center gap-1 hover:bg-red-600 transition"><X className="h-3 w-3" />Respinge</button>
                  </>
                )}
                {(r.status === "completed" || r.status === "rejected") && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {r.status === "completed" ? "✓ Finalizată" : "✗ Respinsă"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* GDPR Notification Log */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition"
        >
          <span className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <Bell className="h-5 w-5 text-accent" /> Jurnal notificări GDPR
          </span>
          {logOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {logOpen && (
          <div className="border-t border-border">
            {logLoading ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Se încarcă…</p>
            ) : logEntries.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Nicio notificare GDPR înregistrată.</p>
            ) : (
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {logEntries.map((n) => {
                  // Extract GDPR ID from title
                  const idMatch = n.title?.match(/\[GDPR-([A-Z0-9]+)\]/);
                  const shortId = idMatch ? idMatch[1] : null;
                  // Detect type from title
                  const isNew = n.title?.includes("🆕");
                  const isStatusChange = !isNew && n.title?.includes("GDPR");

                  return (
                    <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.is_read ? "" : "bg-accent/5"}`}>
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? "bg-border" : "bg-accent"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">{n.title}</span>
                          {shortId && (
                            <code className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">GDPR-{shortId}</code>
                          )}
                        </div>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line line-clamp-2">{n.message}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {new Date(n.created_at).toLocaleString("ro-RO")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
