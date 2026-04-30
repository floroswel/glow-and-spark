import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/brands")({
  component: Page,
});

function slugify(s: string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function Page() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => { const { data } = await supabase.from("brands").select("*").order("sort_order"); setItems(data ?? []); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const name = "Brand nou";
    const { error } = await supabase.from("brands").insert({ name, slug: slugify(name) + "-" + Date.now(), sort_order: items.length, is_active: true });
    if (error) return toast.error(error.message);
    load();
  };
  const update = async (id: string, patch: any) => { setItems(items.map(i => i.id === id ? { ...i, ...patch } : i)); await supabase.from("brands").update(patch).eq("id", id); };
  const remove = async (id: string) => { await supabase.from("brands").delete().eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">Branduri</h1><p className="text-sm text-muted-foreground">Producători și mărci</p></div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Brand nou</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(b => (
          <div key={b.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <input value={b.name} onChange={e => update(b.id, { name: e.target.value })} placeholder="Nume" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input value={b.slug} onChange={e => update(b.id, { slug: e.target.value })} placeholder="Slug" className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
              <input value={b.logo_url || ""} onChange={e => update(b.id, { logo_url: e.target.value })} placeholder="URL logo" className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2" />
              <input value={b.website || ""} onChange={e => update(b.id, { website: e.target.value })} placeholder="Website" className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.is_active} onChange={e => update(b.id, { is_active: e.target.checked })} />Activ</label>
              <button onClick={() => remove(b.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="md:col-span-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Niciun brand</div>}
      </div>
    </div>
  );
}
