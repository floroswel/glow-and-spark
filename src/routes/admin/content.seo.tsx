import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, TextArea, Toggle } from "@/components/admin/AdminSettingsEditor";
import { Search, Globe, FileText } from "lucide-react";

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
    <AdminSettingsEditor settingsKey="seo_global" defaults={defaults} title="🔍 SEO Global" description="Configurare SEO la nivel de site">
      <Section title="Meta Tags Globale" icon={<Globe className="h-4 w-4" />}>
        <Field label="Template titlu pagină" description="Folosește {page} ca placeholder">
          <TextInput name="title_template" />
        </Field>
        <Field label="Meta description global"><TextArea name="meta_description" rows={3} /></Field>
        <Field label="OG Site Name"><TextInput name="og_site_name" /></Field>
        <Field label="OG Image URL default"><TextInput name="og_default_image" /></Field>
        <Field label="URL canonic principal"><TextInput name="canonical_url" /></Field>
      </Section>
      <Section title="Schema.org (JSON-LD)" icon={<FileText className="h-4 w-4" />}>
        <Field label="Nume organizație"><TextInput name="schema_org_name" /></Field>
        <Field label="Tip"><TextInput name="schema_org_type" /></Field>
        <Field label="Logo URL"><TextInput name="schema_org_logo" /></Field>
        <Field label="Telefon"><TextInput name="schema_org_phone" /></Field>
        <Field label="Email"><TextInput name="schema_org_email" /></Field>
        <Field label="Adresă"><TextInput name="schema_org_address" /></Field>
      </Section>
      <Section title="Verificări & Robots" icon={<Search className="h-4 w-4" />}>
        <Field label="Google Verification"><TextInput name="google_verification" /></Field>
        <Field label="Bing Verification"><TextInput name="bing_verification" /></Field>
        <Field label="Pinterest Verification"><TextInput name="pinterest_verification" /></Field>
        <Field label="robots.txt"><TextArea name="robots_txt" rows={6} /></Field>
        <Field label="Noindex categorii"><Toggle name="noindex_categories" /></Field>
        <Field label="Noindex tag-uri"><Toggle name="noindex_tags" /></Field>
        <Field label="Generare sitemap automată"><Toggle name="auto_sitemap" /></Field>
      </Section>
    </AdminSettingsEditor>
  );
}
