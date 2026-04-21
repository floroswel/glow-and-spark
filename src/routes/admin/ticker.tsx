import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, ColorInput, NumberInput } from "@/components/admin/AdminSettingsEditor";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/ticker")({
  component: AdminTicker,
});

const defaults = {
  show: true,
  messages: [
    "🔥 COD REDUCERE: VARA10 — 10% EXTRA LA TOATE LUMÂNĂRILE!",
    "🚚 LIVRARE GRATUITĂ PESTE 200 RON",
    "⚡ STOC LIMITAT — COMANDĂ ACUM!",
  ],
  background_color: "#222222",
  text_color: "#ffffff",
  speed: 25,
};

function AdminTicker() {
  return (
    <AdminSettingsEditor settingsKey="ticker" defaults={defaults} title="Editor Ticker Banner">
      {(s, u) => (
        <>
          <Section title="Setări Ticker">
            <div className="space-y-4">
              <Toggle value={s.show} onChange={(v) => u("show", v)} label="Afișează ticker" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Culoare fundal"><ColorInput value={s.background_color} onChange={(v) => u("background_color", v)} /></Field>
                <Field label="Culoare text"><ColorInput value={s.text_color} onChange={(v) => u("text_color", v)} /></Field>
                <Field label="Viteză (secunde)">
                  <input type="range" min="10" max="60" value={s.speed} onChange={(e) => u("speed", Number(e.target.value))} className="w-full" />
                  <span className="text-xs text-muted-foreground">{s.speed}s</span>
                </Field>
              </div>
            </div>
          </Section>
          <Section title="Mesaje">
            <div className="space-y-3">
              {(s.messages || []).map((msg: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={msg}
                    onChange={(e) => {
                      const msgs = [...s.messages];
                      msgs[i] = e.target.value;
                      u("messages", msgs);
                    }}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => u("messages", s.messages.filter((_: any, j: number) => j !== i))}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => u("messages", [...(s.messages || []), "Mesaj nou"])}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent/80"
              >
                <Plus className="h-4 w-4" /> Adaugă mesaj
              </button>
            </div>
          </Section>
          <Section title="Preview">
            <div className="overflow-hidden rounded-lg py-2" style={{ backgroundColor: s.background_color, color: s.text_color }}>
              <div className="whitespace-nowrap text-sm font-medium" style={{ animation: `marquee ${s.speed}s linear infinite` }}>
                {(s.messages || []).join("   \u00A0\u00A0\u00A0   ")}
              </div>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
