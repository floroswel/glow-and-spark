import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Pencil, X, Search, Copy } from "lucide-react";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    coupons.filter(c => !search || c.code.toLowerCase().includes(search.toLowerCase())),
    [coupons, search]
  );

  const resetForm = () => {
    setForm({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order: form.min_order ? Number(form.min_order) : 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    };
    if (editingId) {
      await supabase.from("coupons").update(payload).eq("id", editingId);
      showToast("✅ Cupon actualizat!");
    } else {
      await supabase.from("coupons").insert(payload);
      showToast("✅ Cupon creat!");
    }
    resetForm();
    load();
  };

  const handleEdit = (c: any) => {
    setForm({
      code: c.code,
      type: c.type || "percent",
      value: String(c.value),
      min_order: c.min_order ? String(c.min_order) : "",
      max_uses: c.max_uses ? String(c.max_uses) : "",
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ active: !current }).eq("id", id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur dorești să ștergi acest cupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    showToast("Cupon șters.");
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Cod copiat: ${code}`);
  };

  // Stats
  const activeCount = coupons.filter(c => c.active).length;
  const expiredCount = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length;
  const totalUses = coupons.reduce((s, c) => s + (c.uses || 0), 0);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Cupoane ({coupons.length})</h1>
          <p className="text-sm text-muted-foreground">{activeCount} active · {expiredCount} expirate · {totalUses} utilizări totale</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
          <Plus className="h-4 w-4" /> Cupon nou
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-xl font-bold text-chart-2">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Expirate</p>
          <p className="text-xl font-bold text-destructive">{expiredCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Utilizări totale</p>
          <p className="text-xl font-bold text-foreground">{totalUses}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">{editingId ? "Editează Cupon" : "Cupon Nou"}</h2>
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
            <button type="submit" className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
              {editingId ? "Actualizează" : "Salvează"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground hover:bg-secondary transition">Anulează</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Caută cod cupon..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none" />
      </div>

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
              <th className="w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => {
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
              return (
                <tr key={c.id} className={`hover:bg-secondary/30 transition ${isExpired ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{c.type === "percent" ? "%" : "Lei"}</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">{c.type === "percent" ? `${c.value}%` : `${Number(c.value).toFixed(2)} lei`}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{Number(c.min_order || 0).toFixed(0)} lei</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{c.uses || 0}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                  <td className="px-4 py-3 text-center">
                    {c.expires_at ? (
                      <span className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                        {new Date(c.expires_at).toLocaleDateString("ro-RO")}
                        {isExpired && " (expirat)"}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(c.id, c.active)} className="transition">
                      {c.active ? <ToggleRight className="h-6 w-6 text-accent" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="text-center py-12">
            <Tag className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun cupon {search ? "găsit" : "creat"}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
