import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Search, ChevronLeft, ChevronRight, Trash2, Mail, Eye, X } from "lucide-react";

export const Route = createFileRoute("/admin/abandoned-carts")({
  component: AdminAbandonedCarts,
});

const PAGE_SIZE = 20;

function AdminAbandonedCarts() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = async () => {
    const { data } = await supabase
      .from("abandoned_carts")
      .select("*")
      .order("created_at", { ascending: false });
    setCarts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return carts.filter((c) => {
      if (filter === "recovered" && !c.recovered) return false;
      if (filter === "abandoned" && c.recovered) return false;
      if (search) {
        const s = search.toLowerCase();
        return (c.email || "").toLowerCase().includes(s) ||
          (c.customer_name || "").toLowerCase().includes(s) ||
          (c.session_id || "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [carts, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Șterge acest coș abandonat?")) return;
    await supabase.from("abandoned_carts").delete().eq("id", id);
    showToast("Coș șters.");
    load();
  };

  const handleMarkRecovered = async (id: string) => {
    await supabase.from("abandoned_carts").update({ recovered: true }).eq("id", id);
    showToast("Marcat ca recuperat!");
    load();
  };

  // Stats
  const totalValue = carts.reduce((s, c) => s + Number(c.total || 0), 0);
  const recoveredCount = carts.filter(c => c.recovered).length;
  const withEmail = carts.filter(c => c.email).length;
  const last24h = carts.filter(c => new Date(c.created_at) > new Date(Date.now() - 86400000)).length;

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Coșuri Abandonate ({carts.length})</h1>
        <p className="text-sm text-muted-foreground">{recoveredCount} recuperate · {withEmail} cu email · {last24h} în ultimele 24h</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Total coșuri</p>
          <p className="text-xl font-bold text-foreground">{carts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Valoare pierdută</p>
          <p className="text-xl font-bold text-destructive">{totalValue.toFixed(0)} RON</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Recuperate</p>
          <p className="text-xl font-bold text-chart-2">{recoveredCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Cu email</p>
          <p className="text-xl font-bold text-accent">{withEmail}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută după email, nume..."
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2 text-sm focus:border-accent focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {[{ v: "all", l: "Toate" }, { v: "abandoned", l: "Abandonate" }, { v: "recovered", l: "Recuperate" }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${filter === f.v ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Client</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Produse</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Valoare</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Data</th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((c) => {
              const items = Array.isArray(c.items) ? c.items : [];
              return (
                <tr key={c.id} className="hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.customer_name || c.email || "Anonim"}</p>
                    {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{items.length} produse</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{Number(c.total || 0).toFixed(2)} RON</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.recovered ? "bg-chart-2/15 text-chart-2" : "bg-destructive/15 text-destructive"}`}>
                      {c.recovered ? "Recuperat" : "Abandonat"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("ro-RO")}
                    <br />
                    {new Date(c.created_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Detalii">
                        <Eye className="h-4 w-4" />
                      </button>
                      {!c.recovered && (
                        <button onClick={() => handleMarkRecovered(c.id)} className="p-1.5 rounded-lg hover:bg-chart-2/10 text-muted-foreground hover:text-chart-2 transition" title="Marchează recuperat">
                          <Mail className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Șterge">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="text-center py-16">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun coș abandonat {filter !== "all" ? `cu status "${filter}"` : ""}.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border p-2 disabled:opacity-40 hover:bg-secondary transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 disabled:opacity-40 hover:bg-secondary transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl bg-card shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Detalii Coș Abandonat</h2>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client:</span> <span className="font-medium text-foreground">{selected.customer_name || "Anonim"}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{selected.email || "—"}</span></div>
                <div><span className="text-muted-foreground">Total:</span> <span className="font-bold text-foreground">{Number(selected.total || 0).toFixed(2)} RON</span></div>
                <div><span className="text-muted-foreground">Data:</span> <span className="text-foreground">{new Date(selected.created_at).toLocaleString("ro-RO")}</span></div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Produse în coș:</h3>
                <div className="space-y-2">
                  {(Array.isArray(selected.items) ? selected.items : []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-2">
                      {item.image && <img src={item.image} alt="" className="h-10 w-10 rounded object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name || "Produs"}</p>
                        <p className="text-xs text-muted-foreground">Cantitate: {item.quantity || 1}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{Number(item.price || 0).toFixed(2)} RON</p>
                    </div>
                  ))}
                  {!(Array.isArray(selected.items) && selected.items.length > 0) && (
                    <p className="text-sm text-muted-foreground">Nu sunt produse salvate.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
