import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Pencil, Trash2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/stock/suppliers")({
  component: SuppliersPage,
});

const emptySupplier = { name: "", cui: "", address: "", city: "", county: "", contact_name: "", contact_email: "", contact_phone: "", payment_terms: 30, discount_percent: 0, product_categories: "", rating: 3, notes: "" };

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.name) return toast.error("Numele e obligatoriu");
    if (editing.id) {
      const { id, created_at, updated_at, ...rest } = editing;
      await supabase.from("suppliers").update(rest).eq("id", id);
      toast.success("Furnizor actualizat");
    } else {
      await supabase.from("suppliers").insert(editing);
      toast.success("Furnizor adăugat");
    }
    setShowDialog(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ștergi acest furnizor?")) return;
    await supabase.from("suppliers").delete().eq("id", id);
    toast.success("Furnizor șters");
    load();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm bg-background";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">🏭 Furnizori</h1>
        </div>
        <Button onClick={() => { setEditing({ ...emptySupplier }); setShowDialog(true); }} className="gap-2"><Plus className="h-4 w-4" /> Adaugă Furnizor</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <Card key={s.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{s.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing({ ...s }); setShowDialog(true); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => remove(s.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {s.cui && <p>CUI: {s.cui}</p>}
                {s.contact_name && <p>👤 {s.contact_name}</p>}
                {s.contact_phone && <p>📞 {s.contact_phone}</p>}
                {s.contact_email && <p>📧 {s.contact_email}</p>}
                <p>💳 Termen: {s.payment_terms} zile {s.discount_percent > 0 ? `· -${s.discount_percent}%` : ""}</p>
                <div className="flex gap-0.5 pt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i <= (s.rating || 0) ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {suppliers.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">Niciun furnizor. Adaugă primul furnizor.</p>}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editare Furnizor" : "Furnizor Nou"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nume *</label><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">CUI</label><input value={editing.cui || ""} onChange={e => setEditing({ ...editing, cui: e.target.value })} className={inputClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Reg. Com.</label><input value={editing.reg_com || ""} onChange={e => setEditing({ ...editing, reg_com: e.target.value })} className={inputClass} /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Adresă</label><input value={editing.address || ""} onChange={e => setEditing({ ...editing, address: e.target.value })} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Oraș</label><input value={editing.city || ""} onChange={e => setEditing({ ...editing, city: e.target.value })} className={inputClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Județ</label><input value={editing.county || ""} onChange={e => setEditing({ ...editing, county: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="border-t border-border pt-3"><label className="text-xs font-medium text-muted-foreground">Persoană Contact</label><input value={editing.contact_name || ""} onChange={e => setEditing({ ...editing, contact_name: e.target.value })} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Email</label><input value={editing.contact_email || ""} onChange={e => setEditing({ ...editing, contact_email: e.target.value })} className={inputClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Telefon</label><input value={editing.contact_phone || ""} onChange={e => setEditing({ ...editing, contact_phone: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
                <div><label className="text-xs font-medium text-muted-foreground">Termen plată (zile)</label><input type="number" value={editing.payment_terms || 30} onChange={e => setEditing({ ...editing, payment_terms: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Discount %</label><input type="number" value={editing.discount_percent || 0} onChange={e => setEditing({ ...editing, discount_percent: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Rating</label>
                  <select value={editing.rating || 3} onChange={e => setEditing({ ...editing, rating: Number(e.target.value) })} className={inputClass}>
                    {[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i} ⭐</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Categorii produse</label><input value={editing.product_categories || ""} onChange={e => setEditing({ ...editing, product_categories: e.target.value })} className={inputClass} placeholder="Ceară, parfumuri, fitiluri..." /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Note</label><textarea value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} className={inputClass} rows={2} /></div>
              <Button onClick={save} className="w-full">Salvează</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
