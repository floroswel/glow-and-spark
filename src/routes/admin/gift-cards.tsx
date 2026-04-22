import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Plus, Search, Copy, Download, CheckCircle, XCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/gift-cards")({
  component: AdminGiftCards,
});

interface GiftCard {
  id: string;
  code: string;
  initial_value: number;
  balance: number;
  status: "active" | "used" | "expired" | "disabled";
  buyer_name: string;
  buyer_email: string;
  recipient_name: string;
  recipient_email: string;
  message: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
  order_id?: string;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GS-";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function AdminGiftCards() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    initial_value: 100,
    buyer_name: "",
    buyer_email: "",
    recipient_name: "",
    recipient_email: "",
    message: "Un cadou parfumat special pentru tine! 🕯️",
    expires_days: 365,
  });

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "gift_cards").maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value)) setCards(data.value as unknown as GiftCard[]);
      setLoading(false);
    });
  }, []);

  const save = async (updated: GiftCard[]) => {
    setCards(updated);
    await supabase.from("site_settings").upsert({ key: "gift_cards", value: updated as any }, { onConflict: "key" });
  };

  const createCard = () => {
    if (!form.buyer_name || form.initial_value <= 0) return;
    const card: GiftCard = {
      id: crypto.randomUUID(),
      code: generateCode(),
      initial_value: form.initial_value,
      balance: form.initial_value,
      status: "active",
      buyer_name: form.buyer_name,
      buyer_email: form.buyer_email,
      recipient_name: form.recipient_name,
      recipient_email: form.recipient_email,
      message: form.message,
      expires_at: new Date(Date.now() + form.expires_days * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };
    save([card, ...cards]);
    setShowCreate(false);
    setToast("Card cadou creat!");
    setTimeout(() => setToast(""), 3000);
    setForm({ initial_value: 100, buyer_name: "", buyer_email: "", recipient_name: "", recipient_email: "", message: "Un cadou parfumat special pentru tine! 🕯️", expires_days: 365 });
  };

  const toggleStatus = (id: string) => {
    save(cards.map(c => c.id === id ? { ...c, status: c.status === "active" ? "disabled" as const : "active" as const } : c));
  };

  const filtered = useMemo(() => cards.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.code.toLowerCase().includes(s) || c.buyer_name.toLowerCase().includes(s) || c.recipient_name?.toLowerCase().includes(s);
    }
    return true;
  }), [cards, search, filterStatus]);

  const stats = useMemo(() => ({
    total: cards.length,
    active: cards.filter(c => c.status === "active").length,
    totalValue: cards.reduce((a, c) => a + c.initial_value, 0),
    totalBalance: cards.filter(c => c.status === "active").reduce((a, c) => a + c.balance, 0),
  }), [cards]);

  const statusCfg: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: "Activ", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
    used: { label: "Folosit", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Gift },
    expired: { label: "Expirat", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Clock },
    disabled: { label: "Dezactivat", color: "bg-muted text-muted-foreground", icon: XCircle },
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">🎁 Carduri Cadou</h1>
          <p className="text-sm text-muted-foreground">Gestionează carduri cadou și vouchere</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
          <Plus className="h-4 w-4" /> Card Nou
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Carduri</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-500">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Valoare Totală Emisă</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.totalValue.toLocaleString()} RON</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Sold Nefolosit</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">{stats.totalBalance.toLocaleString()} RON</p>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Emite Card Cadou</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-muted-foreground">Valoare (RON)</label>
              <input type="number" value={form.initial_value} onChange={e => setForm(f => ({ ...f, initial_value: +e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Valabilitate (zile)</label>
              <input type="number" value={form.expires_days} onChange={e => setForm(f => ({ ...f, expires_days: +e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Nume Cumpărător</label>
              <input value={form.buyer_name} onChange={e => setForm(f => ({ ...f, buyer_name: e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Email Cumpărător</label>
              <input type="email" value={form.buyer_email} onChange={e => setForm(f => ({ ...f, buyer_email: e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Nume Destinatar</label>
              <input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Email Destinatar</label>
              <input type="email" value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Mesaj personalizat</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" /></div>
          <div className="flex gap-2">
            <button onClick={createCard} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Emite Card</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută cod, cumpărător..." className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm bg-background" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm bg-background">
          <option value="all">Toate</option>
          <option value="active">Active</option>
          <option value="used">Folosite</option>
          <option value="expired">Expirate</option>
          <option value="disabled">Dezactivate</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cod</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cumpărător</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Destinatar</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valoare</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sold</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expiră</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Acțiuni</th>
          </tr></thead>
          <tbody>
            {filtered.map(c => {
              const cfg = statusCfg[c.status] || statusCfg.active;
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold">{c.code}</span>
                      <button onClick={() => { navigator.clipboard.writeText(c.code); setToast("Cod copiat!"); setTimeout(() => setToast(""), 2000); }} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">{c.buyer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.buyer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">{c.recipient_name || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{c.recipient_email || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{c.initial_value} RON</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-500">{c.balance} RON</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                      <cfg.icon className="h-3 w-3" />{cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.expires_at).toLocaleDateString("ro-RO")}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleStatus(c.id)} className="text-xs text-accent hover:underline">
                      {c.status === "active" ? "Dezactivează" : "Activează"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">Niciun card cadou găsit</div>}
      </div>
    </div>
  );
}
