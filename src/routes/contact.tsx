import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Mail, Phone, MapPin, Clock, Send, Building2, FileText, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Mama Lucica" },
      { name: "description", content: "Contactează echipa Mama Lucica pentru orice întrebare. Răspundem în maxim 24h. Telefon, email sau WhatsApp." },
      { property: "og:title", content: "Contact — Mama Lucica" },
      { property: "og:description", content: "Contactează-ne pentru orice întrebare despre produsele noastre." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { general, footer } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Completează câmpurile obligatorii");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      customer_name: form.name.trim().slice(0, 200),
      customer_email: form.email.trim().slice(0, 255),
      customer_phone: form.phone.trim().slice(0, 20) || null,
      subject: form.subject.trim().slice(0, 300) || "Mesaj de contact",
      description: form.message.trim().slice(0, 5000),
      category: "contact",
      priority: "medium",
    });
    setSending(false);
    if (error) {
      toast.error("Eroare la trimitere. Încearcă din nou.");
    } else {
      // Fire-and-forget email notification (admin + customer confirmation)
      supabase.functions.invoke("send-email", {
        body: {
          type: "contact_form",
          customer_name: form.name,
          customer_email: form.email,
          subject: form.subject,
          message: form.message,
          phone: form.phone || null,
        },
      }).catch(() => {});
      toast.success("Mesajul a fost trimis! Îți vom răspunde în cel mai scurt timp.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }
  };

  // Parse CAEN codes - support "code - description" format, one per line or comma-separated
  const caenCodes: string[] = general?.company_caen
    ? general.company_caen
        .split(/[\n,]+/)
        .map((c: string) => c.trim())
        .filter(Boolean)
    : [];

  // Company documents from footer settings
  const companyDocs: { name: string; url: string }[] = footer?.company_documents || [];
  const showDocs = footer?.show_company_documents && companyDocs.length > 0;

  const hasCompanyInfo = general?.company_name || general?.company_cui || general?.reg_com || caenCodes.length > 0 || showDocs;

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Contact</span>
        </nav>

        {/* ANPC / Legal compliance section - inspired by bitmi.ro */}
        {hasCompanyInfo && (
          <div className="mb-10 rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conform Ordinului ANPC 225/2023 privind informarea consumatorilor de către operatorii economici care desfășoară activitate în mediul online, vă punem la dispoziție următoarele documente și informații:
            </p>

            {/* Company documents - certificates */}
            {showDocs && (
              <div className="mt-5">
                <ul className="space-y-2">
                  {companyDocs.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-accent shrink-0" />
                      <span className="text-foreground">{doc.name}, click</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-accent hover:underline inline-flex items-center gap-1"
                      >
                        AICI
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CAEN Codes */}
            {caenCodes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">Coduri CAEN:</h3>
                <ul className="space-y-1.5">
                  {caenCodes.map((code, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      {code}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Company data summary */}
            {(general?.company_name || general?.company_cui) && (
              <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                {general?.company_name && <span>{general.company_name}</span>}
                {general?.company_cui && <span>CUI: {general.company_cui}</span>}
                {general?.reg_com && <span>Reg. Com.: {general.reg_com}</span>}
                {general?.company_address && <span>{general.company_address}</span>}
                {general?.company_city && <span>{general.company_city}</span>}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Form */}
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Contactează-ne</h1>
            <p className="mt-2 text-muted-foreground">Ai o întrebare? Completează formularul și îți răspundem în maxim 24h.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Nume *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Numele tău"
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="email@exemplu.ro"
                    maxLength={255}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Telefon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="07xx xxx xxx"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Subiect</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Selectează subiectul</option>
                    <option value="Întrebare produs">Întrebare produs</option>
                    <option value="Comandă existentă">Comandă existentă</option>
                    <option value="Retur / Schimb">Retur / Schimb</option>
                    <option value="Colaborare">Colaborare</option>
                    <option value="Altele">Altele</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Mesaj *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="Scrie mesajul tău aici..."
                  maxLength={5000}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? "Se trimite..." : "Trimite mesajul"}
              </button>
            </form>
          </div>

          {/* Info sidebar */}
          <div className="space-y-6">
            {/* Support info */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-1">Suport clienți</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {general?.contact_schedule || "De Luni până Vineri în intervalul orar 09:00 - 17:30"}. Timp maxim de răspuns pentru email: 1 zi lucrătoare.
              </p>
            </div>

            {/* Contact details */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <h2 className="font-heading text-xl font-bold text-foreground">Informații de contact</h2>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <a href={`mailto:${general?.contact_email || "contact@mamalucica.ro"}`} className="text-sm text-accent hover:underline">
                    {general?.contact_email || "contact@mamalucica.ro"}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Telefon</p>
                  <a href={`tel:${general?.contact_phone || ""}`} className="text-sm text-accent hover:underline">
                    {general?.contact_phone || "+40 753 326 405"}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Adresă</p>
                  <p className="text-sm text-muted-foreground">{general?.contact_address || "Str. Constructorilor Nr 39, sat Voievoda, comuna Furculești, jud. Teleorman"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Program</p>
                  <p className="text-sm text-muted-foreground">{general?.contact_schedule || "Luni - Vineri: 09:00 - 18:00"}</p>
                </div>
              </div>
            </div>

            {/* Company info card */}
            {(general?.company_name || general?.company_cui) && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Date societate</h3>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {general?.company_name && <p className="font-medium text-foreground">{general.company_name}</p>}
                  {general?.company_cui && <p>CUI: {general.company_cui}</p>}
                  {general?.reg_com && <p>Reg. Com.: {general.reg_com}</p>}
                  {general?.company_address && <p>{general.company_address}</p>}
                  {general?.company_city && <p>{general.company_city}</p>}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-3">Întrebări frecvente</h3>
              <p className="text-sm text-muted-foreground">
                Verifică{" "}
                <Link to="/faq" className="text-accent hover:underline">pagina FAQ</Link>
                {" "}pentru răspunsuri rapide la cele mai frecvente întrebări.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
