import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/stock/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ product_id: "", category_id: "", min_threshold: 5, notify_email: "" });

  const load = async () => {
    const [aRes, pRes, cRes] = await Promise.all([
      supabase.from("stock_alerts").select("*, products(name), categories(name)").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name").order("name"),
      supabase.from("categories").select("id, name").order("name"),
    ]);
    setAlerts(aRes.data || []);
    setProducts(pRes.data || []);
    setCategories(cRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.product_id && !form.category_id) return toast.error("Selectează produs sau categorie");
    await supabase.from("stock_alerts").insert({
      product_id: form.product_id || null,
      category_id: form.category_id || null,
      min_threshold: form.min_threshold,
      notify_email: form.notify_email || null,
    });
    toast.success("Alertă configurată");
    setShowDialog(false);
    setForm({ product_id: "", category_id: "", min_threshold: 5, notify_email: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("stock_alerts").delete().eq("id", id);
    toast.success("Alertă ștearsă");
    load();
  };

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm bg-background";

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">🔔 Alerte Stoc</h1>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Alertă Nouă</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Țintă</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">Prag</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">Activ</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} className="border-b border-border hover:bg-muted/20">
                  <td className="p-3 font-medium">
                    {(a as any).products?.name ? `🏷️ ${(a as any).products.name}` : (a as any).categories?.name ? `📁 ${(a as any).categories.name}` : "—"}
                  </td>
                  <td className="p-3 text-center font-bold">{a.min_threshold}</td>
                  <td className="p-3 text-muted-foreground">{a.notify_email || "—"}</td>
                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.is_active ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"}`}>{a.is_active ? "Activ" : "Inactiv"}</span></td>
                  <td className="p-3 text-center"><button onClick={() => remove(a.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button></td>
                </tr>
              ))}
              {alerts.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nicio alertă configurată</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Alertă Stoc Nouă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">Produs (opțional)</label>
              <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className={inputClass}>
                <option value="">— Selectează produs —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">SAU Categorie</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
                <option value="">— Selectează categorie —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Prag minim</label><input type="number" value={form.min_threshold} onChange={e => setForm({ ...form, min_threshold: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Email notificare</label><input value={form.notify_email} onChange={e => setForm({ ...form, notify_email: e.target.value })} className={inputClass} placeholder="admin@lumini.ro" /></div>
            <Button onClick={save} className="w-full">Salvează Alertă</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
