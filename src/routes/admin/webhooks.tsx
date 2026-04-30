import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Webhook, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/webhooks")({
  component: Page,
});

const ALL_EVENTS = ["order.created", "order.paid", "order.shipped", "order.cancelled", "product.created", "product.updated", "user.signup", "subscription.renewed"];

function Page() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => { const { data } = await supabase.from("external_webhooks").select("*").order("created_at", { ascending: false }); setItems(data ?? []); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const { error } = await supabase.from("external_webhooks").insert({ name: "Webhook nou", url: "https://", events: [], is_active: true });
    if (error) return toast.error(error.message);
    load();
  };
  const update = async (id: string, patch: any) => { setItems(items.map(i => i.id === id ? { ...i, ...patch } : i)); await supabase.from("external_webhooks").update(patch).eq("id", id); };
  const remove = async (id: string) => { await supabase.from("external_webhooks").delete().eq("id", id); load(); };
  const toggleEvent = (w: any, ev: string) => {
    const events = w.events?.includes(ev) ? w.events.filter((e: string) => e !== ev) : [...(w.events || []), ev];
    update(w.id, { events });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Webhook className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">Webhook-uri externe</h1><p className="text-sm text-muted-foreground">Notifică sisteme externe la evenimente</p></div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Webhook nou</button>
      </div>

      <div className="space-y-3">
        {items.map(w => (
          <div key={w.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <input value={w.name} onChange={e => update(w.id, { name: e.target.value })} placeholder="Nume" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input value={w.url} onChange={e => update(w.id, { url: e.target.value })} placeholder="URL" className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
              <input value={w.secret || ""} onChange={e => update(w.id, { secret: e.target.value })} placeholder="Secret HMAC" className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono md:col-span-2" />
            </div>
            <div className="flex flex-wrap gap-1">
              {ALL_EVENTS.map(ev => (
                <button key={ev} onClick={() => toggleEvent(w, ev)} className={`rounded-full px-2.5 py-1 text-xs ${w.events?.includes(ev) ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>{ev}</button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!w.is_active} onChange={e => update(w.id, { is_active: e.target.checked })} />Activ</label>
                <span className="text-xs text-muted-foreground">Eșecuri: {w.failure_count} {w.last_triggered_at && `• Ultimul: ${new Date(w.last_triggered_at).toLocaleString("ro-RO")}`}</span>
              </div>
              <button onClick={() => remove(w.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Niciun webhook</div>}
      </div>
    </div>
  );
}
