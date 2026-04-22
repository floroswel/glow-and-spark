import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, TextArea, Toggle } from "@/components/admin/AdminSettingsEditor";

export const Route = createFileRoute("/admin/content/seo")({
  component: AdminSeo,
});

const defaults = {
  title_template: "{page} — Glow & Spark | Lumânări Artizanale Premium",
  meta_description: "Descoperă lumânări artizanale din ceară de soia, parfumate natural. Livrare rapidă în toată România.",
  og_site_name: "Glow & Spark",
  og_default_image: "",
  canonical_url: "https://glowandspark.ro",
  robots_txt: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout\nSitemap: https://glowandspark.ro/sitemap.xml",
  schema_org_name: "Glow & Spark",
  schema_org_type: "Organization",
  schema_org_logo: "",
  schema_org_phone: "+40753326405",
  schema_org_email: "contact@glowandspark.ro",
  schema_org_address: "România",
  google_verification: "",
  bing_verification: "",
  pinterest_verification: "",
  noindex_categories: false,
  noindex_tags: false,
  auto_sitemap: true,
};

function AdminSeo() {
  return (
    <AdminSettingsEditor settingsKey="seo_global" defaults={defaults} title="🔍 SEO Global">
      {(settings, update) => (
        <>
          <Section title="Meta Tags Globale">
            <Field label="Template titlu pagină">
              <TextInput value={settings.title_template} onChange={v => update("title_template", v)} />
            </Field>
            <Field label="Meta description global">
              <TextArea value={settings.meta_description} onChange={v => update("meta_description", v)} rows={3} />
            </Field>
            <Field label="OG Site Name">
              <TextInput value={settings.og_site_name} onChange={v => update("og_site_name", v)} />
            </Field>
            <Field label="OG Image URL default">
              <TextInput value={settings.og_default_image} onChange={v => update("og_default_image", v)} />
            </Field>
            <Field label="URL canonic principal">
              <TextInput value={settings.canonical_url} onChange={v => update("canonical_url", v)} />
            </Field>
          </Section>
          <Section title="Schema.org (JSON-LD)">
            <Field label="Nume organizație">
              <TextInput value={settings.schema_org_name} onChange={v => update("schema_org_name", v)} />
            </Field>
            <Field label="Tip">
              <TextInput value={settings.schema_org_type} onChange={v => update("schema_org_type", v)} />
            </Field>
            <Field label="Logo URL">
              <TextInput value={settings.schema_org_logo} onChange={v => update("schema_org_logo", v)} />
            </Field>
            <Field label="Telefon">
              <TextInput value={settings.schema_org_phone} onChange={v => update("schema_org_phone", v)} />
            </Field>
            <Field label="Email">
              <TextInput value={settings.schema_org_email} onChange={v => update("schema_org_email", v)} />
            </Field>
            <Field label="Adresă">
              <TextInput value={settings.schema_org_address} onChange={v => update("schema_org_address", v)} />
            </Field>
          </Section>
          <Section title="Verificări & Robots">
            <Field label="Google Verification">
              <TextInput value={settings.google_verification} onChange={v => update("google_verification", v)} />
            </Field>
            <Field label="Bing Verification">
              <TextInput value={settings.bing_verification} onChange={v => update("bing_verification", v)} />
            </Field>
            <Field label="Pinterest Verification">
              <TextInput value={settings.pinterest_verification} onChange={v => update("pinterest_verification", v)} />
            </Field>
            <Field label="robots.txt">
              <TextArea value={settings.robots_txt} onChange={v => update("robots_txt", v)} rows={6} />
            </Field>
            <Field label="Noindex categorii">
              <Toggle value={settings.noindex_categories} onChange={v => update("noindex_categories", v)} label="Nu indexa categoriile" />
            </Field>
            <Field label="Noindex tag-uri">
              <Toggle value={settings.noindex_tags} onChange={v => update("noindex_tags", v)} label="Nu indexa tag-urile" />
            </Field>
            <Field label="Generare sitemap automată">
              <Toggle value={settings.auto_sitemap} onChange={v => update("auto_sitemap", v)} label="Generare automată" />
            </Field>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
