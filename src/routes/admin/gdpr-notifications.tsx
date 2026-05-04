import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, Monitor, Save, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gdpr-notifications")({
  component: AdminGdprNotificationsPage,
});

interface NotifSettings {
  channels: { email: boolean; in_app: boolean };
  events: Record<string, { email: boolean; in_app: boolean }>;
  request_types: Record<string, { email: boolean; in_app: boolean }>;
}

const DEFAULT_SETTINGS: NotifSettings = {
  channels: { email: true, in_app: true },
  events: {
    new_request: { email: true, in_app: true },
    status_change: { email: true, in_app: true },
    internal_note: { email: false, in_app: true },
  },
  request_types: {
    export: { email: true, in_app: true },
    rectify: { email: true, in_app: true },
    delete: { email: true, in_app: true },
  },
};

const EVENT_LABELS: Record<string, string> = {
  new_request: "Cerere nouă",
  status_change: "Schimbare status",
  internal_note: "Notă internă",
};

const TYPE_LABELS: Record<string, string> = {
  export: "Export date",
  rectify: "Rectificare date",
  delete: "Ștergere cont",
};

function AdminGdprNotificationsPage() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "gdpr_notification_settings")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setSettings({ ...DEFAULT_SETTINGS, ...(data.value as any) });
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: settings as any })
      .eq("key", "gdpr_notification_settings");
    setSaving(false);
    if (error) toast.error("Eroare la salvare");
    else toast.success("Setări salvate cu succes");
  };

  const toggleChannel = (channel: "email" | "in_app") => {
    setSettings((s) => ({
      ...s,
      channels: { ...s.channels, [channel]: !s.channels[channel] },
    }));
  };

  const toggleEvent = (event: string, channel: "email" | "in_app") => {
    setSettings((s) => ({
      ...s,
      events: {
        ...s.events,
        [event]: { ...s.events[event], [channel]: !s.events[event][channel] },
      },
    }));
  };

  const toggleType = (type: string, channel: "email" | "in_app") => {
    setSettings((s) => ({
      ...s,
      request_types: {
        ...s.request_types,
        [type]: { ...s.request_types[type], [channel]: !s.request_types[type][channel] },
      },
    }));
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Se încarcă…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-accent" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Setări notificări GDPR</h1>
            <p className="text-sm text-muted-foreground">Controlează când și cum se trimit notificările pentru cererile GDPR</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvează
        </button>
      </div>

      {/* Global channels */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5" /> Canale globale
        </h2>
        <p className="text-sm text-muted-foreground">Dezactivarea unui canal oprește complet notificările pe acel canal, indiferent de setările de mai jos.</p>
        <div className="flex flex-wrap gap-4">
          <ChannelToggle
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            enabled={settings.channels.email}
            onToggle={() => toggleChannel("email")}
          />
          <ChannelToggle
            icon={<Monitor className="h-4 w-4" />}
            label="In-app"
            enabled={settings.channels.in_app}
            onToggle={() => toggleChannel("in_app")}
          />
        </div>
      </div>

      {/* Per-event settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Pe tip de eveniment</h2>
        <p className="text-sm text-muted-foreground">Alege pe ce canal primești notificări pentru fiecare tip de eveniment GDPR.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-foreground">Eveniment</th>
                <th className="text-center py-2 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</div>
                </th>
                <th className="text-center py-2 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-center gap-1"><Monitor className="h-3.5 w-3.5" /> In-app</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(settings.events).map(([key, val]) => (
                <tr key={key} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium text-foreground">{EVENT_LABELS[key] ?? key}</td>
                  <td className="py-3 px-4 text-center">
                    <ToggleCheckbox
                      checked={val.email}
                      disabled={!settings.channels.email}
                      onChange={() => toggleEvent(key, "email")}
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <ToggleCheckbox
                      checked={val.in_app}
                      disabled={!settings.channels.in_app}
                      onChange={() => toggleEvent(key, "in_app")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per request type */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Pe tip de cerere</h2>
        <p className="text-sm text-muted-foreground">Poți dezactiva notificările pentru anumite tipuri de cereri GDPR.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium text-foreground">Tip cerere</th>
                <th className="text-center py-2 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</div>
                </th>
                <th className="text-center py-2 px-4 font-medium text-foreground">
                  <div className="flex items-center justify-center gap-1"><Monitor className="h-3.5 w-3.5" /> In-app</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(settings.request_types).map(([key, val]) => (
                <tr key={key} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium text-foreground">{TYPE_LABELS[key] ?? key}</td>
                  <td className="py-3 px-4 text-center">
                    <ToggleCheckbox
                      checked={val.email}
                      disabled={!settings.channels.email}
                      onChange={() => toggleType(key, "email")}
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <ToggleCheckbox
                      checked={val.in_app}
                      disabled={!settings.channels.in_app}
                      onChange={() => toggleType(key, "in_app")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
        <strong>Notă:</strong> Dacă un canal global este dezactivat, nicio notificare de acel tip nu va fi trimisă, chiar dacă este activată pe eveniment sau tip de cerere. Notificările in-app sunt înregistrate și în logul de audit.
      </div>
    </div>
  );
}

function ChannelToggle({ icon, label, enabled, onToggle }: { icon: React.ReactNode; label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition min-w-[140px] ${
        enabled
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300"
          : "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-300"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-red-500"}`} />
      {icon}
      {label}: {enabled ? "ACTIV" : "OPRIT"}
    </button>
  );
}

function ToggleCheckbox({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-9 h-5 rounded-full relative transition ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-accent" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
