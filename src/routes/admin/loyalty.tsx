import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Star, Trophy, TrendingUp, Users, Settings, Gift } from "lucide-react";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, NumberInput } from "@/components/admin/AdminSettingsEditor";

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

function AdminLoyalty() {
  const [tab, setTab] = useState<"overview" | "config" | "members">("overview");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("orders").select("customer_email, customer_name, total, created_at").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, []);

  const members = useMemo(() => {
    const byEmail: Record<string, { name: string; email: string; total: number; orders: number; points: number }> = {};
    orders.forEach(o => {
      const e = o.customer_email?.toLowerCase();
      if (!e) return;
      if (!byEmail[e]) byEmail[e] = { name: o.customer_name, email: e, total: 0, orders: 0, points: 0 };
      byEmail[e].total += Number(o.total || 0);
      byEmail[e].orders++;
      byEmail[e].points += Math.floor(Number(o.total || 0) * defaultConfig.points_per_ron);
    });
    return Object.values(byEmail).sort((a, b) => b.points - a.points);
  }, [orders]);

  const getTier = (points: number) => {
    const tiers = [...defaultConfig.tiers].reverse();
    return tiers.find(t => points >= t.min_points) || defaultConfig.tiers[0];
  };

  const stats = useMemo(() => ({
    totalMembers: members.length,
    totalPoints: members.reduce((a, m) => a + m.points, 0),
    avgPoints: members.length ? Math.round(members.reduce((a, m) => a + m.points, 0) / members.length) : 0,
    tierDist: defaultConfig.tiers.map(t => ({
      ...t,
      count: members.filter(m => getTier(m.points).name === t.name).length,
    })),
  }), [members]);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "members" as const, label: "Membri", icon: Users },
    { id: "config" as const, label: "Configurare", icon: Settings },
  ];

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
              <p className="text-xs font-medium text-muted-foreground">Puncte Emise</p>
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
                const tier = getTier(m.points);
                return (
                  <div key={m.email} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-lg">{tier.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-500">{m.points.toLocaleString()} pt</p>
                      <p className="text-xs text-muted-foreground">{m.orders} comenzi • {m.total.toFixed(0)} RON</p>
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
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Puncte</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comenzi</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Cheltuit</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valoare Puncte</th>
            </tr></thead>
            <tbody>
              {members.map(m => {
                const tier = getTier(m.points);
                return (
                  <tr key={m.email} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="text-lg">{tier.emoji}</span> <span className="text-xs font-medium">{tier.name}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-amber-500">{m.points.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{m.orders}</td>
                    <td className="px-4 py-3 text-right font-semibold">{m.total.toFixed(0)} RON</td>
                    <td className="px-4 py-3 text-right text-green-500 font-medium">{(m.points * defaultConfig.ron_per_point).toFixed(0)} RON</td>
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
    </div>
  );
}
