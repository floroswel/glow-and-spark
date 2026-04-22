import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Warehouse, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/warehouses")({
  component: StockWarehouses,
});

function StockWarehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("warehouses").select("*").order("name");
    setWarehouses(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      city: fd.get("city") as string,
      county: fd.get("county") as string,
      address: fd.get("address") as string,
      warehouse_type: fd.get("warehouse_type") as string,
      responsible_name: fd.get("responsible_name") as string,
      responsible_phone: fd.get("responsible_phone") as string,
      is_active: true,
    };
    if (!payload.name) { toast.error("Numele e obligatoriu"); return; }

    if (editing?.id) {
      const { error } = await supabase.from("warehouses").update(payload).eq("id", editing.id);
      if (error) { toast.error("Eroare: " + error.message); return; }
      toast.success("Depozit actualizat");
    } else {
      const { error } = await supabase.from("warehouses").insert(payload);
      if (error) { toast.error("Eroare: " + error.message); return; }
      toast.success("Depozit adăugat");
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("warehouses").delete().eq("id", id);
    if (error) { toast.error("Eroare: " + error.message); return; }
    toast.success("Depozit șters");
    setDeleting(null);
    load();
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Depozite</h1>
          <p className="text-sm text-muted-foreground">{warehouses.length} depozite configurate</p>
        </div>
        <button onClick={() => { setEditing({}); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent transition">
          <Plus className="h-4 w-4" /> Depozit Nou
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSave} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">{editing?.id ? "Editează" : "Depozit Nou"}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
            </div>
            {[
              { name: "name", label: "Nume *", def: editing?.name },
              { name: "city", label: "Oraș", def: editing?.city },
              { name: "county", label: "Județ", def: editing?.county },
              { name: "address", label: "Adresă", def: editing?.address },
              { name: "responsible_name", label: "Responsabil", def: editing?.responsible_name },
              { name: "responsible_phone", label: "Telefon", def: editing?.responsible_phone },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input name={f.name} defaultValue={f.def || ""} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
              </div>
            ))}
            <select name="warehouse_type" defaultValue={editing?.warehouse_type || "principal"} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
              <option value="principal">Principal</option>
              <option value="secundar">Secundar</option>
              <option value="dropship">Dropship</option>
            </select>
            <button type="submit" className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background hover:bg-accent transition">Salvează</button>
          </form>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl border border-border bg-card p-6 max-w-sm space-y-4">
            <h3 className="font-heading font-bold text-foreground">Confirmă ștergerea</h3>
            <p className="text-sm text-muted-foreground">Sigur vrei să ștergi acest depozit?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
              <button onClick={() => handleDelete(deleting)} className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground">Șterge</button>
            </div>
          </div>
        </div>
      )}

      {warehouses.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Warehouse className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Niciun depozit configurat</p>
          <p className="text-xs mt-1">Adaugă primul depozit pentru a gestiona stocurile</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map(w => (
            <div key={w.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{w.name}</h3>
                  <p className="text-xs text-muted-foreground">{[w.city, w.county].filter(Boolean).join(", ") || "—"}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.is_active ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"}`}>
                  {w.is_active ? "Activ" : "Inactiv"}
                </span>
              </div>
              {w.responsible_name && <p className="text-xs text-muted-foreground">Responsabil: {w.responsible_name}</p>}
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => { setEditing(w); setShowForm(true); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" /> Editează
                </button>
                <button onClick={() => setDeleting(w.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" /> Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
