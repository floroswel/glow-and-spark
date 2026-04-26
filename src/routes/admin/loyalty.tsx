import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Settings } from "lucide-react";
import { AdminSettingsEditor, Section, Field, Toggle, NumberInput } from "@/components/admin/AdminSettingsEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/loyalty")({
  component: AdminLoyalty,
});

const defaultConfig = {
  enabled: true,
  points_per_ron: 1,
  ron_per_point: 0.1,
  welcome_bonus: 50,
  review_bonus: 20,
  birthday_bonus: 100,
  referral_bonus: 75,
  min_redeem: 100,
  tiers: [
    { name: "Bronze", emoji: "🥉", min_points: 0, discount_percent: 0, free_shipping: false },
    { name: "Silver", emoji: "🥈", min_points: 500, discount_percent: 5, free_shipping: false },
    { name: "Gold", emoji: "🥇", min_points: 1500, discount_percent: 10, free_shipping: true },
    { name: "Platinum", emoji: "💎", min_points: 5000, discount_percent: 15, free_shipping: true },
  ],
};

type Member = {
  user_id: string;
  balance: number;
  lifetime_points: number;
  tier: string;
  full_name: string | null;
  avatar_url: string | null;
};

function AdminLoyalty() {
  const [tab, setTab] = useState<"overview" | "config" | "members">("overview");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustMember, setAdjustMember] = useState<Member | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data: pts } = await supabase
      .from("user_points")
      .select("user_id, balance, lifetime_points, tier")
      .order("balance", { ascending: false });
    const userIds = (pts || []).map(p => p.user_id);
    let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      (profs || []).forEach(p => { profilesMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
    }
    setMembers((pts || []).map(p => ({
      user_id: p.user_id,
      balance: Number(p.balance || 0),
      lifetime_points: Number(p.lifetime_points || 0),
      tier: p.tier || "Bronze",
      full_name: profilesMap[p.user_id]?.full_name ?? null,
      avatar_url: profilesMap[p.user_id]?.avatar_url ?? null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const tierByName = (name: string) => defaultConfig.tiers.find(t => t.name === name) || defaultConfig.tiers[0];

  const stats = useMemo(() => ({
    totalMembers: members.length,
    totalPoints: members.reduce((a, m) => a + m.balance, 0),
    avgPoints: members.length ? Math.round(members.reduce((a, m) => a + m.balance, 0) / members.length) : 0,
    tierDist: defaultConfig.tiers.map(t => ({
      ...t,
      count: members.filter(m => m.tier === t.name).length,
    })),
  }), [members]);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "members" as const, label: "Membri", icon: Users },
    { id: "config" as const, label: "Configurare", icon: Settings },
  ];

  const openAdjust = (m: Member) => {
    setAdjustMember(m);
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustOpen(true);
  };

  const saveAdjust = async () => {
    if (!adjustMember) return;
    const amount = parseInt(adjustAmount, 10);
    if (!Number.isFinite(amount) || amount === 0) {
      toast.error("Introduceți o sumă validă (diferită de 0)");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Adăugați un motiv");
      return;
    }
    setSaving(true);
    try {
      const newBalance = Math.max(0, adjustMember.balance + amount);
      const newLifetime = amount > 0 ? adjustMember.lifetime_points + amount : adjustMember.lifetime_points;
      const { error: upErr } = await supabase
        .from("user_points")
        .update({ balance: newBalance, lifetime_points: newLifetime, updated_at: new Date().toISOString() })
        .eq("user_id", adjustMember.user_id);
      if (upErr) throw upErr;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: txErr } = await (supabase as any)
        .from("points_transactions")
        .insert({
          user_id: adjustMember.user_id,
          amount,
          reason: adjustReason.trim(),
          type: amount > 0 ? "manual_add" : "manual_deduct",
          created_by: user?.id ?? null,
        });
      if (txErr) throw txErr;

      toast.success("Ajustare salvată");
      setAdjustOpen(false);
      await loadMembers();
    } catch (e: any) {
      toast.error(e?.message || "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">👑 Program Fidelitate</h1>
        <p className="text-sm text-muted-foreground">Recompensează clienții fideli cu puncte și beneficii exclusive</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Membri Total</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.totalMembers}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Puncte Active</p>
              <p className="mt-1 text-2xl font-bold text-amber-500">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Media Puncte</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.avgPoints}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">Valoare Puncte</p>
              <p className="mt-1 text-2xl font-bold text-green-500">{(stats.totalPoints * defaultConfig.ron_per_point).toLocaleString()} RON</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Distribuție pe Niveluri</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.tierDist.map(t => (
                <div key={t.name} className="text-center rounded-xl border border-border p-4">
                  <span className="text-3xl">{t.emoji}</span>
                  <p className="mt-2 font-semibold text-foreground">{t.name}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{t.count}</p>
                  <p className="text-xs text-muted-foreground">{t.min_points}+ puncte</p>
                  <p className="text-xs text-accent mt-1">{t.discount_percent}% reducere{t.free_shipping ? " + livrare gratuită" : ""}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Top 10 Membri</h3>
            <div className="space-y-2">
              {members.slice(0, 10).map((m, i) => {
                const tier = tierByName(m.tier);
                return (
                  <div key={m.user_id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-lg">{tier.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.full_name || "Client"}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-500">{m.balance.toLocaleString()} pt</p>
                      <p className="text-xs text-muted-foreground">Lifetime: {m.lifetime_points.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Nivel</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balanță</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Lifetime</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valoare</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acțiuni</th>
            </tr></thead>
            <tbody>
              {members.map(m => {
                const tier = tierByName(m.tier);
                return (
                  <tr key={m.user_id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{m.full_name || "Client"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">{m.user_id}</p>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="text-lg">{tier.emoji}</span> <span className="text-xs font-medium">{m.tier}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-amber-500">{m.balance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{m.lifetime_points.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-500 font-medium">{(m.balance * defaultConfig.ron_per_point).toFixed(0)} RON</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openAdjust(m)}>Ajustare manuală</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {members.length === 0 && <div className="py-12 text-center text-muted-foreground">Niciun membru în program</div>}
        </div>
      )}

      {tab === "config" && (
        <AdminSettingsEditor settingsKey="loyalty_config" defaults={defaultConfig} title="Configurare Program Fidelitate">
          {(s, u) => (
            <>
              <Section title="⚙️ Setări Generale">
                <div className="space-y-4">
                  <Toggle value={s.enabled} onChange={v => u("enabled", v)} label="Program fidelitate activ" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Puncte per 1 RON cheltuit"><NumberInput value={s.points_per_ron} onChange={v => u("points_per_ron", v)} min={0.1} max={10} /></Field>
                    <Field label="Valoare 1 punct (RON)"><NumberInput value={s.ron_per_point} onChange={v => u("ron_per_point", v)} min={0.01} max={1} /></Field>
                    <Field label="Min. puncte pt. răscumpărare"><NumberInput value={s.min_redeem} onChange={v => u("min_redeem", v)} min={10} max={1000} /></Field>
                  </div>
                </div>
              </Section>
              <Section title="🎁 Bonusuri">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Bonus bun venit (puncte)"><NumberInput value={s.welcome_bonus} onChange={v => u("welcome_bonus", v)} min={0} max={500} /></Field>
                  <Field label="Bonus recenzie (puncte)"><NumberInput value={s.review_bonus} onChange={v => u("review_bonus", v)} min={0} max={200} /></Field>
                  <Field label="Bonus zi naștere (puncte)"><NumberInput value={s.birthday_bonus} onChange={v => u("birthday_bonus", v)} min={0} max={500} /></Field>
                  <Field label="Bonus referral (puncte)"><NumberInput value={s.referral_bonus} onChange={v => u("referral_bonus", v)} min={0} max={500} /></Field>
                </div>
              </Section>
            </>
          )}
        </AdminSettingsEditor>
      )}

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustare manuală puncte</DialogTitle>
          </DialogHeader>
          {adjustMember && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Client: <span className="font-medium text-foreground">{adjustMember.full_name || adjustMember.user_id}</span>
                <br />
                Balanță curentă: <span className="font-medium text-foreground">{adjustMember.balance} pt</span>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Sumă (pozitiv = adaugă, negativ = scade)</label>
                <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="ex: 50 sau -20" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Motiv</label>
                <Textarea value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Motivul ajustării..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)} disabled={saving}>Anulează</Button>
            <Button onClick={saveAdjust} disabled={saving}>{saving ? "Se salvează..." : "Salvează"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
