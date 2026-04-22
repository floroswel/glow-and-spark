import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/stock/batches")({
  component: BatchesPage,
});

function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ product_id: "", batch_number: "", quantity: 0, production_date: "", expiry_date: "", cost_price: 0, notes: "" });

  const load = async () => {
    const [bRes, pRes] = await Promise.all([
      supabase.from("product_batches").select("*, products(name)").order("expiry_date", { ascending: true }),
      supabase.from("products").select("id, name").order("name"),
    ]);
    setBatches(bRes.data || []);
    setProducts(pRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const expiryStats = useMemo(() => {
    const now = new Date();
    const d7 = new Date(now.getTime() + 7 * 86400000);
    const d30 = new Date(now.getTime() + 30 * 86400000);
    const d90 = new Date(now.getTime() + 90 * 86400000);
    return {
      expired: batches.filter(b => b.expiry_date && new Date(b.expiry_date) < now).length,
      in7: batches.filter(b => b.expiry_date && new Date(b.expiry_date) >= now && new Date(b.expiry_date) <= d7).length,
      in30: batches.filter(b => b.expiry_date && new Date(b.expiry_date) > d7 && new Date(b.expiry_date) <= d30).length,
      in90: batches.filter(b => b.expiry_date && new Date(b.expiry_date) > d30 && new Date(b.expiry_date) <= d90).length,
    };
  }, [batches]);

  const save = async () => {
    if (!form.product_id || !form.batch_number) return toast.error("Completează câmpurile obligatorii");
    await supabase.from("product_batches").insert(form);
    toast.success("Lot adăugat");
    setShowDialog(false);
    setForm({ product_id: "", batch_number: "", quantity: 0, production_date: "", expiry_date: "", cost_price: 0, notes: "" });
    load();
  };

  const getDaysUntilExpiry = (date: string) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  };

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm bg-background";

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">📦 Loturi & Expirare</h1>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Lot Nou</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{expiryStats.expired}</p><p className="text-xs text-muted-foreground">Expirate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-500">{expiryStats.in7}</p><p className="text-xs text-muted-foreground">Expiră în 7 zile</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-accent">{expiryStats.in30}</p><p className="text-xs text-muted-foreground">Expiră în 30 zile</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-chart-2">{expiryStats.in90}</p><p className="text-xs text-muted-foreground">Expiră în 90 zile</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Produs</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nr. Lot</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">Cantitate</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Producție</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Expirare</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const days = getDaysUntilExpiry(b.expiry_date);
                return (
                  <tr key={b.id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-3 font-medium">{(b as any).products?.name || "—"}</td>
                    <td className="p-3 font-mono text-xs">{b.batch_number}</td>
                    <td className="p-3 text-center">{b.quantity}</td>
                    <td className="p-3 text-muted-foreground">{b.production_date ? new Date(b.production_date).toLocaleDateString("ro-RO") : "—"}</td>
                    <td className="p-3">{b.expiry_date ? new Date(b.expiry_date).toLocaleDateString("ro-RO") : "—"}</td>
                    <td className="p-3">
                      {days !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          days < 0 ? "bg-destructive/10 text-destructive" :
                          days <= 7 ? "bg-amber-500/10 text-amber-600" :
                          days <= 30 ? "bg-accent/10 text-accent" :
                          "bg-chart-2/10 text-chart-2"
                        }`}>
                          {days < 0 ? `Expirat (${Math.abs(days)}z)` : `${days} zile rămase`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {batches.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Niciun lot înregistrat</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Lot Nou</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">Produs *</label>
              <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className={inputClass}>
                <option value="">Selectează...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nr. Lot *</label><input value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} className={inputClass} placeholder="LOT-2026-001" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Cantitate</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Data producție</label><input type="date" value={form.production_date} onChange={e => setForm({ ...form, production_date: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Data expirare</label><input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className={inputClass} /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Cost achiziție</label><input type="number" step="0.01" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} className={inputClass} /></div>
            <Button onClick={save} className="w-full">Salvează Lot</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
