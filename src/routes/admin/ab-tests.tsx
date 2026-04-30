import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ab-tests")({
  component: ABTestsPage,
});

function ABTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("ab_tests").select("*, ab_test_variants(*)").order("created_at", { ascending: false });
    setTests(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const { data, error } = await supabase.from("ab_tests").insert({ name: "Test nou", status: "draft" }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("ab_test_variants").insert([
      { test_id: data.id, name: "A (control)", traffic_percent: 50 },
      { test_id: data.id, name: "B", traffic_percent: 50 },
    ]);
    load();
  };

  const updateTest = async (id: string, patch: any) => { await supabase.from("ab_tests").update(patch).eq("id", id); load(); };
  const remove = async (id: string) => { if (confirm("Ștergi testul?")) { await supabase.from("ab_tests").delete().eq("id", id); load(); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">A/B Tests</h1><p className="text-sm text-muted-foreground">Testează variante și optimizează conversia</p></div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Test nou</button>
      </div>

      <div className="space-y-3">
        {tests.map(t => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input value={t.name} onChange={e => updateTest(t.id, { name: e.target.value })} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold" />
              <input value={t.target_url || ""} onChange={e => updateTest(t.id, { target_url: e.target.value })} placeholder="URL țintă" className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <select value={t.status} onChange={e => updateTest(t.id, { status: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="draft">Draft</option><option value="running">În rulare</option><option value="paused">Pauză</option><option value="completed">Finalizat</option>
              </select>
              <button onClick={() => remove(t.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {t.ab_test_variants?.map((v: any) => {
                const cr = v.visitors > 0 ? (v.conversions / v.visitors * 100).toFixed(2) : "0";
                return (
                  <div key={v.id} className="rounded-lg bg-secondary/50 p-3 text-sm">
                    <div className="font-medium">{v.name} <span className="text-muted-foreground">({v.traffic_percent}%)</span></div>
                    <div className="text-xs text-muted-foreground mt-1">Vizitatori: {v.visitors} • Conversii: {v.conversions} • CR: {cr}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {tests.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Niciun test creat</div>}
      </div>
    </div>
  );
}
