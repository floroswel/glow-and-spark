import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Warehouse, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/stock/warehouses")({
  component: WarehousesPage,
});

const emptyWh = { name: "", address: "", city: "", county: "", responsible_name: "", responsible_phone: "", capacity: 0, warehouse_type: "principal", notes: "" };
const typeLabels: Record<string, string> = { principal: "Principal", showroom: "Showroom", dropshipping: "Dropshipping", seasonal: "Sezon" };

function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("warehouses").select("*").order("created_at");
    setWarehouses(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.name) return toast.error("Numele e obligatoriu");
    if (editing.id) {
      const { id, created_at, updated_at, ...rest } = editing;
      await supabase.from("warehouses").update(rest).eq("id", id);
      toast.success("Depozit actualizat");
    } else {
      await supabase.from("warehouses").insert(editing);
      toast.success("Depozit adăugat");
    }
    setShowDialog(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ștergi acest depozit?")) return;
    await supabase.from("warehouses").delete().eq("id", id);
    toast.success("Depozit șters");
    load();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm bg-background";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">🏭 Depozite</h1>
        </div>
        <Button onClick={() => { setEditing({ ...emptyWh }); setShowDialog(true); }} className="gap-2"><Plus className="h-4 w-4" /> Adaugă Depozit</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map(wh => (
          <Card key={wh.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-foreground">{wh.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing({ ...wh }); setShowDialog(true); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => remove(wh.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${wh.is_active ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"}`}>{typeLabels[wh.warehouse_type] || wh.warehouse_type}</span></p>
                {wh.address && <p>📍 {wh.address}, {wh.city}</p>}
                {wh.responsible_name && <p>👤 {wh.responsible_name} {wh.responsible_phone ? `· ${wh.responsible_phone}` : ""}</p>}
                {wh.capacity > 0 && <p>📦 Capacitate: {wh.capacity} unități</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {warehouses.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">Niciun depozit configurat. Adaugă primul depozit.</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Editare Depozit" : "Depozit Nou"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nume *</label><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputClass} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Tip</label>
                <select value={editing.warehouse_type} onChange={e => setEditing({ ...editing, warehouse_type: e.target.value })} className={inputClass}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Adresă</label><input value={editing.address || ""} onChange={e => setEditing({ ...editing, address: e.target.value })} className={inputClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Oraș</label><input value={editing.city || ""} onChange={e => setEditing({ ...editing, city: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Responsabil</label><input value={editing.responsible_name || ""} onChange={e => setEditing({ ...editing, responsible_name: e.target.value })} className={inputClass} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Telefon</label><input value={editing.responsible_phone || ""} onChange={e => setEditing({ ...editing, responsible_phone: e.target.value })} className={inputClass} /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Capacitate (unități)</label><input type="number" value={editing.capacity || 0} onChange={e => setEditing({ ...editing, capacity: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Note</label><textarea value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} className={inputClass} rows={2} /></div>
              <Button onClick={save} className="w-full">Salvează</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
