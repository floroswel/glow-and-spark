import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link2, CheckCircle, XCircle, Settings, RefreshCw, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/integrations")({
  component: AdminIntegrations,
});

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  configFields: { key: string; label: string; type: "text" | "password" }[];
}

const defaultIntegrations: Integration[] = [
  { id: "smartbill", name: "SmartBill", description: "Facturare automată la comandă", icon: "📄", category: "Facturare", status: "disconnected", configFields: [{ key: "api_key", label: "API Key", type: "password" }, { key: "email", label: "Email cont", type: "text" }] },
  { id: "netopia", name: "Netopia Payments", description: "Plăți online cu card", icon: "💳", category: "Plăți", status: "connected", lastSync: new Date().toISOString(), configFields: [{ key: "signature", label: "Signature", type: "password" }, { key: "public_key", label: "Public Key", type: "text" }] },
  { id: "fan_courier", name: "Fan Courier", description: "Generare AWB și tracking colete", icon: "📦", category: "Livrare", status: "disconnected", configFields: [{ key: "client_id", label: "Client ID", type: "text" }, { key: "username", label: "Username", type: "text" }, { key: "password", label: "Password", type: "password" }] },
  { id: "sameday", name: "Sameday", description: "Livrare rapidă și easybox", icon: "🚀", category: "Livrare", status: "disconnected", configFields: [{ key: "username", label: "Username", type: "text" }, { key: "password", label: "Password", type: "password" }] },
  { id: "ga4", name: "Google Analytics 4 / Tag Manager", description: "Trafic & conversii (G-XXXX pentru GA4 sau GTM-XXXX pentru Tag Manager)", icon: "📊", category: "Analytics", status: "disconnected", configFields: [{ key: "measurement_id", label: "Measurement ID (G-...) sau Container ID (GTM-...)", type: "text" }] },
  { id: "fb_pixel", name: "Facebook Pixel", description: "Tracking Facebook Ads", icon: "📘", category: "Analytics", status: "disconnected", configFields: [{ key: "pixel_id", label: "Pixel ID", type: "text" }, { key: "access_token", label: "Conversions API Token", type: "password" }] },
  { id: "google_shopping", name: "Google Shopping", description: "Feed produse pentru Google", icon: "🛒", category: "Marketing", status: "disconnected", configFields: [{ key: "merchant_id", label: "Merchant ID", type: "text" }] },
  { id: "mailchimp", name: "Mailchimp", description: "Sincronizare abonați newsletter", icon: "📧", category: "Marketing", status: "disconnected", configFields: [{ key: "api_key", label: "API Key", type: "password" }, { key: "list_id", label: "List ID", type: "text" }] },
  { id: "tiktok", name: "TikTok Pixel", description: "Tracking TikTok Ads", icon: "🎵", category: "Analytics", status: "disconnected", configFields: [{ key: "pixel_id", label: "Pixel ID", type: "text" }] },
];

function AdminIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "integrations").maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value)) setIntegrations(data.value as unknown as Integration[]);
      else setIntegrations(defaultIntegrations);
      setLoading(false);
    });
  }, []);

  const save = async (updated: Integration[]) => {
    setIntegrations(updated);
    await supabase.from("site_settings").upsert({ key: "integrations", value: updated as any }, { onConflict: "key" });
    setToast("Salvat!"); setTimeout(() => setToast(""), 2500);
  };

  const toggleStatus = (id: string) => {
    save(integrations.map(i => i.id === id ? { ...i, status: i.status === "connected" ? "disconnected" as const : "connected" as const, lastSync: i.status === "disconnected" ? new Date().toISOString() : i.lastSync } : i));
  };

  const cats = [...new Set(integrations.map(i => i.category))];

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">🔗 Integrări</h1>
          <p className="text-sm text-muted-foreground mt-1">Conectează servicii externe la magazinul tău</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1 text-green-500"><CheckCircle className="h-4 w-4" />{integrations.filter(i => i.status === "connected").length} active</span>
          <span className="flex items-center gap-1 text-muted-foreground"><XCircle className="h-4 w-4" />{integrations.filter(i => i.status === "disconnected").length} inactive</span>
        </div>
      </div>

      {cats.map(cat => (
        <div key={cat}>
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground/60 mb-3">{cat.toUpperCase()}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.filter(i => i.category === cat).map(integration => (
              <div key={integration.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{integration.name}</h3>
                      <p className="text-xs text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${integration.status === "connected" ? "bg-green-500/10 text-green-500" : integration.status === "error" ? "bg-red-500/10 text-red-500" : "bg-secondary text-muted-foreground"}`}>
                    {integration.status === "connected" ? "Activ" : integration.status === "error" ? "Eroare" : "Inactiv"}
                  </span>
                </div>
                {integration.lastSync && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" />Ultimul sync: {new Date(integration.lastSync).toLocaleString("ro-RO")}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setConfigOpen(configOpen === integration.id ? null : integration.id)} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-medium flex items-center gap-1"><Settings className="h-3 w-3" />Configurare</button>
                  <button onClick={() => toggleStatus(integration.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${integration.status === "connected" ? "bg-red-500/10 text-red-500" : "bg-accent/10 text-accent"}`}>
                    {integration.status === "connected" ? "Deconectează" : "Conectează"}
                  </button>
                </div>
                {configOpen === integration.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {integration.configFields.map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-muted-foreground">{f.label}</label>
                        <input type={f.type} placeholder={f.label} value={configValues[`${integration.id}_${f.key}`] || ""} onChange={e => setConfigValues(v => ({ ...v, [`${integration.id}_${f.key}`]: e.target.value }))} className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                      </div>
                    ))}
                    <button onClick={() => { setToast(`${integration.name} configurat!`); setTimeout(() => setToast(""), 2500); setConfigOpen(null); }} className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-medium">Salvează configurare</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
