import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, ColorInput, NumberInput } from "@/components/admin/AdminSettingsEditor";

export const Route = createFileRoute("/admin/popup")({
  component: AdminPopup,
});

const defaults = {
  show: true,
  delay_seconds: 5,
  title: "10% REDUCERE",
  subtitle: "LA PRIMA COMANDĂ",
  body_text: "Abonează-te la newsletter și primești cod de reducere.",
  btn_text: "VREAU REDUCEREA",
  btn_color: "#f97316",
  dismiss_text: "Nu, mulțumesc",
  discount_code: "WELCOME10",
};

function AdminPopup() {
  return (
    <AdminSettingsEditor settingsKey="popup" defaults={defaults} title="Editor Popup Newsletter">
      {(s, u) => (
        <>
          <Section title="Setări Popup">
            <div className="space-y-4">
              <Toggle value={s.show} onChange={(v) => u("show", v)} label="Popup activ" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Delay afișare (secunde)"><NumberInput value={s.delay_seconds} onChange={(v) => u("delay_seconds", v)} min={1} max={60} /></Field>
                <Field label="Cod reducere"><TextInput value={s.discount_code} onChange={(v) => u("discount_code", v)} /></Field>
              </div>
            </div>
          </Section>
          <Section title="Conținut">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Titlu"><TextInput value={s.title} onChange={(v) => u("title", v)} /></Field>
              <Field label="Subtitlu"><TextInput value={s.subtitle} onChange={(v) => u("subtitle", v)} /></Field>
              <Field label="Text body"><TextInput value={s.body_text} onChange={(v) => u("body_text", v)} /></Field>
              <Field label="Text buton"><TextInput value={s.btn_text} onChange={(v) => u("btn_text", v)} /></Field>
              <Field label="Culoare buton"><ColorInput value={s.btn_color} onChange={(v) => u("btn_color", v)} /></Field>
              <Field label="Text dismiss"><TextInput value={s.dismiss_text} onChange={(v) => u("dismiss_text", v)} /></Field>
            </div>
          </Section>
          <Section title="Preview">
            <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
              <div className="mb-4 text-5xl">🕯️</div>
              <h3 className="font-heading text-2xl font-bold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm font-medium" style={{ color: s.btn_color }}>{s.subtitle}</p>
              <p className="mt-4 text-sm text-muted-foreground">{s.body_text}</p>
              <div className="mt-4 rounded-lg py-3 text-sm font-bold text-white" style={{ backgroundColor: s.btn_color }}>
                {s.btn_text}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{s.dismiss_text}</p>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
