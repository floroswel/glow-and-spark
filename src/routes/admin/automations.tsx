import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Play, Pause, CheckCircle, Mail, ShoppingCart, Package, Users, Bell, Tag, RotateCcw, Clock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/automations")({
  component: AdminAutomations,
});

interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  icon: any;
  category: string;
}

const defaultAutomations: Automation[] = [
  { id: "1", name: "Email confirmare comandă", trigger: "Comandă nouă plasată", actions: ["Trimite email confirmare", "Generează factură", "Notifică admin"], enabled: true, icon: Mail, category: "Comenzi" },
  { id: "2", name: "Scădere automată stoc", trigger: "Comandă trece în Procesare", actions: ["Scade stoc produse", "Verifică alerte stoc minim", "Log mișcare stoc"], enabled: true, icon: Package, category: "Stoc" },
  { id: "3", name: "Restaurare stoc la anulare", trigger: "Comandă anulată", actions: ["Restaurează stoc produse", "Notifică admin", "Log mișcare stoc"], enabled: true, icon: RotateCcw, category: "Stoc" },
  { id: "4", name: "Email coș abandonat", trigger: "Coș abandonat > 24h", actions: ["Trimite email reminder", "Include cod reducere 5%"], enabled: true, icon: ShoppingCart, category: "Marketing" },
  { id: "5", name: "Email bun venit", trigger: "Cont nou creat", actions: ["Trimite email bun venit", "Acordă 50 puncte fidelitate", "Adaugă tag 'client_nou'"], enabled: true, icon: Users, category: "CRM" },
  { id: "6", name: "Cerere recenzie", trigger: "Comandă livrată + 7 zile", actions: ["Trimite email cerere recenzie", "Include link direct produs"], enabled: true, icon: CheckCircle, category: "Marketing" },
  { id: "7", name: "Alertă stoc minim", trigger: "Stoc produs < prag minim", actions: ["Notifică admin", "Trimite email manager stoc", "Marchează produs ca 'stoc redus'"], enabled: true, icon: Bell, category: "Stoc" },
  { id: "8", name: "Segmentare VIP automată", trigger: "Client > 500 RON total comenzi", actions: ["Mută în segment VIP", "Trimite email felicitare", "Acordă 100 puncte bonus"], enabled: true, icon: Tag, category: "CRM" },
  { id: "9", name: "Email comandă expediată", trigger: "AWB generat pe comandă", actions: ["Trimite email cu AWB", "Actualizează status 'shipping'"], enabled: true, icon: Mail, category: "Comenzi" },
  { id: "10", name: "Reactivare clienți inactivi", trigger: "Client fără comandă > 90 zile", actions: ["Trimite email reactivare", "Include ofertă personalizată 15%"], enabled: false, icon: Users, category: "CRM" },
  { id: "11", name: "Flash sale automat", trigger: "Produs aproape de expirare stoc", actions: ["Aplică reducere automată 20%", "Adaugă badge 'OFERTĂ'", "Notifică abonați"], enabled: false, icon: Zap, category: "Marketing" },
  { id: "12", name: "Backup zilnic date", trigger: "Zilnic la 03:00", actions: ["Export CSV complet", "Verificare integritate DB", "Raport email"], enabled: true, icon: Clock, category: "Sistem" },
];

const iconMap: Record<string, any> = { Mail, Package, RotateCcw, ShoppingCart, Users, CheckCircle, Bell, Tag, Zap, Clock };

function AdminAutomations() {
  const [items, setItems] = useState<Automation[]>(defaultAutomations);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "automations")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && Array.isArray(data.value)) {
          const stored = data.value as any[];
          const merged = defaultAutomations.map(def => {
            const found = stored.find((s: any) => s.id === def.id);
            return found ? { ...def, enabled: found.enabled ?? def.enabled } : def;
          });
          setItems(merged);
        }
        setLoading(false);
      });
  }, []);

  const toggle = async (id: string) => {
    const updated = items.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setItems(updated);
    const serializable = updated.map(({ icon, ...rest }) => ({ ...rest, iconName: Object.keys(iconMap).find(k => iconMap[k] === icon) || "Zap" }));
    await supabase.from("site_settings").upsert(
      { key: "automations", value: serializable as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  };

  const categories = [...new Set(items.map(a => a.category))];
  const filtered = filter === "all" ? items : items.filter(a => a.category === filter);

  if (loading) return <div className="text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">⚡ Automatizări</h1>
        <p className="text-sm text-muted-foreground">Fluxuri automate active pe magazin — triggers și acțiuni</p>
      </div>

      <div className="flex gap-3 rounded-xl border border-yellow-300 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-900/10 p-4">
        <Info className="h-5 w-5 shrink-0 text-yellow-700 dark:text-yellow-400 mt-0.5" />
        <p className="text-sm text-yellow-900 dark:text-yellow-200">
          Toggle-urile activează sau dezactivează execuția automată a acestor funcții prin edge functions.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Automatizări</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-500">{items.filter(a => a.enabled).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Inactive</p>
          <p className="mt-1 text-2xl font-bold text-muted-foreground">{items.filter(a => !a.enabled).length}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === "all" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary"}`}>Toate</button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === c ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary"}`}>{c}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(auto => (
          <div key={auto.id} className={`rounded-xl border bg-card p-4 transition ${auto.enabled ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${auto.enabled ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                  <auto.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-sm">{auto.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${auto.enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {auto.enabled ? "ACTIV" : "INACTIV"}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{auto.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium">Trigger:</span> {auto.trigger}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {auto.actions.map((a, i) => (
                      <span key={i} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">→ {a}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-xs font-bold ${auto.enabled ? "text-green-600" : "text-muted-foreground"}`}>
                    {auto.enabled ? "Configurată" : "Inactivă"}
                  </p>
                </div>
                <button onClick={() => toggle(auto.id)} className={`rounded-lg p-2 transition ${auto.enabled ? "hover:bg-yellow-100 dark:hover:bg-yellow-900/20 text-yellow-600" : "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600"}`}
                  title={auto.enabled ? "Dezactivează" : "Activează"}>
                  {auto.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
