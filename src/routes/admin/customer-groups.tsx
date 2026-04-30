import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/customer-groups")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => { const { data } = await supabase.from("customer_groups").select("*").order("created_at", { ascending: false }); setItems(data ?? []); };
  useEffect(() => { load(); }, []);
  const add = async () => {
    const { error } = await supabase.from("customer_groups").insert({ name: "Grup nou", color: "#888", discount_percent: 0 });
    if (error) return toast.error(error.message); load();
  };
  const update = async (id: string, patch: any) => { setItems(items.map(i => i.id === id ? { ...i, ...patch } : i)); await supabase.from("customer_groups").update(patch).eq("id", id); };
  const remove = async (id: string) => { await supabase.from("customer_groups").delete().eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users2 className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">Grupuri de clienți</h1><p className="text-sm text-muted-foreground">Segmentare cu reduceri specifice (ex: VIP, Angro, Distribuitor)</p></div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Grup nou</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(g => (
          <div key={g.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <input type="color" value={g.color || "#888"} onChange={e => update(g.id, { color: e.target.value })} className="h-9 w-12 rounded border border-border" />
              <input value={g.name} onChange={e => update(g.id, { name: e.target.value })} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <textarea value={g.description || ""} onChange={e => update(g.id, { description: e.target.value })} rows={2} placeholder="Descriere" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">Reducere %: <input type="number" step="0.5" value={g.discount_percent || 0} onChange={e => update(g.id, { discount_percent: parseFloat(e.target.value) || 0 })} className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm" /></label>
              <button onClick={() => remove(g.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="md:col-span-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Niciun grup</div>}
      </div>
    </div>
  );
}
