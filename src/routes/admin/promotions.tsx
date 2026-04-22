import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Percent, Plus, Calendar, Target, TrendingUp, Pause, Play, Trash2, Copy, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/promotions")({
  component: AdminPromotions,
});

interface Promotion {
  id: string;
  name: string;
  type: "percentage" | "fixed" | "bogo" | "bundle" | "flash_sale" | "free_shipping";
  value: number;
  min_order: number;
  max_discount: number;
  target: "all" | "category" | "product" | "new_customers" | "vip";
  target_ids: string[];
  starts_at: string;
  ends_at: string;
  status: "active" | "scheduled" | "ended" | "paused";
  uses: number;
  max_uses: number;
  auto_apply: boolean;
  stackable: boolean;
  description: string;
}

const typeLabels: Record<string, { label: string; icon: string }> = {
  percentage: { label: "Reducere %", icon: "🏷️" },
  fixed: { label: "Sumă fixă", icon: "💰" },
  bogo: { label: "Buy One Get One", icon: "🎁" },
  bundle: { label: "Bundle Deal", icon: "📦" },
  flash_sale: { label: "Flash Sale", icon: "⚡" },
  free_shipping: { label: "Livrare Gratuită", icon: "🚚" },
};

function AdminPromotions() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    name: "", type: "percentage" as Promotion["type"], value: 10, min_order: 0, max_discount: 0,
    target: "all" as Promotion["target"], starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    max_uses: 0, auto_apply: false, stackable: false, description: "",
  });

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "promotions").maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value)) setPromos(data.value as unknown as Promotion[]);
      setLoading(false);
    });
  }, []);

  const save = async (updated: Promotion[]) => {
    setPromos(updated);
    await supabase.from("site_settings").upsert({ key: "promotions", value: updated as any }, { onConflict: "key" });
  };

  const create = () => {
    if (!form.name) return;
    const promo: Promotion = {
      id: crypto.randomUUID(),
      ...form,
      target_ids: [],
      status: new Date(form.starts_at) > new Date() ? "scheduled" : "active",
      uses: 0,
    };
    save([promo, ...promos]);
    setShowCreate(false);
    setToast("Promoție creată!"); setTimeout(() => setToast(""), 3000);
  };

  const togglePause = (id: string) => {
    save(promos.map(p => p.id === id ? { ...p, status: p.status === "paused" ? "active" as const : "paused" as const } : p));
  };

  const deletePromo = (id: string) => save(promos.filter(p => p.id !== id));

  const filtered = useMemo(() => {
    if (filter === "all") return promos;
    return promos.filter(p => p.status === filter);
  }, [promos, filter]);

  const stats = useMemo(() => ({
    active: promos.filter(p => p.status === "active").length,
    scheduled: promos.filter(p => p.status === "scheduled").length,
    totalUses: promos.reduce((a, p) => a + p.uses, 0),
  }), [promos]);

  const statusCfg: Record<string, { label: string; color: string }> = {
    active: { label: "Activă", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    scheduled: { label: "Programată", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    ended: { label: "Încheiată", color: "bg-muted text-muted-foreground" },
    paused: { label: "Pauză", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">🎯 Promoții & Campanii</h1>
          <p className="text-sm text-muted-foreground">Creează și gestionează promoții automate</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
          <Plus className="h-4 w-4" /> Promoție Nouă
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-500">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Programate</p>
          <p className="mt-1 text-2xl font-bold text-blue-500">{stats.scheduled}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Utilizări</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.totalUses}</p>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Creare Promoție</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-muted-foreground">Nume promoție</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Black Friday -30%" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Tip</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-muted-foreground">Valoare</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Minim comandă (RON)</label>
              <input type="number" value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: +e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Început</label>
              <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Sfârșit</label>
              <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Target</label>
              <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value as any }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background">
                <option value="all">Toți clienții</option>
                <option value="new_customers">Clienți noi</option>
                <option value="vip">Clienți VIP</option>
                <option value="category">Categorie specifică</option>
              </select></div>
            <div><label className="text-xs font-medium text-muted-foreground">Max utilizări (0=nelimitat)</label>
              <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: +e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Descriere</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.auto_apply} onChange={e => setForm(f => ({ ...f, auto_apply: e.target.checked }))} className="rounded" /> Aplicare automată</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.stackable} onChange={e => setForm(f => ({ ...f, stackable: e.target.checked }))} className="rounded" /> Cumulabilă</label>
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Creează</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {["all", "active", "scheduled", "paused", "ended"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary"}`}>
            {f === "all" ? "Toate" : statusCfg[f]?.label || f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(p => {
          const cfg = statusCfg[p.status] || statusCfg.ended;
          const tl = typeLabels[p.type] || typeLabels.percentage;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tl.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      {p.auto_apply && <span className="rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 text-[10px] font-bold">Auto</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tl.label}: {p.value}{p.type === "percentage" ? "%" : " RON"} • Min. {p.min_order} RON • {p.uses}/{p.max_uses || "∞"} utilizări</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.starts_at).toLocaleDateString("ro-RO")} → {new Date(p.ends_at).toLocaleDateString("ro-RO")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePause(p.id)} className="rounded-lg p-2 hover:bg-secondary transition" title={p.status === "paused" ? "Reia" : "Pauză"}>
                    {p.status === "paused" ? <Play className="h-4 w-4 text-green-500" /> : <Pause className="h-4 w-4 text-yellow-500" />}
                  </button>
                  <button onClick={() => deletePromo(p.id)} className="rounded-lg p-2 hover:bg-destructive/10 text-destructive transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground">Nicio promoție</div>}
      </div>
    </div>
  );
}
