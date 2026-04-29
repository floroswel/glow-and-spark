import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Repeat, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/account/subscriptions")({
  head: () => ({ meta: [{ title: "Abonamentele Mele" }, { name: "robots", content: "noindex" }] }),
  component: MySubscriptions,
});

function MySubscriptions() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: subs } = await supabase.from("product_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (!subs?.length) { setRows([]); setLoading(false); return; }
    const ids = [...new Set(subs.map(s => s.product_id))];
    const { data: products } = await supabase.from("products").select("id,name,price,image_url,slug").in("id", ids);
    setRows(subs.map(s => ({ ...s, product: products?.find(p => p.id === s.product_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const update = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "cancelled") patch.cancelled_at = new Date().toISOString();
    const { error } = await supabase.from("product_subscriptions").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Actualizat");
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Repeat className="h-6 w-6" />Abonamentele Mele</h1>
      <p className="text-sm text-muted-foreground">Livrări recurente automate cu reducere fidelitate.</p>

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">Nu ai niciun abonament activ.</p>
          <Link to="/catalog" className="mt-4 inline-block rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-accent-foreground">Răsfoiește produse</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="rounded-lg border bg-card p-4 flex items-center gap-4">
              {r.product?.image_url && <img src={r.product.image_url} alt="" className="h-16 w-16 rounded object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.product?.name || "Produs"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Cantitate: {r.quantity} • la {r.frequency_days} zile • -{r.discount_percent}% reducere
                </div>
                <div className="text-xs text-muted-foreground">
                  Următoarea livrare: <strong>{new Date(r.next_delivery_date).toLocaleDateString("ro-RO")}</strong>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.status === "active" ? "bg-emerald-100 text-emerald-700" :
                  r.status === "paused" ? "bg-amber-100 text-amber-700" :
                  "bg-rose-100 text-rose-700"
                }`}>{r.status}</span>
                <div className="flex gap-1">
                  {r.status === "active" && <button onClick={() => update(r.id, "paused")} className="rounded p-1.5 hover:bg-muted" title="Pauză"><Pause className="h-4 w-4" /></button>}
                  {r.status === "paused" && <button onClick={() => update(r.id, "active")} className="rounded p-1.5 hover:bg-muted" title="Reia"><Play className="h-4 w-4" /></button>}
                  {r.status !== "cancelled" && <button onClick={() => update(r.id, "cancelled")} className="rounded p-1.5 hover:bg-muted text-rose-600" title="Anulează"><X className="h-4 w-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
