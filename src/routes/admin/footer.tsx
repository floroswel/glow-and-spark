import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle, ColorInput } from "@/components/admin/AdminSettingsEditor";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/footer")({
  component: AdminFooter,
});

const defaults = {
  show: true,
  show_newsletter: true,
  col1_show: true,
  col1_title: "Informații utile",
  col1_links: [
    { label: "Despre noi", url: "/page/despre-noi" },
    { label: "Termeni și condiții", url: "/page/termeni-si-conditii" },
    { label: "Politica de Confidențialitate", url: "/page/politica-confidentialitate" },
    { label: "Politica Cookie-uri", url: "/politica-cookies" },
    { label: "Contact", url: "/contact" },
  ],
  col2_show: true,
  col2_title: "Clienți",
  col2_links: [
    { label: "Transport și Livrare", url: "/page/transport-livrare" },
    { label: "Metode de plată", url: "/page/metode-plata" },
    { label: "Politica de Retur", url: "/page/politica-retur" },
    { label: "Garanția Produselor", url: "/page/garantie" },
    { label: "ANPC", url: "https://anpc.ro/ce-este-anpc/" },
    { label: "SOL", url: "https://ec.europa.eu/consumers/odr" },
  ],
  col3_show: true,
  col3_title: "Date comerciale",
  col3_links: [],
  col4_show: true,
  col4_title: "Suport clienți",
  show_delivery_badges: true,
  delivery_badges: ["DPD", "Fan Courier", "Cargus"],
  show_payment_icons: true,
  payment_icons: ["VISA", "MASTERCARD", "RAMBURS"],
  copyright_text: "© 2026 SC Vomix Genius SRL — Toate drepturile rezervate",
  company_name: "SC Vomix Genius SRL",
  reg_com: "",
  cui: "43025661",
  company_address: "Strada Constructorilor Nr 39, sat Voievoda, comuna Furculești",
  company_city: "Furculești",
  company_county: "Teleorman",
  company_postal_code: "147148",
  company_iban: "",
  company_bank: "",
  show_anpc_badges: true,
  show_sol_badge: true,
  show_legal_disclaimer: true,
  legal_disclaimer: "Prețurile includ TVA. Imaginile produselor sunt cu titlu informativ și pot diferi de realitate.",
  show_company_documents: true,
  company_documents: [],
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

function DocumentsEditor({ docs, onChange }: { docs: { label: string; url: string }[]; onChange: (v: any[]) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (index: number, file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `doc_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("company-documents").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("company-documents").getPublicUrl(fileName);
      const updated = [...docs];
      updated[index] = { ...updated[index], url: publicUrl };
      onChange(updated);
      toast.success("Document încărcat!");
    } catch (err: any) {
      toast.error("Eroare la încărcare: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Încarcă documente PDF (Certificat CAEN, CUI, Certificat Constatator, etc.) care vor fi vizibile în footer.</p>
      {(docs || []).map((doc, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <input value={doc.label} onChange={(e) => { const d = [...docs]; d[i] = { ...d[i], label: e.target.value }; onChange(d); }} placeholder="Nume document" className="w-48 rounded border border-border px-2 py-1 text-sm" />
          <input value={doc.url} onChange={(e) => { const d = [...docs]; d[i] = { ...d[i], url: e.target.value }; onChange(d); }} placeholder="URL document" className="flex-1 min-w-[200px] rounded border border-border px-2 py-1 text-sm" />
          <label className="cursor-pointer text-primary hover:underline text-sm flex items-center gap-1">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "..." : "Încarcă PDF"}
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(i, e.target.files[0]); }} />
          </label>
          <button onClick={() => onChange(docs.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...(docs || []), { label: "Document nou", url: "" }])} className="flex items-center gap-1 text-sm text-accent"><Plus className="h-4 w-4" /> Adaugă document</button>
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
              <Toggle value={s.show_newsletter} onChange={(v) => u("show_newsletter", v)} label="Afișează secțiunea Newsletter" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Fundal footer"><ColorInput value={s.footer_bg} onChange={(v) => u("footer_bg", v)} /></Field>
                <Field label="Fundal bottom"><ColorInput value={s.footer_bottom_bg} onChange={(v) => u("footer_bottom_bg", v)} /></Field>
                <Field label="Culoare text"><ColorInput value={s.footer_text_color} onChange={(v) => u("footer_text_color", v)} /></Field>
              </div>
              <Field label="Copyright"><TextInput value={s.copyright_text} onChange={(v) => u("copyright_text", v)} /></Field>
            </div>
          </Section>

          {/* Company Data */}
          <Section title="Date comerciale firmă">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Aceste date vor apărea în footer la secțiunea „Date comerciale". Sunt obligatorii conform legislației române.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Denumire societate"><TextInput value={s.company_name} onChange={(v) => u("company_name", v)} /></Field>
                <Field label="CUI"><TextInput value={s.cui} onChange={(v) => u("cui", v)} /></Field>
                <Field label="Nr. Reg. Comerțului"><TextInput value={s.reg_com} onChange={(v) => u("reg_com", v)} /></Field>
                <Field label="Adresă"><TextInput value={s.company_address} onChange={(v) => u("company_address", v)} /></Field>
                <Field label="Localitate"><TextInput value={s.company_city} onChange={(v) => u("company_city", v)} /></Field>
                <Field label="Județ"><TextInput value={s.company_county} onChange={(v) => u("company_county", v)} /></Field>
                <Field label="Cod poștal"><TextInput value={s.company_postal_code} onChange={(v) => u("company_postal_code", v)} /></Field>
                <Field label="IBAN (opțional)"><TextInput value={s.company_iban} onChange={(v) => u("company_iban", v)} /></Field>
                <Field label="Banca (opțional)"><TextInput value={s.company_bank} onChange={(v) => u("company_bank", v)} /></Field>
              </div>
            </div>
          </Section>

          {/* Company Documents */}
          <Section title="Documente firmă (PDF)">
            <div className="space-y-4">
              <Toggle value={s.show_company_documents} onChange={(v) => u("show_company_documents", v)} label="Afișează linkuri documente în footer" />
              <DocumentsEditor docs={s.company_documents} onChange={(v) => u("company_documents", v)} />
            </div>
          </Section>

          {/* Link Columns */}
          {[
            { key: "1", title: s.col1_title },
            { key: "2", title: s.col2_title },
          ].map((col) => (
            <Section key={col.key} title={`Coloana ${col.key}: ${col.title}`}>
              <div className="space-y-4">
                <Toggle value={s[`col${col.key}_show`]} onChange={(v) => u(`col${col.key}_show`, v)} label="Afișează coloana" />
                <Field label="Titlu coloană"><TextInput value={s[`col${col.key}_title`]} onChange={(v) => u(`col${col.key}_title`, v)} /></Field>
                <Field label="Linkuri"><LinksEditor links={s[`col${col.key}_links`]} onChange={(v) => u(`col${col.key}_links`, v)} /></Field>
              </div>
            </Section>
          ))}

          <Section title={`Coloana 3: ${s.col3_title}`}>
            <div className="space-y-4">
              <Toggle value={s.col3_show} onChange={(v) => u("col3_show", v)} label="Afișează coloana" />
              <Field label="Titlu"><TextInput value={s.col3_title} onChange={(v) => u("col3_title", v)} /></Field>
              <p className="text-xs text-muted-foreground">Această coloană afișează automat datele comerciale și documentele de mai sus.</p>
            </div>
          </Section>

          <Section title={`Coloana 4: ${s.col4_title}`}>
            <div className="space-y-4">
              <Toggle value={s.col4_show} onChange={(v) => u("col4_show", v)} label="Afișează coloana" />
              <Field label="Titlu"><TextInput value={s.col4_title} onChange={(v) => u("col4_title", v)} /></Field>
              <p className="text-xs text-muted-foreground">Datele de contact se preiau din setările generale (telefon, email, program).</p>
            </div>
          </Section>

          {/* Payment & Badges */}
          <Section title="Iconuri Plată">
            <div className="space-y-4">
              <Toggle value={s.show_payment_icons} onChange={(v) => u("show_payment_icons", v)} label="Afișează iconuri plată" />
              <BadgesEditor items={s.payment_icons} onChange={(v) => u("payment_icons", v)} />
            </div>
          </Section>

          {/* ANPC / SOL */}
          <Section title="Badge-uri ANPC & SOL">
            <div className="space-y-4">
              <Toggle value={s.show_anpc_badges} onChange={(v) => u("show_anpc_badges", v)} label="Afișează badge ANPC SAL" />
              <Toggle value={s.show_sol_badge} onChange={(v) => u("show_sol_badge", v)} label="Afișează badge SOL (Soluționare Online Litigii)" />
              <p className="text-xs text-muted-foreground">Obligatoriu conform legislației române pentru magazine online.</p>
            </div>
          </Section>

          {/* Legal disclaimer */}
          <Section title="Disclaimer legal">
            <div className="space-y-4">
              <Toggle value={s.show_legal_disclaimer} onChange={(v) => u("show_legal_disclaimer", v)} label="Afișează disclaimer în footer" />
              <Field label="Text disclaimer"><TextInput value={s.legal_disclaimer} onChange={(v) => u("legal_disclaimer", v)} /></Field>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
