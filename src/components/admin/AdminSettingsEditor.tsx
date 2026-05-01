import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshSiteSettings } from "@/hooks/useSiteSettings";
import { Save, Check } from "lucide-react";

interface Props {
  settingsKey: string;
  defaults: Record<string, any>;
  children: (settings: Record<string, any>, update: (key: string, value: any) => void) => React.ReactNode;
  title: string;
}

export function AdminSettingsEditor({ settingsKey, defaults, children, title }: Props) {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshSiteSettings = useRefreshSiteSettings();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .eq("key", settingsKey)
      .single()
      .then(({ data }) => {
        if (data?.value) setSettings({ ...defaults, ...(data.value as any) });
        setLoading(false);
      });
  }, [settingsKey]);

  const handleSave = async () => {
    await supabase
      .from("site_settings")
      .upsert(
        { key: settingsKey, value: settings as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    // Invalidate site-wide cache so changes appear immediately
    refreshSiteSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: any) => setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div className="text-muted-foreground">Se încarcă...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Salvat!" : "Salvează"}
        </button>
      </div>
      <div className="mt-6 space-y-6">{children(settings, update)}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
    />
  );
}

export function TextArea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
    />
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-border"
      />
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-lg border border-border px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none"
      />
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-accent" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

export function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-24 rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
    />
  );
}
