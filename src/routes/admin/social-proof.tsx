import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, NumberInput } from "@/components/admin/AdminSettingsEditor";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/social-proof")({
  component: AdminSocialProof,
});

const defaults = {
  show: true,
  delay_first: 8,
  interval: 30,
  display_duration: 5,
  badge_text: "✔ Verificat",
  emoji: "🕯️",
  names: [
    "Ion din București",
    "Maria din Cluj",
    "Andrei din Timișoara",
    "Elena din Iași",
    "Mihai din Brașov",
    "Ana din Constanța",
    "George din Sibiu",
    "Ioana din Oradea",
    "Vlad din Craiova",
  ],
  products: [
    "Lumânare Vanilla...",
    "Set Cadou Trandafir...",
    "Lumânare Cedru...",
    "Diffuzor Lavandă...",
    "Lumânare Pilar Santal...",
    "Set Premium Rose...",
  ],
  use_real_orders: false,
};

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {(items || []).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => { const arr = [...items]; arr[i] = e.target.value; onChange(arr); }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...(items || []), ""])} className="flex items-center gap-1 text-sm text-accent hover:text-accent/80">
        <Plus className="h-4 w-4" /> Adaugă
      </button>
    </div>
  );
}

function AdminSocialProof() {
  return (
    <AdminSettingsEditor settingsKey="social_proof" defaults={defaults} title="Social Proof (Notificări Cumpărături)">
      {(s, u) => (
        <>
          <Section title="⚙️ Setări Generale">
            <div className="space-y-4">
              <Toggle value={s.show} onChange={(v) => u("show", v)} label="Activează notificări Social Proof" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Delay inițial (secunde)"><NumberInput value={s.delay_first} onChange={(v) => u("delay_first", v)} min={1} max={120} /></Field>
                <Field label="Interval (secunde)"><NumberInput value={s.interval} onChange={(v) => u("interval", v)} min={10} max={300} /></Field>
                <Field label="Durată afișare (secunde)"><NumberInput value={s.display_duration} onChange={(v) => u("display_duration", v)} min={2} max={30} /></Field>
                <Field label="Emoji"><TextInput value={s.emoji} onChange={(v) => u("emoji", v)} /></Field>
              </div>
              <Field label="Text badge"><TextInput value={s.badge_text} onChange={(v) => u("badge_text", v)} /></Field>
              <Toggle value={s.use_real_orders} onChange={(v) => u("use_real_orders", v)} label="Folosește comenzi reale (în loc de date simulate)" />
            </div>
          </Section>

          {!s.use_real_orders && (
            <>
              <Section title="👤 Nume Clienți (simulate)">
                <ListEditor items={s.names || []} onChange={(v) => u("names", v)} placeholder="Ex: Ana din București" />
              </Section>

              <Section title="📦 Produse (simulate)">
                <ListEditor items={s.products || []} onChange={(v) => u("products", v)} placeholder="Ex: Lumânare Vanilla Premium" />
              </Section>
            </>
          )}

          <Section title="👁️ Preview">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xl max-w-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg">
                {s.emoji || "🕯️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Acum 3 minute</p>
                <p className="text-sm font-semibold text-foreground truncate">{(s.names || [])[0] || "Ion din București"}</p>
                <p className="text-xs text-muted-foreground truncate">a cumpărat: {(s.products || [])[0] || "Lumânare Vanilla"}</p>
              </div>
              <span className="shrink-0 rounded bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">{s.badge_text || "✔ Verificat"}</span>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
