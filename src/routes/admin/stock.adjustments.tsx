import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/stock/adjustments")({
  component: AdjustmentsPage,
});

const reasonLabels: Record<string, string> = { inventory: "Inventar", damaged: "Deteriorat", promotion: "Promoție", error: "Eroare", other: "Altele" };
const statusCls: Record<string, string> = { pending: "bg-amber-500/10 text-amber-600", approved: "bg-chart-2/10 text-chart-2", rejected: "bg-destructive/10 text-destructive" };

function AdjustmentsPage() {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ product_id: "", adjustment_type: "increase", quantity: 1, reason: "inventory", notes: "" });

  const load = async () => {
    const [aRes, pRes] = await Promise.all([
      supabase.from("stock_adjustments").select("*, products(name)").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, stock").order("name"),
    ]);
    setAdjustments(aRes.data || []);
    setProducts(pRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.product_id || form.quantity <= 0) return toast.error("Selectează produs și cantitate");
    const product = products.find(p => p.id === form.product_id);
    const oldStock = product?.stock ?? 0;
    const delta = form.adjustment_type === "increase" ? form.quantity : -form.quantity;
    const newStock = Math.max(0, oldStock + delta);

    await supabase.from("stock_adjustments").insert({ ...form, created_by: user?.id, status: "approved" });
    await supabase.from("products").update({ stock: newStock }).eq("id", form.product_id);
    await supabase.from("stock_movements").insert({
      product_id: form.product_id,
      movement_type: "adjustment",
      quantity: delta,
      previous_stock: oldStock,
      new_stock: newStock,
      reason: `${reasonLabels[form.reason]}: ${form.notes || "—"}`,
      reference_type: "adjustment",
      performed_by: user?.id,
    });
    toast.success("Ajustare aplicată");
    setShowDialog(false);
    setForm({ product_id: "", adjustment_type: "increase", quantity: 1, reason: "inventory", notes: "" });
    load();
  };

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm bg-background";

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">✏️ Ajustări Stoc</h1>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Ajustare Nouă</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Data</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Produs</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">Tip</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">Cantitate</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Motiv</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(a => (
                <tr key={a.id} className="border-b border-border hover:bg-muted/20">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("ro-RO")}</td>
                  <td className="p-3 font-medium">{(a as any).products?.name || "—"}</td>
                  <td className="p-3 text-center"><span className={a.adjustment_type === "increase" ? "text-chart-2" : "text-destructive"}>{a.adjustment_type === "increase" ? "➕ Creștere" : "➖ Scădere"}</span></td>
                  <td className="p-3 text-center font-bold">{a.quantity}</td>
                  <td className="p-3 text-muted-foreground">{reasonLabels[a.reason] || a.reason} {a.notes ? `· ${a.notes}` : ""}</td>
                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls[a.status] || ""}`}>{a.status}</span></td>
                </tr>
              ))}
              {adjustments.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nicio ajustare</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajustare Stoc</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">Produs *</label>
              <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className={inputClass}>
                <option value="">Selectează...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (stoc: {p.stock ?? 0})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Tip</label>
                <select value={form.adjustment_type} onChange={e => setForm({ ...form, adjustment_type: e.target.value })} className={inputClass}>
                  <option value="increase">➕ Creștere</option>
                  <option value="decrease">➖ Scădere</option>
                </select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Cantitate</label><input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className={inputClass} /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Motiv</label>
              <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inputClass}>
                {Object.entries(reasonLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Note</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={2} /></div>
            <Button onClick={submit} className="w-full">Aplică Ajustare</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
