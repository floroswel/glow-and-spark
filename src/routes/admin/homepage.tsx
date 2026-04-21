import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, TextArea, Toggle, NumberInput } from "@/components/admin/AdminSettingsEditor";

export const Route = createFileRoute("/admin/homepage")({
  component: AdminHomepage,
});

const defaults = {
  show_hero: true,
  hero_title: "Ritmul lent al\nmomentelor calme",
  hero_subtitle: "Ceară artizanală din soia pură • Esențe sintetice rare",
  hero_cta_text: "Descoperă Colecția",
  hero_cta_url: "/catalog",
  hero_image_url: "",
  hero_overlay_opacity: 0.6,
  show_products: true,
  products_title: "Preferatele clienților",
  products_subtitle: "Fiecare lumânare este turnată manual, insuflând atmosferă și caracter în spațiul tău.",
  show_collection_banners: true,
  collection_label: "COLECȚIA DE VARĂ",
  collection_title: "Colecția Nuit Étoilé",
  collection_image: "",
  collection_url: "/catalog",
  clearance_title: "Stocuri limitate",
  clearance_price: "De la 19 RON",
  clearance_url: "/catalog?sort=discount",
  show_story: true,
  story_label: "Povestea noastră",
  story_title: "Ceea ce facem diferit este\nmetoda și atenția cu care creăm",
  story_text: "Folosim doar ceară pură, uleiuri esențiale premium și fitile din lemn natural.",
  story_image_url: "",
  story_cta_text: "AFLĂ MAI MULT →",
  story_cta_url: "/page/despre-noi",
  show_how_to_buy: true,
  step1: "Alege produsele",
  step2: "Finalizează comanda",
  step3: "Primește comanda",
};

function AdminHomepage() {
  return (
    <AdminSettingsEditor settingsKey="homepage" defaults={defaults} title="Editor Homepage">
      {(s, u) => (
        <>
          <Section title="Secțiunea Hero">
            <div className="space-y-4">
              <Toggle value={s.show_hero} onChange={(v) => u("show_hero", v)} label="Afișează hero" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Subtitlu"><TextInput value={s.hero_subtitle} onChange={(v) => u("hero_subtitle", v)} /></Field>
                <Field label="Text buton CTA"><TextInput value={s.hero_cta_text} onChange={(v) => u("hero_cta_text", v)} /></Field>
                <Field label="URL buton CTA"><TextInput value={s.hero_cta_url} onChange={(v) => u("hero_cta_url", v)} /></Field>
                <Field label="URL imagine hero"><TextInput value={s.hero_image_url} onChange={(v) => u("hero_image_url", v)} /></Field>
              </div>
              <Field label="Titlu hero (\\n pentru linie nouă)">
                <TextArea value={s.hero_title} onChange={(v) => u("hero_title", v)} rows={2} />
              </Field>
              <Field label="Opacitate overlay">
                <input type="range" min="0" max="1" step="0.05" value={s.hero_overlay_opacity} onChange={(e) => u("hero_overlay_opacity", Number(e.target.value))} className="w-full" />
                <span className="text-xs text-muted-foreground">{s.hero_overlay_opacity}</span>
              </Field>
            </div>
          </Section>

          <Section title="Secțiunea Produse">
            <div className="space-y-4">
              <Toggle value={s.show_products} onChange={(v) => u("show_products", v)} label="Afișează produse" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Titlu secțiune"><TextInput value={s.products_title} onChange={(v) => u("products_title", v)} /></Field>
              </div>
              <Field label="Subtitlu"><TextArea value={s.products_subtitle} onChange={(v) => u("products_subtitle", v)} rows={2} /></Field>
            </div>
          </Section>

          <Section title="Bannere Colecție">
            <div className="space-y-4">
              <Toggle value={s.show_collection_banners} onChange={(v) => u("show_collection_banners", v)} label="Afișează bannere" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Label colecție"><TextInput value={s.collection_label} onChange={(v) => u("collection_label", v)} /></Field>
                <Field label="Titlu colecție"><TextInput value={s.collection_title} onChange={(v) => u("collection_title", v)} /></Field>
                <Field label="URL imagine colecție"><TextInput value={s.collection_image} onChange={(v) => u("collection_image", v)} /></Field>
                <Field label="URL link colecție"><TextInput value={s.collection_url} onChange={(v) => u("collection_url", v)} /></Field>
                <Field label="Titlu lichidare"><TextInput value={s.clearance_title} onChange={(v) => u("clearance_title", v)} /></Field>
                <Field label="Preț lichidare"><TextInput value={s.clearance_price} onChange={(v) => u("clearance_price", v)} /></Field>
                <Field label="URL lichidare"><TextInput value={s.clearance_url} onChange={(v) => u("clearance_url", v)} /></Field>
              </div>
            </div>
          </Section>

          <Section title="Povestea Noastră">
            <div className="space-y-4">
              <Toggle value={s.show_story} onChange={(v) => u("show_story", v)} label="Afișează secțiunea" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Label"><TextInput value={s.story_label} onChange={(v) => u("story_label", v)} /></Field>
                <Field label="Text buton"><TextInput value={s.story_cta_text} onChange={(v) => u("story_cta_text", v)} /></Field>
                <Field label="URL buton"><TextInput value={s.story_cta_url} onChange={(v) => u("story_cta_url", v)} /></Field>
                <Field label="URL imagine"><TextInput value={s.story_image_url} onChange={(v) => u("story_image_url", v)} /></Field>
              </div>
              <Field label="Titlu (\\n pentru linie nouă)"><TextArea value={s.story_title} onChange={(v) => u("story_title", v)} rows={2} /></Field>
              <Field label="Text"><TextArea value={s.story_text} onChange={(v) => u("story_text", v)} rows={3} /></Field>
            </div>
          </Section>

          <Section title="Cum Cumperi">
            <div className="space-y-4">
              <Toggle value={s.show_how_to_buy} onChange={(v) => u("show_how_to_buy", v)} label="Afișează secțiunea" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Pas 1"><TextInput value={s.step1} onChange={(v) => u("step1", v)} /></Field>
                <Field label="Pas 2"><TextInput value={s.step2} onChange={(v) => u("step2", v)} /></Field>
                <Field label="Pas 3"><TextInput value={s.step3} onChange={(v) => u("step3", v)} /></Field>
              </div>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
