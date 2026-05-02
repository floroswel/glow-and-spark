import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight, Mail, Phone, MapPin, Clock, Send, Building2,
  FileText, ExternalLink, Shield, CreditCard, Landmark,
} from "lucide-react";
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
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  /* ── Company data — same sources as SiteFooter ── */
  const companyName = general?.company_name || footer?.company_name || "SC Vomix Genius SRL";
  const cui = general?.company_cui || footer?.cui || "43025661";
  const regCom = general?.reg_com || footer?.reg_com || "J2020000459343";
  const companyAddress = general?.company_address || footer?.company_address || "Strada Constructorilor Nr 39, sat Voievoda, comuna Furculești";
  const companyCity = general?.company_city || footer?.company_city || "Furculești";
  const companyCounty = general?.company_county || footer?.company_county || "Teleorman";
  const companyPostalCode = general?.company_postal_code || footer?.company_postal_code || "147148";
  const companyIban = general?.invoice_iban || footer?.company_iban || "RO50BTRLRONCRT0566231601";
  const companyBank = general?.invoice_bank || footer?.company_bank || "BANCA TRANSILVANIA S.A.";
  const emailAddr = general?.contact_email || "contact@mamalucica.ro";
  const phone = general?.contact_phone || "+40 753 326 405";
  const schedule = general?.contact_schedule || "Luni - Vineri: 09:00 - 17:00";
  const fullAddress = [companyAddress, companyCity, companyCounty, companyPostalCode].filter(Boolean).join(", ");

  /* CAEN codes */
  const caenCodes: string[] = general?.company_caen
    ? general.company_caen.split(/[\n,]+/).map((c: string) => c.trim()).filter(Boolean)
    : [];

  /* Company documents */
  const companyDocs: { name: string; url: string }[] = footer?.company_documents || [];
  const showDocs = footer?.show_company_documents && companyDocs.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Completează câmpurile obligatorii");
      return;
    }
    if (!consent) {
      toast.error("Trebuie să accepți termenii pentru a trimite mesajul.");
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
      setConsent(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Contact</span>
        </nav>

        {/* ═══════ COMPANY IDENTIFICATION SECTION ═══════ */}
        <div className="mb-10 rounded-2xl border border-border bg-card overflow-hidden">
          {/* Header bar */}
          <div className="bg-foreground/5 border-b border-border px-6 py-4 md:px-8">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-accent" />
              <h1 className="font-heading text-xl font-bold text-foreground">Identificare Comerciant</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Conform Ordinului ANPC 225/2023 privind informarea consumatorilor
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left — Company details */}
              <div className="space-y-5">
                {/* Company name */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Denumire societate</p>
                  <p className="text-lg font-semibold text-foreground">{companyName}</p>
                </div>

                {/* CUI + RC row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">CUI</p>
                    <p className="text-sm font-medium text-foreground">{cui}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Reg. Com.</p>
                    <p className="text-sm font-medium text-foreground">{regCom}</p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Sediu social
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{fullAddress}</p>
                </div>

                {/* IBAN + Bank */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date bancare</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="text-sm font-mono font-medium text-foreground">{companyIban}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Banca</p>
                    <p className="text-sm font-medium text-foreground">{companyBank}</p>
                  </div>
                </div>
              </div>

              {/* Right — Contact + hours + CAEN */}
              <div className="space-y-5">
                {/* Contact details */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact direct</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-accent/10">
                      <Mail className="h-4 w-4 text-accent" />
                    </div>
                    <a href={`mailto:${emailAddr}`} className="text-sm font-medium text-accent hover:underline">
                      {emailAddr}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-accent/10">
                      <Phone className="h-4 w-4 text-accent" />
                    </div>
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sm font-medium text-accent hover:underline">
                      {phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-accent/10">
                      <Clock className="h-4 w-4 text-accent" />
                    </div>
                    <p className="text-sm text-foreground">{schedule}</p>
                  </div>
                </div>

                {/* CAEN codes */}
                {caenCodes.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Coduri CAEN</p>
                    <ul className="space-y-1">
                      {caenCodes.map((code, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                          {code}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Company documents */}
                {showDocs && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> Documente
                    </p>
                    <ul className="space-y-2">
                      {companyDocs.map((doc, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-accent shrink-0" />
                          <span className="text-foreground">{doc.name}</span>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-accent hover:underline inline-flex items-center gap-1"
                          >
                            VEZI <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ANPC + SOL links */}
                <div className="space-y-2 pt-2">
                  <a
                    href="https://anpc.ro/ce-este-sal/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    ANPC — Soluționarea Alternativă a Litigiilor
                  </a>
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    SOL — Platformă Online Soluționare Litigii
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ CONTACT FORM ═══════ */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">Trimite-ne un mesaj</h2>
            <p className="mt-2 text-muted-foreground">Ai o întrebare? Completează formularul și îți răspundem în maxim 24h.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nume *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
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
                  className={inputCls}
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
                  className={inputCls}
                  placeholder="07xx xxx xxx"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Subiect</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className={inputCls}
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
                className={`${inputCls} resize-none`}
                placeholder="Scrie mesajul tău aici..."
                maxLength={5000}
                required
              />
            </div>

            {/* GDPR / Terms consent */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border accent-accent shrink-0"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Am citit și sunt de acord cu{" "}
                <Link to="/termeni-si-conditii" className="text-accent hover:underline">Termenii și Condițiile</Link>
                {" "}și{" "}
                <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link>
                . Datele sunt prelucrate conform GDPR.
              </span>
            </label>

            <button
              type="submit"
              disabled={sending || !consent}
              className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? "Se trimite..." : "Trimite mesajul"}
            </button>
          </form>

          {/* FAQ nudge */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Verifică{" "}
            <Link to="/faq" className="text-accent hover:underline font-medium">pagina FAQ</Link>
            {" "}pentru răspunsuri rapide la cele mai frecvente întrebări.
          </div>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
