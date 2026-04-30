import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Banknote, Smartphone, Check, X, Settings, ToggleLeft, ToggleRight, Zap, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
});

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  icon: string;
  enabled: boolean;
  description: string;
  fee_percent: number;
  fee_fixed: number;
  min_order: number;
  sort_order: number;
}

const defaultMethods: PaymentMethod[] = [
  { id: "1", name: "Ramburs la livrare", code: "ramburs", icon: "💵", enabled: true, description: "Plata cash la livrare prin curier", fee_percent: 0, fee_fixed: 0, min_order: 0, sort_order: 0 },
  { id: "2", name: "Card online (Netopia)", code: "netopia", icon: "💳", enabled: true, description: "Plata cu cardul Visa/Mastercard prin Netopia", fee_percent: 1.5, fee_fixed: 0, min_order: 0, sort_order: 1 },
  { id: "3", name: "Transfer bancar", code: "transfer", icon: "🏦", enabled: false, description: "Plata prin ordin de plată sau transfer bancar", fee_percent: 0, fee_fixed: 0, min_order: 0, sort_order: 2 },
  { id: "4", name: "Rate (Mokka)", code: "mokka", icon: "📱", enabled: false, description: "Plata în 3-12 rate fără dobândă", fee_percent: 3, fee_fixed: 0, min_order: 200, sort_order: 3 },
  { id: "5", name: "Apple Pay / Google Pay", code: "wallet", icon: "📲", enabled: false, description: "Plata rapidă cu wallet digital", fee_percent: 1.5, fee_fixed: 0, min_order: 0, sort_order: 4 },
];

function AdminPayments() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "payment_methods").maybeSingle();
    if (data?.value && Array.isArray(data.value)) {
      setMethods(data.value as unknown as PaymentMethod[]);
    } else {
      setMethods(defaultMethods);
    }
    setLoading(false);
  }

  async function saveAll(updated: PaymentMethod[]) {
    setMethods(updated);
    await supabase.from("site_settings").upsert({ key: "payment_methods", value: updated as any }, { onConflict: "key" });
    setToast("Salvat cu succes!");
    setTimeout(() => setToast(""), 3000);
  }

  function toggleMethod(code: string) {
    const updated = methods.map(m => m.code === code ? { ...m, enabled: !m.enabled } : m);
    saveAll(updated);
  }

  function saveEdit() {
    if (!editing) return;
    const updated = methods.map(m => m.id === editing.id ? editing : m);
    saveAll(updated);
    setEditing(null);
  }

  const stats = useMemo(() => ({
    active: methods.filter(m => m.enabled).length,
    total: methods.length,
  }), [methods]);

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Metode de Plată</h1>
          <p className="text-sm text-muted-foreground">{stats.active} active din {stats.total} metode configurate</p>
        </div>
      </div>

      <div className="grid gap-4">
        {methods.map(method => (
          <div key={method.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-3xl">{method.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{method.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${method.enabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {method.enabled ? "ACTIV" : "INACTIV"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
              {(method.fee_percent > 0 || method.fee_fixed > 0) && (
                <p className="text-xs text-accent mt-1">Comision: {method.fee_percent}%{method.fee_fixed > 0 ? ` + ${method.fee_fixed} RON` : ""}</p>
              )}
              {method.min_order > 0 && <p className="text-xs text-muted-foreground">Comandă minimă: {method.min_order} RON</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing({ ...method })} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary transition">
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => toggleMethod(method.code)} className="text-muted-foreground hover:text-foreground transition">
                {method.enabled ? <ToggleRight className="h-6 w-6 text-accent" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">Editare: {editing.name}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descriere</label>
                <input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Comision (%)</label>
                  <input type="number" step="0.1" value={editing.fee_percent} onChange={e => setEditing({ ...editing, fee_percent: +e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Comision fix (RON)</label>
                  <input type="number" step="0.5" value={editing.fee_fixed} onChange={e => setEditing({ ...editing, fee_fixed: +e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Comandă minimă (RON)</label>
                <input type="number" value={editing.min_order} onChange={e => setEditing({ ...editing, min_order: +e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
              <button onClick={saveEdit} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Salvează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
