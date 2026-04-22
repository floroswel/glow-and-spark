import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Play, Pause, CheckCircle, Clock, Mail, ShoppingCart, Package, Users, Bell, Tag, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/automations")({
  component: AdminAutomations,
});

interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  runs: number;
  lastRun?: string;
  icon: any;
  category: string;
}

const automations: Automation[] = [
  { id: "1", name: "Email confirmare comandă", trigger: "Comandă nouă plasată", actions: ["Trimite email confirmare", "Generează factură", "Notifică admin"], enabled: true, runs: 342, lastRun: "acum 2 ore", icon: Mail, category: "Comenzi" },
  { id: "2", name: "Scădere automată stoc", trigger: "Comandă trece în Procesare", actions: ["Scade stoc produse", "Verifică alerte stoc minim", "Log mișcare stoc"], enabled: true, runs: 156, lastRun: "acum 3 ore", icon: Package, category: "Stoc" },
  { id: "3", name: "Restaurare stoc la anulare", trigger: "Comandă anulată", actions: ["Restaurează stoc produse", "Notifică admin", "Log mișcare stoc"], enabled: true, runs: 12, lastRun: "acum 2 zile", icon: RotateCcw, category: "Stoc" },
  { id: "4", name: "Email coș abandonat", trigger: "Coș abandonat > 24h", actions: ["Trimite email reminder", "Include cod reducere 5%"], enabled: true, runs: 89, lastRun: "ieri", icon: ShoppingCart, category: "Marketing" },
  { id: "5", name: "Email bun venit", trigger: "Cont nou creat", actions: ["Trimite email bun venit", "Acordă 50 puncte fidelitate", "Adaugă tag 'client_nou'"], enabled: true, runs: 234, lastRun: "acum 5 ore", icon: Users, category: "CRM" },
  { id: "6", name: "Cerere recenzie", trigger: "Comandă livrată + 7 zile", actions: ["Trimite email cerere recenzie", "Include link direct produs"], enabled: true, runs: 67, lastRun: "ieri", icon: CheckCircle, category: "Marketing" },
  { id: "7", name: "Alertă stoc minim", trigger: "Stoc produs < prag minim", actions: ["Notifică admin", "Trimite email manager stoc", "Marchează produs ca 'stoc redus'"], enabled: true, runs: 28, lastRun: "acum 1 zi", icon: Bell, category: "Stoc" },
  { id: "8", name: "Segmentare VIP automată", trigger: "Client > 500 RON total comenzi", actions: ["Mută în segment VIP", "Trimite email felicitare", "Acordă 100 puncte bonus"], enabled: true, runs: 15, lastRun: "săptămâna trecută", icon: Tag, category: "CRM" },
  { id: "9", name: "Email comandă expediată", trigger: "AWB generat pe comandă", actions: ["Trimite email cu AWB", "Actualizează status 'shipping'"], enabled: true, runs: 134, lastRun: "acum 4 ore", icon: Mail, category: "Comenzi" },
  { id: "10", name: "Reactivare clienți inactivi", trigger: "Client fără comandă > 90 zile", actions: ["Trimite email reactivare", "Include ofertă personalizată 15%"], enabled: false, runs: 45, lastRun: "luna trecută", icon: Users, category: "CRM" },
  { id: "11", name: "Flash sale automat", trigger: "Produs aproape de expirare stoc", actions: ["Aplică reducere automată 20%", "Adaugă badge 'OFERTĂ'", "Notifică abonați"], enabled: false, runs: 8, lastRun: "luna trecută", icon: Zap, category: "Marketing" },
  { id: "12", name: "Backup zilnic date", trigger: "Zilnic la 03:00", actions: ["Export CSV complet", "Verificare integritate DB", "Raport email"], enabled: true, runs: 180, lastRun: "azi la 03:00", icon: Clock, category: "Sistem" },
];

function AdminAutomations() {
  const [items, setItems] = useState(automations);
  const [filter, setFilter] = useState("all");

  const toggle = (id: string) => setItems(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const categories = [...new Set(items.map(a => a.category))];
  const filtered = filter === "all" ? items : items.filter(a => a.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">⚡ Automatizări</h1>
        <p className="text-sm text-muted-foreground">Fluxuri automate active pe magazin — triggers, acțiuni și statistici</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Automatizări</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-500">{items.filter(a => a.enabled).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Inactivate</p>
          <p className="mt-1 text-2xl font-bold text-muted-foreground">{items.filter(a => !a.enabled).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Rulări</p>
          <p className="mt-1 text-2xl font-bold text-accent">{items.reduce((a, i) => a + i.runs, 0).toLocaleString()}</p>
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
                  <div className="flex items-center gap-2">
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
                  <p className="text-sm font-bold text-foreground">{auto.runs}</p>
                  <p className="text-[10px] text-muted-foreground">rulări</p>
                  {auto.lastRun && <p className="text-[10px] text-muted-foreground">{auto.lastRun}</p>}
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
