import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, ShieldCheck, GripVertical } from "lucide-react";
import { TrustBadges } from "@/components/TrustBadges";

export const Route = createFileRoute("/admin/trust-badges")({
  head: () => ({ meta: [{ title: "Trust Badges — Admin" }] }),
  component: AdminTrustBadges,
});

interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  active: boolean;
}

const ICON_OPTIONS = [
  "ShieldCheck", "RotateCcw", "Truck", "Award", "Star", "Heart", "Lock", "Gift",
  "Package", "BadgeCheck", "Sparkles", "Leaf", "Crown", "ThumbsUp", "Zap", "Phone",
  "Headphones", "CreditCard", "Tag", "Clock",
];

function AdminTrustBadges() {
  const [enabled, setEnabled] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "trust_badges")
      .maybeSingle()
      .then(({ data }) => {
        const v: any = data?.value || {};
        setEnabled(v.enabled !== false);
        setBadges(Array.isArray(v.badges) ? v.badges : []);
        setLoading(false);
      });
  }, []);

  const update = (id: string, patch: Partial<Badge>) =>
    setBadges((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const remove = (id: string) => setBadges((b) => b.filter((x) => x.id !== id));

  const add = () =>
    setBadges((b) => [
      ...b,
      {
        id: `b${Date.now()}`,
        icon: "ShieldCheck",
        title: "Beneficiu nou",
        desc: "Descriere scurtă",
        color: "#C9A24A",
        active: true,
      },
    ]);

  const move = (idx: number, dir: -1 | 1) => {
    setBadges((b) => {
      const next = [...b];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return b;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "trust_badges", value: { enabled, badges } as any }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Salvat cu succes");
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Trust Badges
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurează bagdele de încredere afișate pe pagina produsului și în coș.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Se salvează..." : "Salvează"}
        </button>
      </div>

      <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Activează secțiunea pe site</p>
          <p className="text-xs text-muted-foreground">Dacă e dezactivată, bagdele nu sunt afișate nicăieri.</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-accent transition" />
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
        </label>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Bagde ({badges.length})</h2>
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Adaugă bagde
          </button>
        </div>

        <div className="space-y-3">
          {badges.map((b, idx) => (
            <div key={b.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                    title="Sus"
                  >
                    ▲
                  </button>
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                    title="Jos"
                  >
                    ▼
                  </button>
                </div>

                <div className="grid flex-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-medium text-muted-foreground">Iconiță</label>
                    <select
                      value={b.icon}
                      onChange={(e) => update(b.id, { icon: e.target.value })}
                      className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      {ICON_OPTIONS.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[11px] font-medium text-muted-foreground">Titlu</label>
                    <input
                      value={b.title}
                      onChange={(e) => update(b.id, { title: e.target.value })}
                      className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                      maxLength={60}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-medium text-muted-foreground">Descriere</label>
                    <input
                      value={b.desc}
                      onChange={(e) => update(b.id, { desc: e.target.value })}
                      className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                      maxLength={80}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-muted-foreground">Culoare</label>
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="color"
                        value={b.color || "#C9A24A"}
                        onChange={(e) => update(b.id, { color: e.target.value })}
                        className="h-8 w-10 cursor-pointer rounded border border-border bg-background"
                      />
                      <input
                        value={b.color || ""}
                        onChange={(e) => update(b.id, { color: e.target.value })}
                        className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <label className="relative inline-flex cursor-pointer items-center" title={b.active ? "Activ" : "Inactiv"}>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={b.active !== false}
                      onChange={(e) => update(b.id, { active: e.target.checked })}
                    />
                    <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-accent transition" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
                  </label>
                  <button
                    onClick={() => remove(b.id)}
                    className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                    title="Șterge"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {badges.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Niciun bagde. Apasă „Adaugă bagde" pentru a începe.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Previzualizare</h3>
        <div className="max-w-md">
          <TrustBadges />
        </div>
      </div>
    </div>
  );
}
