import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, ChevronLeft, ChevronRight, RefreshCw, User, Package, ShoppingCart, Settings, Tag, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/activity")({
  component: AdminActivity,
});

const PAGE_SIZE = 30;

const entityIcons: Record<string, any> = {
  product: Package,
  order: ShoppingCart,
  customer: User,
  setting: Settings,
  coupon: Tag,
  page: FileText,
};

function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(500);
    setLogs(data || []);
    setLoading(false);
  }

  const filtered = logs.filter(l => {
    if (filterEntity !== "all" && l.entity_type !== filterEntity) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.action?.toLowerCase().includes(q) || l.entity_name?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const entityTypes = [...new Set(logs.map(l => l.entity_type))].filter(Boolean);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Jurnal Activitate</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} acțiuni înregistrate</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary transition">
          <RefreshCw className="h-4 w-4" /> Reîmprospătează
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Caută acțiuni, utilizatori, entități..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">Toate entitățile</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nicio activitate înregistrată încă.</p>
            <p className="text-xs text-muted-foreground mt-1">Acțiunile adminilor vor apărea aici automat.</p>
          </div>
        ) : paginated.map(log => {
          const Icon = entityIcons[log.entity_type] || Activity;
          return (
            <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/20 transition">
              <div className="mt-0.5 rounded-lg bg-accent/10 p-1.5">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{log.user_name || "Sistem"}</span>
                  <span className="text-muted-foreground"> — {log.action}</span>
                  {log.entity_name && <span className="font-medium text-accent"> {log.entity_name}</span>}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString("ro-RO")} {new Date(log.created_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">{log.entity_type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
    </div>
  );
}
