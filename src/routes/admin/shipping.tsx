import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Plus, X, ToggleLeft, ToggleRight, Settings, Trash2, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/shipping")({
  component: AdminShipping,
});

interface Carrier {
  id: string; name: string; code: string; logo: string; enabled: boolean;
  free_above: number; base_rate: number; per_kg: number; estimated_days: string;
}

interface ShippingZone {
  id: string; name: string; counties: string[]; surcharge: number;
}

const defaultCarriers: Carrier[] = [
  { id: "1", name: "Fan Courier", code: "fan", logo: "📦", enabled: true, free_above: 200, base_rate: 18, per_kg: 1.5, estimated_days: "1-2 zile" },
  { id: "2", name: "Sameday", code: "sameday", logo: "🚀", enabled: true, free_above: 200, base_rate: 15, per_kg: 1, estimated_days: "1 zi" },
  { id: "3", name: "GLS", code: "gls", logo: "📮", enabled: false, free_above: 250, base_rate: 20, per_kg: 2, estimated_days: "2-3 zile" },
  { id: "4", name: "Cargus", code: "cargus", logo: "📫", enabled: false, free_above: 200, base_rate: 17, per_kg: 1.5, estimated_days: "1-2 zile" },
  { id: "5", name: "Ridicare personală", code: "pickup", logo: "🏪", enabled: true, free_above: 0, base_rate: 0, per_kg: 0, estimated_days: "Disponibil imediat" },
];

function AdminShipping() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Carrier | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "shipping_carriers").maybeSingle().then(({ data }) => {
      setCarriers(data?.value && Array.isArray(data.value) ? data.value as unknown as Carrier[] : defaultCarriers);
      setLoading(false);
    });
  }, []);

  async function saveAll(updated: Carrier[]) {
    setCarriers(updated);
    await supabase.from("site_settings").upsert({ key: "shipping_carriers", value: updated as any }, { onConflict: "key" });
    setToast("Salvat!"); setTimeout(() => setToast(""), 3000);
  }

  function toggle(code: string) {
    saveAll(carriers.map(c => c.code === code ? { ...c, enabled: !c.enabled } : c));
  }

  function saveEdit() {
    if (!editing) return;
    saveAll(carriers.map(c => c.id === editing.id ? editing : c));
    setEditing(null);
  }

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">{toast}</div>}

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Curieri & Tarife Livrare</h1>
        <p className="text-sm text-muted-foreground">Configurează curierii și tarifele de livrare</p>
      </div>

      <div className="grid gap-4">
        {carriers.map(carrier => (
          <div key={carrier.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-3xl">{carrier.logo}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{carrier.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${carrier.enabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {carrier.enabled ? "ACTIV" : "INACTIV"}
                </span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>Tarif: {carrier.base_rate} RON + {carrier.per_kg} RON/kg</span>
                <span>Gratuit peste: {carrier.free_above > 0 ? `${carrier.free_above} RON` : "N/A"}</span>
                <span>Estimare: {carrier.estimated_days}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing({ ...carrier })} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary transition">
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => toggle(carrier.code)} className="text-muted-foreground hover:text-foreground transition">
                {carrier.enabled ? <ToggleRight className="h-6 w-6 text-accent" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">Editare: {editing.name}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Tarif bază (RON)</label>
                  <input type="number" value={editing.base_rate} onChange={e => setEditing({ ...editing, base_rate: +e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Per kg (RON)</label>
                  <input type="number" step="0.5" value={editing.per_kg} onChange={e => setEditing({ ...editing, per_kg: +e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Gratuit peste (RON)</label>
                <input type="number" value={editing.free_above} onChange={e => setEditing({ ...editing, free_above: +e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Estimare livrare</label>
                <input value={editing.estimated_days} onChange={e => setEditing({ ...editing, estimated_days: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
              <button onClick={saveEdit} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Salvează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
