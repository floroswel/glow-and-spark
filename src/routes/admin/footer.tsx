import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, ColorInput } from "@/components/admin/AdminSettingsEditor";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/footer")({
  component: AdminFooter,
});

const defaults = {
  show: true,
  col1_show: true,
  col1_title: "Informații utile",
  col1_links: [
    { label: "Cum cumpăr", url: "/page/cum-cumpar" },
    { label: "Politica de livrare", url: "/page/livrare" },
    { label: "Termeni și condiții", url: "/page/termeni" },
    { label: "GDPR", url: "/page/gdpr" },
  ],
  col2_show: true,
  col2_title: "Contul meu",
  col2_links: [
    { label: "Datele mele", url: "/account" },
    { label: "Comenzi", url: "/account/orders" },
    { label: "Lista de dorințe", url: "/account/favorites" },
  ],
  col3_show: true,
  col3_title: "Magazinul nostru",
  col3_links: [
    { label: "Despre noi", url: "/page/despre-noi" },
    { label: "Blog", url: "/blog" },
    { label: "Contact", url: "/contact" },
  ],
  col4_show: true,
  col4_title: "Suport clienți",
  show_delivery_badges: true,
  delivery_badges: ["DPD", "Fan Courier", "Cargus"],
  show_payment_icons: true,
  payment_icons: ["VISA", "MASTERCARD", "PAYPAL", "RAMBURS"],
  copyright_text: "© 2026 GLOW & SPARK — Toate drepturile rezervate",
  cui: "RO12345678",
  footer_bg: "#1f1f1f",
  footer_bottom_bg: "#181818",
  footer_text_color: "#d4d4d4",
};

function LinksEditor({ links, onChange }: { links: any[]; onChange: (v: any[]) => void }) {
  return (
    <div className="space-y-2">
      {(links || []).map((link: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <input value={link.label} onChange={(e) => { const l = [...links]; l[i] = { ...l[i], label: e.target.value }; onChange(l); }} placeholder="Label" className="w-40 rounded border border-border px-2 py-1 text-sm" />
          <input value={link.url} onChange={(e) => { const l = [...links]; l[i] = { ...l[i], url: e.target.value }; onChange(l); }} placeholder="URL" className="flex-1 rounded border border-border px-2 py-1 text-sm" />
          <button onClick={() => onChange(links.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...(links || []), { label: "Link nou", url: "/" }])} className="flex items-center gap-1 text-sm text-accent"><Plus className="h-4 w-4" /> Adaugă</button>
    </div>
  );
}

function BadgesEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {(items || []).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={(e) => { const arr = [...items]; arr[i] = e.target.value; onChange(arr); }} className="flex-1 rounded border border-border px-2 py-1 text-sm" />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...(items || []), "Nou"])} className="flex items-center gap-1 text-sm text-accent"><Plus className="h-4 w-4" /> Adaugă</button>
    </div>
  );
}

function AdminFooter() {
  return (
    <AdminSettingsEditor settingsKey="footer" defaults={defaults} title="Editor Footer">
      {(s, u) => (
        <>
          <Section title="General">
            <div className="space-y-4">
              <Toggle value={s.show} onChange={(v) => u("show", v)} label="Afișează footer" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Fundal footer"><ColorInput value={s.footer_bg} onChange={(v) => u("footer_bg", v)} /></Field>
                <Field label="Fundal bottom"><ColorInput value={s.footer_bottom_bg} onChange={(v) => u("footer_bottom_bg", v)} /></Field>
                <Field label="Culoare text"><ColorInput value={s.footer_text_color} onChange={(v) => u("footer_text_color", v)} /></Field>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Copyright"><TextInput value={s.copyright_text} onChange={(v) => u("copyright_text", v)} /></Field>
                <Field label="CUI"><TextInput value={s.cui} onChange={(v) => u("cui", v)} /></Field>
              </div>
            </div>
          </Section>

          {[
            { key: "1", title: s.col1_title },
            { key: "2", title: s.col2_title },
            { key: "3", title: s.col3_title },
          ].map((col) => (
            <Section key={col.key} title={`Coloana ${col.key}: ${col.title}`}>
              <div className="space-y-4">
                <Toggle value={s[`col${col.key}_show`]} onChange={(v) => u(`col${col.key}_show`, v)} label="Afișează coloana" />
                <Field label="Titlu coloană"><TextInput value={s[`col${col.key}_title`]} onChange={(v) => u(`col${col.key}_title`, v)} /></Field>
                <Field label="Linkuri"><LinksEditor links={s[`col${col.key}_links`]} onChange={(v) => u(`col${col.key}_links`, v)} /></Field>
              </div>
            </Section>
          ))}

          <Section title="Coloana 4: Suport">
            <div className="space-y-4">
              <Toggle value={s.col4_show} onChange={(v) => u("col4_show", v)} label="Afișează coloana" />
              <Field label="Titlu"><TextInput value={s.col4_title} onChange={(v) => u("col4_title", v)} /></Field>
            </div>
          </Section>

          <Section title="Badge-uri Livrare">
            <div className="space-y-4">
              <Toggle value={s.show_delivery_badges} onChange={(v) => u("show_delivery_badges", v)} label="Afișează badge-uri livrare" />
              <BadgesEditor items={s.delivery_badges} onChange={(v) => u("delivery_badges", v)} />
            </div>
          </Section>

          <Section title="Iconuri Plată">
            <div className="space-y-4">
              <Toggle value={s.show_payment_icons} onChange={(v) => u("show_payment_icons", v)} label="Afișează iconuri plată" />
              <BadgesEditor items={s.payment_icons} onChange={(v) => u("payment_icons", v)} />
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
