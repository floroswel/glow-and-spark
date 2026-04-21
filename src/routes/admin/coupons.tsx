import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });

  const load = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("coupons").insert({
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order: form.min_order ? Number(form.min_order) : 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    });
    setForm({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });
    setShowForm(false);
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ active: !current }).eq("id", id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur dorești să ștergi acest cupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Cupoane ({coupons.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
          <Plus className="h-4 w-4" /> Cupon nou
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <input placeholder="Cod cupon *" required value={form.code} onChange={(e) => setForm({...form, code: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm uppercase focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="percent">Procent (%)</option>
              <option value="fixed">Sumă fixă (lei)</option>
            </select>
            <input placeholder="Valoare *" required type="number" step="0.01" value={form.value} onChange={(e) => setForm({...form, value: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Comandă minimă" type="number" step="0.01" value={form.min_order} onChange={(e) => setForm({...form, min_order: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Nr. maxim utilizări" type="number" value={form.max_uses} onChange={(e) => setForm({...form, max_uses: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input type="date" placeholder="Expiră la" value={form.expires_at} onChange={(e) => setForm({...form, expires_at: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">Salvează</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground hover:bg-secondary transition">Anulează</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cod</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Tip</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Valoare</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Min. Comandă</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Utilizări</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Expiră</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-secondary/30 transition">
                <td className="px-4 py-3 font-mono font-bold text-foreground">{c.code}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{c.type === "percent" ? "%" : "Lei"}</td>
                <td className="px-4 py-3 text-center font-semibold text-foreground">{c.type === "percent" ? `${c.value}%` : `${Number(c.value).toFixed(2)} lei`}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{Number(c.min_order || 0).toFixed(0)} lei</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{c.uses || 0}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("ro-RO") : "—"}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(c.id, c.active)} className="transition">
                    {c.active ? <ToggleRight className="h-6 w-6 text-accent" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!coupons.length && (
          <div className="text-center py-12">
            <Tag className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun cupon creat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
