import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight, Pencil, X, Search, Copy,
  Download, Upload, Zap, BarChart3, Gift, Truck, Percent, DollarSign,
  ChevronLeft, ChevronRight, Filter
} from "lucide-react";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

const PAGE_SIZE = 20;

function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });
  const [bulkForm, setBulkForm] = useState({ prefix: "GLOW", count: 50, type: "percent", value: "10", min_order: "", max_uses: "1", expires_at: "" });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = async () => {
    const [{ data: c }, { data: o }] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("discount_code, discount_amount, total, created_at").not("discount_code", "is", null),
    ]);
    setCoupons(c || []);
    setOrders(o || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Coupon usage stats from orders
  const couponStats = useMemo(() => {
    const stats: Record<string, { uses: number; totalDiscount: number; totalRevenue: number }> = {};
    (orders || []).forEach(o => {
      if (!o.discount_code) return;
      const code = o.discount_code.toUpperCase();
      if (!stats[code]) stats[code] = { uses: 0, totalDiscount: 0, totalRevenue: 0 };
      stats[code].uses++;
      stats[code].totalDiscount += Number(o.discount_amount || 0);
      stats[code].totalRevenue += Number(o.total || 0);
    });
    return stats;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = coupons;
    if (search) list = list.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));
    if (filterType === "active") list = list.filter(c => c.active);
    if (filterType === "inactive") list = list.filter(c => !c.active);
    if (filterType === "expired") list = list.filter(c => c.expires_at && new Date(c.expires_at) < new Date());
    if (filterType === "percent") list = list.filter(c => c.type === "percent");
    if (filterType === "fixed") list = list.filter(c => c.type === "fixed");
    if (filterType === "free_shipping") list = list.filter(c => c.type === "free_shipping");
    return list;
  }, [coupons, search, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, filterType]);

  const resetForm = () => {
    setForm({ code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GLOW-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, code });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.type === "free_shipping" ? 0 : Number(form.value),
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
    setShowBulk(false);
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

  // Bulk generate
  const handleBulkGenerate = async () => {
    setGenerating(true);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const codes: any[] = [];
    const existingCodes = new Set(coupons.map(c => c.code.toUpperCase()));

    for (let i = 0; i < bulkForm.count; i++) {
      let code: string;
      do {
        code = bulkForm.prefix.toUpperCase() + "-";
        for (let j = 0; j < 6; j++) code += chars[Math.floor(Math.random() * chars.length)];
      } while (existingCodes.has(code));
      existingCodes.add(code);
      codes.push({
        code,
        type: bulkForm.type,
        value: bulkForm.type === "free_shipping" ? 0 : Number(bulkForm.value),
        min_order: bulkForm.min_order ? Number(bulkForm.min_order) : 0,
        max_uses: bulkForm.max_uses ? Number(bulkForm.max_uses) : null,
        expires_at: bulkForm.expires_at || null,
        active: true,
      });
    }

    // Insert in batches of 50
    for (let i = 0; i < codes.length; i += 50) {
      await supabase.from("coupons").insert(codes.slice(i, i + 50));
    }

    setGenerating(false);
    setShowBulk(false);
    showToast(`✅ ${codes.length} cupoane generate!`);
    load();
  };

  // Export
  const handleExport = () => {
    const headers = "Cod,Tip,Valoare,Comanda Min,Utilizări,Max Utilizări,Expiră,Status\n";
    const rows = filtered.map(c =>
      `"${c.code}","${c.type}",${c.value},${c.min_order || 0},${c.uses || 0},${c.max_uses || ""},${c.expires_at ? new Date(c.expires_at).toLocaleDateString("ro-RO") : ""},${c.active ? "Activ" : "Inactiv"}`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `cupoane_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    showToast("📥 Export CSV complet!");
  };

  // Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(1).filter(l => l.trim());
      const toInsert: any[] = [];
      for (const line of lines) {
        const parts = line.split(",").map(p => p.replace(/"/g, "").trim());
        if (!parts[0]) continue;
        toInsert.push({
          code: parts[0].toUpperCase(),
          type: parts[1] || "percent",
          value: Number(parts[2]) || 0,
          min_order: Number(parts[3]) || 0,
          max_uses: parts[5] ? Number(parts[5]) : null,
          active: true,
        });
      }
      if (toInsert.length) {
        for (let i = 0; i < toInsert.length; i += 50) {
          await supabase.from("coupons").insert(toInsert.slice(i, i + 50));
        }
        showToast(`✅ ${toInsert.length} cupoane importate!`);
        load();
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // KPIs
  const activeCount = coupons.filter(c => c.active).length;
  const expiredCount = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length;
  const totalUses = coupons.reduce((s, c) => s + (c.uses || 0), 0);
  const realUses = Object.values(couponStats).reduce((s, v) => s + v.uses, 0);
  const totalDiscountGiven = Object.values(couponStats).reduce((s, v) => s + v.totalDiscount, 0);
  const totalRevenueWithCoupons = Object.values(couponStats).reduce((s, v) => s + v.totalRevenue, 0);

  const typeIcon = (t: string) => t === "percent" ? <Percent className="h-3.5 w-3.5" /> : t === "free_shipping" ? <Truck className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />;
  const typeLabel = (t: string) => t === "percent" ? "%" : t === "free_shipping" ? "Livrare" : "Fix";

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Cupoane</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} total · {activeCount} active · {realUses} utilizări reale</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition cursor-pointer">
            <Upload className="h-4 w-4" /> Import
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => { setShowBulk(!showBulk); setShowForm(false); }} className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition">
            <Zap className="h-4 w-4" /> Bulk Generate
          </button>
          <button onClick={() => { resetForm(); setShowForm(!showForm); setShowBulk(false); }} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
            <Plus className="h-4 w-4" /> Cupon Nou
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Active", value: activeCount, color: "text-chart-2", icon: Tag },
          { label: "Expirate", value: expiredCount, color: "text-destructive", icon: X },
          { label: "Total cupoane", value: coupons.length, color: "text-foreground", icon: Tag },
          { label: "Utilizări reale", value: realUses, color: "text-chart-1", icon: BarChart3 },
          { label: "Discount acordat", value: `${totalDiscountGiven.toFixed(0)} RON`, color: "text-accent", icon: Gift },
          { label: "Venituri cu cupon", value: `${(totalRevenueWithCoupons / 1000).toFixed(1)}k`, color: "text-chart-4", icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk Generate Form */}
      {showBulk && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2"><Zap className="h-5 w-5 text-accent" /> Generare Bulk Cupoane</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Prefix cod</label>
              <input value={bulkForm.prefix} onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm uppercase focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Câte cupoane</label>
              <input type="number" value={bulkForm.count} onChange={e => setBulkForm({ ...bulkForm, count: Number(e.target.value) })}
                min={1} max={5000}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tip</label>
              <select value={bulkForm.type} onChange={e => setBulkForm({ ...bulkForm, type: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
                <option value="percent">Procent (%)</option>
                <option value="fixed">Sumă fixă (lei)</option>
                <option value="free_shipping">Livrare gratuită</option>
              </select>
            </div>
            {bulkForm.type !== "free_shipping" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valoare</label>
                <input type="number" value={bulkForm.value} onChange={e => setBulkForm({ ...bulkForm, value: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Comandă minimă</label>
              <input type="number" value={bulkForm.min_order} onChange={e => setBulkForm({ ...bulkForm, min_order: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max utilizări/cupon</label>
              <input type="number" value={bulkForm.max_uses} onChange={e => setBulkForm({ ...bulkForm, max_uses: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expiră la</label>
              <input type="date" value={bulkForm.expires_at} onChange={e => setBulkForm({ ...bulkForm, expires_at: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Se vor genera {bulkForm.count} coduri unice cu formatul: <span className="font-mono font-bold">{bulkForm.prefix.toUpperCase()}-XXXXXX</span>
          </p>
          <div className="flex gap-3">
            <button onClick={handleBulkGenerate} disabled={generating}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-40">
              {generating ? "Se generează..." : `Generează ${bulkForm.count} cupoane`}
            </button>
            <button onClick={() => setShowBulk(false)} className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground hover:bg-secondary transition">Anulează</button>
          </div>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">{editingId ? "Editează Cupon" : "Cupon Nou"}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cod cupon *</label>
              <div className="flex gap-2">
                <input placeholder="GLOW-XXXX" required value={form.code} onChange={(e) => setForm({...form, code: e.target.value})}
                  className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm uppercase focus:border-accent focus:outline-none" />
                <button type="button" onClick={generateCode} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary transition" title="Auto-generează">
                  <Zap className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tip</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-accent focus:outline-none">
                <option value="percent">Procent (%)</option>
                <option value="fixed">Sumă fixă (lei)</option>
                <option value="free_shipping">Livrare gratuită</option>
              </select>
            </div>
            {form.type !== "free_shipping" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valoare *</label>
                <input placeholder="10" required type="number" step="0.01" value={form.value} onChange={(e) => setForm({...form, value: e.target.value})}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Comandă minimă</label>
              <input placeholder="0" type="number" step="0.01" value={form.min_order} onChange={(e) => setForm({...form, min_order: e.target.value})}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max utilizări</label>
              <input placeholder="Nelimitat" type="number" value={form.max_uses} onChange={(e) => setForm({...form, max_uses: e.target.value})}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expiră la</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({...form, expires_at: e.target.value})}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
              {editingId ? "Actualizează" : "Salvează"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground hover:bg-secondary transition">Anulează</button>
          </div>
        </form>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Caută cod cupon..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none">
          <option value="all">Toate ({coupons.length})</option>
          <option value="active">Active ({activeCount})</option>
          <option value="inactive">Inactive ({coupons.filter(c => !c.active).length})</option>
          <option value="expired">Expirate ({expiredCount})</option>
          <option value="percent">Procent ({coupons.filter(c => c.type === "percent").length})</option>
          <option value="fixed">Sumă fixă ({coupons.filter(c => c.type === "fixed").length})</option>
          <option value="free_shipping">Livrare gratuită ({coupons.filter(c => c.type === "free_shipping").length})</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cod</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tip</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Valoare</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Min.</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Utilizări</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Discount dat</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Expiră</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((c) => {
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
              const stats = couponStats[c.code.toUpperCase()];
              return (
                <tr key={c.id} className={`hover:bg-secondary/30 transition ${isExpired ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      {typeIcon(c.type)} <span className="text-xs">{typeLabel(c.type)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">
                    {c.type === "percent" ? `${c.value}%` : c.type === "free_shipping" ? "Gratuit" : `${Number(c.value).toFixed(0)} lei`}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">{Number(c.min_order || 0).toFixed(0)} lei</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(stats?.uses || c.uses) > 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {stats?.uses || c.uses || 0}{c.max_uses ? `/${c.max_uses}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                    {stats ? `${stats.totalDiscount.toFixed(0)} RON` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {c.expires_at ? (
                      <span className={`text-xs ${isExpired ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {new Date(c.expires_at).toLocaleDateString("ro-RO")}
                        {isExpired && " ✗"}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">∞</span>}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3 py-1 text-sm text-muted-foreground">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
