import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Check, Palette } from "lucide-react";

export const Route = createFileRoute("/admin/theme")({
  component: AdminTheme,
});

const defaultTheme = {
  primary_color: "#3d2c1f",
  accent_color: "#c4873a",
  background_color: "#f7f5f2",
  foreground_color: "#2d1f14",
  card_color: "#ffffff",
  secondary_color: "#f0ece6",
  muted_color: "#ebe7e0",
  destructive_color: "#c53030",
  border_color: "#e0dbd4",
  heading_font: "Playfair Display",
  body_font: "Inter",
  border_radius: "0.5",
  hero_overlay_opacity: "0.6",
  product_card_shadow: "sm",
  button_style: "rounded",
  badge_style: "rounded",
};

const fontOptions = [
  "Playfair Display", "Inter", "Lora", "Poppins", "Montserrat", "Cormorant Garamond",
  "DM Sans", "Outfit", "Libre Baskerville", "Raleway", "Merriweather", "Open Sans",
  "Roboto", "Nunito", "Source Serif 4",
];

function AdminTheme() {
  const [theme, setTheme] = useState(defaultTheme);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("key", "theme").single().then(({ data }) => {
      if (data?.value) setTheme({ ...defaultTheme, ...(data.value as any) });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await supabase.from("site_settings").upsert({ key: "theme", value: theme as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: string) => setTheme((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div className="text-muted-foreground">Se încarcă...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Temă & Design</h1>
        <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Salvat!" : "Salvează"}
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {/* Colors */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Palette className="h-5 w-5 text-accent" /> Culori</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[
              { key: "primary_color", label: "Principal" },
              { key: "accent_color", label: "Accent" },
              { key: "background_color", label: "Fundal" },
              { key: "foreground_color", label: "Text" },
              { key: "card_color", label: "Card" },
              { key: "secondary_color", label: "Secundar" },
              { key: "muted_color", label: "Muted" },
              { key: "border_color", label: "Border" },
              { key: "destructive_color", label: "Eroare" },
            ].map((c) => (
              <div key={c.key}>
                <label className="text-xs font-medium text-muted-foreground">{c.label}</label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="color" value={(theme as any)[c.key]} onChange={(e) => update(c.key, e.target.value)} className="h-10 w-10 cursor-pointer rounded-lg border border-border" />
                  <input value={(theme as any)[c.key]} onChange={(e) => update(c.key, e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Tipografie</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Font Titluri</label>
              <select value={theme.heading_font} onChange={(e) => update("heading_font", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
                {fontOptions.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <p className="mt-2 text-2xl" style={{ fontFamily: theme.heading_font }}>Preview titlu</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Font Corp</label>
              <select value={theme.body_font} onChange={(e) => update("body_font", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
                {fontOptions.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <p className="mt-2 text-sm" style={{ fontFamily: theme.body_font }}>Preview text body din magazin</p>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Layout & Stil</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Border Radius (rem)</label>
              <input type="range" min="0" max="2" step="0.125" value={theme.border_radius} onChange={(e) => update("border_radius", e.target.value)} className="mt-2 w-full accent-accent" />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>Drept</span>
                <span>{theme.border_radius}rem</span>
                <span>Rotund</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Stil Butoane</label>
              <select value={theme.button_style} onChange={(e) => update("button_style", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
                <option value="rounded">Rotunjit</option>
                <option value="pill">Pill</option>
                <option value="square">Drept</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Umbră Carduri</label>
              <select value={theme.product_card_shadow} onChange={(e) => update("product_card_shadow", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
                <option value="none">Fără</option>
                <option value="sm">Subtilă</option>
                <option value="md">Medie</option>
                <option value="lg">Mare</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Preview</h3>
          <div className="rounded-xl p-6" style={{ backgroundColor: theme.background_color, color: theme.foreground_color }}>
            <h2 className="text-2xl font-bold" style={{ fontFamily: theme.heading_font, color: theme.foreground_color }}>
              Exemplu Titlu
            </h2>
            <p className="mt-2 text-sm" style={{ fontFamily: theme.body_font }}>
              Aceasta este o previzualizare a temei tale. Culorile, fonturile și stilurile sunt aplicate în timp real.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                style={{
                  backgroundColor: theme.accent_color,
                  color: "#fff",
                  borderRadius: theme.button_style === "pill" ? "999px" : theme.button_style === "square" ? "0" : `${theme.border_radius}rem`,
                  padding: "8px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Buton Principal
              </button>
              <button
                style={{
                  backgroundColor: theme.secondary_color,
                  color: theme.foreground_color,
                  borderRadius: theme.button_style === "pill" ? "999px" : theme.button_style === "square" ? "0" : `${theme.border_radius}rem`,
                  padding: "8px 20px",
                  fontSize: "14px",
                  border: `1px solid ${theme.border_color}`,
                }}
              >
                Buton Secundar
              </button>
            </div>
            <div
              className="mt-4 p-4"
              style={{
                backgroundColor: theme.card_color,
                borderRadius: `${theme.border_radius}rem`,
                border: `1px solid ${theme.border_color}`,
                boxShadow: theme.product_card_shadow === "none" ? "none" : theme.product_card_shadow === "sm" ? "0 1px 3px rgba(0,0,0,0.1)" : theme.product_card_shadow === "md" ? "0 4px 6px rgba(0,0,0,0.1)" : "0 10px 15px rgba(0,0,0,0.1)",
              }}
            >
              <p style={{ fontFamily: theme.heading_font, fontWeight: 700 }}>Card Produs</p>
              <p className="text-sm mt-1" style={{ fontFamily: theme.body_font, opacity: 0.6 }}>Descriere scurtă produs</p>
              <p className="mt-2 font-bold" style={{ color: theme.accent_color }}>149 RON</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
