import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/affiliates")({
  component: AffiliatesPage,
});

function AffiliatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<{ clicks: number; conversions: number; pending: number }>({ clicks: 0, conversions: 0, pending: 0 });

  const load = async () => {
    const [{ data }, { count: c1 }, { count: c2 }, { count: c3 }] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_clicks").select("*", { count: "exact", head: true }),
      supabase.from("affiliate_conversions").select("*", { count: "exact", head: true }),
      supabase.from("affiliate_payout_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    setItems(data ?? []);
    setStats({ clicks: c1 ?? 0, conversions: c2 ?? 0, pending: c3 ?? 0 });
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    const code = "AFF" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("affiliates").insert({ code, name: "Afiliat nou", email: "", status: "pending" });
    if (error) return toast.error(error.message);
    toast.success("Afiliat adăugat");
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("affiliates").update({ status }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Sigur ștergi acest afiliat?")) return;
    await supabase.from("affiliates").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-accent" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Afiliați</h1>
            <p className="text-sm text-muted-foreground">Gestionează rețeaua de afiliați și comisioane</p>
          </div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Afiliat nou</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Click-uri</div><div className="text-2xl font-bold">{stats.clicks}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Conversii</div><div className="text-2xl font-bold">{stats.conversions}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Plăți în așteptare</div><div className="text-2xl font-bold">{stats.pending}</div></div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Cod</th><th className="text-left p-3">Nume</th><th className="text-left p-3">Email</th><th className="text-left p-3">Comision</th><th className="text-left p-3">Câștigat</th><th className="text-left p-3">Plătit</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(a => (
              <tr key={a.id}>
                <td className="p-3 font-mono text-xs">{a.code}</td>
                <td className="p-3">{a.name}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3">{a.commission_percent}%</td>
                <td className="p-3">{Number(a.total_earned).toFixed(2)} RON</td>
                <td className="p-3">{Number(a.total_paid).toFixed(2)} RON</td>
                <td className="p-3">
                  <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs">
                    <option value="pending">Pending</option>
                    <option value="active">Activ</option>
                    <option value="suspended">Suspendat</option>
                  </select>
                </td>
                <td className="p-3"><button onClick={() => remove(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Niciun afiliat înregistrat</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
