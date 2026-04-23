import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

const PAGE_SIZE = 20;

function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = async () => {
    let q = supabase.from("product_reviews").select("*, products(name, slug)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const filtered = useMemo(() =>
    reviews.filter(r => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (r.title || "").toLowerCase().includes(s) ||
        (r.content || "").toLowerCase().includes(s) ||
        ((r.products as any)?.name || "").toLowerCase().includes(s);
    }),
    [reviews, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter]);

  const updateStatus = async (id: string, status: string) => {
    const review = reviews.find(r => r.id === id);
    await supabase.from("product_reviews").update({ status }).eq("id", id);
    if (review?.product_id) {
      await supabase.rpc('update_reviews_count', { p_product_id: review.product_id });
    }
    showToast(`Recenzie ${status === "approved" ? "aprobată" : "respinsă"}!`);
    load();
  };

  const bulkApprove = async () => {
    const pending = reviews.filter(r => r.status === "pending");
    if (!pending.length) return;
    if (!confirm(`Aprob toate ${pending.length} recenziile în așteptare?`)) return;
    const productIds = new Set<string>();
    for (const r of pending) {
      await supabase.from("product_reviews").update({ status: "approved" }).eq("id", r.id);
      if (r.product_id) productIds.add(r.product_id);
    }
    for (const pid of productIds) {
      await supabase.rpc('update_reviews_count', { p_product_id: pid });
    }
    showToast(`${pending.length} recenzii aprobate!`);
    load();
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  // Stats
  const pendingCount = reviews.filter(r => r.status === "pending").length;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Recenzii ({reviews.length})</h1>
          <p className="text-sm text-muted-foreground">{pendingCount} în așteptare · Rating mediu: {avgRating} ⭐</p>
        </div>
        {pendingCount > 0 && (
          <button onClick={bulkApprove} className="flex items-center gap-2 rounded-lg bg-chart-2/15 px-4 py-2 text-sm font-semibold text-chart-2 hover:bg-chart-2/25 transition">
            <CheckCircle2 className="h-4 w-4" /> Aprobă toate ({pendingCount})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-bold text-foreground">{reviews.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">În așteptare</p>
          <p className="text-xl font-bold text-accent">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Rating mediu</p>
          <p className="text-xl font-bold text-foreground">{avgRating} ⭐</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">5 stele</p>
          <p className="text-xl font-bold text-chart-2">{reviews.filter(r => r.rating === 5).length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută în recenzii..."
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2 text-sm focus:border-accent focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {[{ v: "all", l: "Toate" }, { v: "pending", l: "În așteptare" }, { v: "approved", l: "Aprobate" }, { v: "rejected", l: "Respinse" }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${filter === f.v ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <div className="text-center py-16">
          <Star className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Nicio recenzie {filter !== "all" ? `cu status "${filter}"` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {renderStars(r.rating)}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "approved" ? "bg-chart-2/15 text-chart-2" :
                      r.status === "rejected" ? "bg-destructive/15 text-destructive" :
                      "bg-accent/15 text-accent"
                    }`}>{r.status === "pending" ? "În așteptare" : r.status === "approved" ? "Aprobată" : "Respinsă"}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{r.title || "Fără titlu"}</p>
                  {r.content && <p className="mt-1 text-sm text-muted-foreground">{r.content}</p>}
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Produs: <span className="font-medium text-foreground">{(r.products as any)?.name || "—"}</span></span>
                    <span>{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {r.status !== "approved" && (
                    <button onClick={() => updateStatus(r.id, "approved")} className="p-2 rounded-lg hover:bg-chart-2/10 text-muted-foreground hover:text-chart-2 transition" title="Aprobă">
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => updateStatus(r.id, "rejected")} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Respinge">
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Afișând {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}
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
    </div>
  );
}
