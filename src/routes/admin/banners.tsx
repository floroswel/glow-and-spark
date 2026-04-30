import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners")({
  component: BannersPage,
});

function BannersPage() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("site_banners").select("*").order("sort_order");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const { error } = await supabase.from("site_banners").insert({ title: "Banner nou", message: "Mesaj banner", position: "top", is_active: true, sort_order: items.length });
    if (error) return toast.error(error.message);
    load();
  };

  const update = async (id: string, patch: any) => {
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));
    await supabase.from("site_banners").update(patch).eq("id", id);
  };
  const remove = async (id: string) => { await supabase.from("site_banners").delete().eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">Banner-e site</h1><p className="text-sm text-muted-foreground">Anunțuri și promoții afișate pe site</p></div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Banner nou</button>
      </div>

      <div className="space-y-3">
        {items.map(b => (
          <div key={b.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="grid gap-2 md:grid-cols-3">
              <input value={b.title || ""} onChange={e => update(b.id, { title: e.target.value })} placeholder="Titlu" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input value={b.link_url || ""} onChange={e => update(b.id, { link_url: e.target.value })} placeholder="Link" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <select value={b.position || "top"} onChange={e => update(b.id, { position: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="top">Top</option><option value="hero">Hero</option><option value="middle">Mijloc</option><option value="footer">Footer</option>
              </select>
            </div>
            <textarea value={b.message || ""} onChange={e => update(b.id, { message: e.target.value })} rows={2} placeholder="Mesaj" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.is_active} onChange={e => update(b.id, { is_active: e.target.checked })} />Activ</label>
              <button onClick={() => remove(b.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Niciun banner</div>}
      </div>
    </div>
  );
}
