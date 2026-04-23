import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Mail, Phone, MapPin, Clock, Send, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lumini.ro" },
      { name: "description", content: "Contactează-ne pentru orice întrebare. Răspundem în maxim 24h." },
      { property: "og:title", content: "Contact — Lumini.ro" },
      { property: "og:description", content: "Contactează-ne pentru orice întrebare despre produsele noastre." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { general } = useSiteSettings();
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
      toast.success("Mesajul a fost trimis! Îți vom răspunde în cel mai scurt timp.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }
  };

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

          {/* Info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <h2 className="font-heading text-xl font-bold text-foreground">Informații de contact</h2>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{general?.contact_email || "contact@lumini.ro"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Telefon</p>
                  <p className="text-sm text-muted-foreground">{general?.contact_phone || "0770 123 456"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Adresă</p>
                  <p className="text-sm text-muted-foreground">{general?.address || "București, România"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Program</p>
                  <p className="text-sm text-muted-foreground">Luni - Vineri: 09:00 - 18:00</p>
                  <p className="text-sm text-muted-foreground">Sâmbătă: 10:00 - 14:00</p>
                </div>
              </div>
              {(general?.company_name || general?.company_cui || general?.company_caen) && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Date firmă</p>
                    {general?.company_name && <p className="text-sm text-muted-foreground">{general.company_name}</p>}
                    {general?.company_cui && <p className="text-sm text-muted-foreground">CUI: {general.company_cui}</p>}
                    {general?.reg_com && <p className="text-sm text-muted-foreground">Reg. Com.: {general.reg_com}</p>}
                    {general?.company_caen && (
                      <div className="mt-1">
                        <p className="text-xs font-medium text-muted-foreground">Coduri CAEN:</p>
                        <p className="text-sm text-muted-foreground">{general.company_caen}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
