import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, CheckCircle2, XCircle, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    let q = supabase.from("product_reviews").select("*, products(name, slug)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("product_reviews").update({ status }).eq("id", id);
    load();
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Recenzii ({reviews.length})</h1>
      </div>

      <div className="flex gap-2">
        {[{ v: "all", l: "Toate" }, { v: "pending", l: "În așteptare" }, { v: "approved", l: "Aprobate" }, { v: "rejected", l: "Respinse" }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${filter === f.v ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {!reviews.length ? (
        <div className="text-center py-16">
          <Star className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Nicio recenzie {filter !== "all" ? `cu status "${filter}"` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {renderStars(r.rating)}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "approved" ? "bg-accent/15 text-accent" :
                      r.status === "rejected" ? "bg-destructive/15 text-destructive" :
                      "bg-muted text-muted-foreground"
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
                    <button onClick={() => updateStatus(r.id, "approved")} className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition" title="Aprobă">
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
    </div>
  );
}
