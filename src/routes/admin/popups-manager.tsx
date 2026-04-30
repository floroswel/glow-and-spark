import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/popups-manager")({
  component: PopupsPage,
});

function PopupsPage() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("popups").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const { error } = await supabase.from("popups").insert({ name: "Popup nou", trigger: "time", trigger_value: 5, type: "newsletter", is_active: false, content: { title: "Titlu", body: "Mesaj" } });
    if (error) return toast.error(error.message);
    load();
  };
  const update = async (id: string, patch: any) => { setItems(items.map(i => i.id === id ? { ...i, ...patch } : i)); await supabase.from("popups").update(patch).eq("id", id); };
  const remove = async (id: string) => { await supabase.from("popups").delete().eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">Manager Popup-uri</h1><p className="text-sm text-muted-foreground">Popup-uri avansate cu trigger configurabil</p></div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Popup nou</button>
      </div>

      <div className="space-y-3">
        {items.map(p => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="grid gap-2 md:grid-cols-4">
              <input value={p.name} onChange={e => update(p.id, { name: e.target.value })} placeholder="Nume" className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2" />
              <select value={p.trigger || "time"} onChange={e => update(p.id, { trigger: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="time">După timp (sec)</option><option value="exit_intent">Exit intent</option><option value="scroll">Scroll %</option><option value="manual">Manual</option>
              </select>
              <input type="number" value={p.trigger_value || 0} onChange={e => update(p.id, { trigger_value: parseInt(e.target.value) || 0 })} placeholder="Valoare" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <select value={p.type || "newsletter"} onChange={e => update(p.id, { type: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm w-full md:w-auto">
              <option value="newsletter">Newsletter</option><option value="discount">Discount</option><option value="announcement">Anunț</option><option value="custom">Custom</option>
            </select>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.is_active} onChange={e => update(p.id, { is_active: e.target.checked })} />Activ</label>
                <span className="text-xs text-muted-foreground">Afișări: {p.views || 0} • Conversii: {p.conversions || 0}</span>
              </div>
              <button onClick={() => remove(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Niciun popup</div>}
      </div>
    </div>
  );
}
