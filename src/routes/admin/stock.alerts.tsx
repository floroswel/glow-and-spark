import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/alerts")({
  component: StockAlerts,
});

function StockAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [aRes, pRes] = await Promise.all([
      supabase.from("stock_alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name"),
    ]);
    setAlerts(aRes.data || []);
    setProducts(pRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const productName = (id: string | null) => products.find(p => p.id === id)?.name || "Toate produsele";

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("stock_alerts").insert({
      product_id: (fd.get("product_id") as string) || null,
      min_threshold: parseInt(fd.get("min_threshold") as string) || 5,
      notify_email: fd.get("notify_email") as string,
      is_active: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Alertă adăugată");
    setShowForm(false); load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("stock_alerts").delete().eq("id", id);
    toast.success("Alertă ștearsă"); setDeleting(null); load();
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Alerte Stoc</h1>
          <p className="text-sm text-muted-foreground">{alerts.length} alerte configurate</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent transition">
          <Plus className="h-4 w-4" /> Alertă Nouă
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form onSubmit={handleAdd} onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">Alertă Nouă</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Produs (opțional)</label>
              <select name="product_id" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
                <option value="">Toate produsele</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prag minim stoc</label>
              <input name="min_threshold" type="number" defaultValue="5" min="0" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email notificare</label>
              <input name="notify_email" type="email" placeholder="admin@mamalucica.ro" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background">Salvează</button>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl border border-border bg-card p-6 max-w-sm space-y-4">
            <h3 className="font-heading font-bold">Confirmă ștergerea</h3>
            <p className="text-sm text-muted-foreground">Sigur vrei să ștergi această alertă?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
              <button onClick={() => handleDelete(deleting)} className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground">Șterge</button>
            </div>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Bell className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Nicio alertă configurată</p>
          <p className="text-xs mt-1">Configurează alerte pentru a fi notificat când stocul scade</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {alerts.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <h3 className="font-medium text-foreground text-sm">{productName(a.product_id)}</h3>
                <p className="text-xs text-muted-foreground">Prag: {a.min_threshold} unități • Email: {a.notify_email || "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.is_active ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"}`}>
                  {a.is_active ? "Activ" : "Inactiv"}
                </span>
                <button onClick={() => setDeleting(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
