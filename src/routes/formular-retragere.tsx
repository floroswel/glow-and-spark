import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Printer, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LegalPageShell, DraftBanner } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight } from "lucide-react";

const LAST_UPDATE = "2026-05-02";

export const Route = createFileRoute("/formular-retragere")({
  head: () => ({
    meta: [
      { title: "Formular de Retragere — Mama Lucica" },
      { name: "description", content: "Formular-tip de retragere din contract conform legislației privind drepturile consumatorilor. Completează online sau tipărește." },
      { property: "og:title", content: "Formular de Retragere — Mama Lucica" },
      { property: "og:description", content: "Formular standard de retragere din contractul de vânzare la distanță." },
    ],
  }),
  component: FormularRetragerePage,
});

function FormularRetragerePage() {
  const C = useCompanyInfo();
  const [form, setForm] = useState({
    customerName: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    orderNumber: "",
    orderDate: "",
    receivedDate: "",
    products: "",
    reason: "",
  });
  const [sending, setSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerEmail.trim() || !form.orderNumber.trim() || !form.products.trim()) {
      toast.error("Completează câmpurile obligatorii (nume, e-mail, nr. comandă, produse).");
      return;
    }

    setSending(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("support_tickets").insert({
        customer_name: form.customerName.trim().slice(0, 200),
        customer_email: form.customerEmail.trim().slice(0, 255),
        customer_phone: form.customerPhone.trim().slice(0, 20) || null,
        subject: `Formular retragere — Comanda ${form.orderNumber.trim().slice(0, 50)}`,
        description: [
          `FORMULAR DE RETRAGERE`,
          `Către: ${C.name}`,
          `---`,
          `Nume client: ${form.customerName}`,
          `Adresă: ${form.customerAddress}`,
          `E-mail: ${form.customerEmail}`,
          `Telefon: ${form.customerPhone}`,
          `Nr. comandă: ${form.orderNumber}`,
          `Data comandă: ${form.orderDate}`,
          `Data primire: ${form.receivedDate}`,
          `Produse returnate: ${form.products}`,
          `Motiv (opțional): ${form.reason}`,
          `---`,
          `Subsemnatul/a declar că mă retrag din contractul de vânzare a produselor menționate mai sus.`,
          `Data: ${new Date().toLocaleDateString("ro-RO")}`,
        ].join("\n").slice(0, 5000),
        category: "return",
        priority: "high",
      });

      if (error) throw error;
      toast.success("Formularul a fost trimis cu succes! Vei primi confirmare pe e-mail în maxim 24h.");
      setForm({ customerName: "", customerAddress: "", customerEmail: "", customerPhone: "", orderNumber: "", orderDate: "", receivedDate: "", products: "", reason: "" });
    } catch {
      toast.error("Eroare la trimitere. Încearcă din nou sau contactează-ne direct.");
    } finally {
      setSending(false);
    }
  };

  const fieldClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/politica-returnare" className="hover:text-foreground">Politica de returnare</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Formular de retragere</span>
        </nav>

        <DraftBanner />

        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Formular de Retragere</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Formular-tip de retragere din contract conform legislației privind drepturile consumatorilor
          </p>
          <p className="text-center text-xs text-muted-foreground mt-1">Ultima actualizare: {LAST_UPDATE}</p>
        </div>

        {/* Printable legal text */}
        <div ref={printRef} className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 print:border-0 print:shadow-none print:p-0">
          <div className="text-xs text-muted-foreground mb-4 print:text-black">
            <p className="font-semibold text-foreground print:text-black">FORMULAR DE RETRAGERE</p>
            <p className="italic">(Acest formular se completează și se transmite doar în cazul în care doriți să vă retrageți din contract)</p>
          </div>

          <div className="text-sm text-muted-foreground space-y-3 print:text-black">
            <p>
              <strong className="text-foreground print:text-black">Către:</strong><br />
              {C.name}<br />
              Sediu: {C.fullAddress}<br />
              CUI: {C.cui} · Reg. Com.: {C.regCom}<br />
              E-mail: {C.email} · Tel: {C.phone}
            </p>

            <p>
              Subsemnatul/a notific prin prezenta retragerea mea din contractul de vânzare a următoarelor produse:
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nume și prenume *</label>
                <Input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Ion Popescu" className={fieldClass} required maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">E-mail *</label>
                <Input name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} placeholder="ion@exemplu.ro" className={fieldClass} required maxLength={255} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Telefon</label>
                <Input name="customerPhone" type="tel" value={form.customerPhone} onChange={handleChange} placeholder="+40 7XX XXX XXX" className={fieldClass} maxLength={20} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Nr. comandă *</label>
                <Input name="orderNumber" value={form.orderNumber} onChange={handleChange} placeholder="ML12345" className={fieldClass} required maxLength={50} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Adresă completă</label>
              <Input name="customerAddress" value={form.customerAddress} onChange={handleChange} placeholder="Strada, nr., localitate, județ, cod poștal" className={fieldClass} maxLength={500} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Data plasării comenzii</label>
                <Input name="orderDate" type="date" value={form.orderDate} onChange={handleChange} className={fieldClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Data primirii produsului</label>
                <Input name="receivedDate" type="date" value={form.receivedDate} onChange={handleChange} className={fieldClass} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Produsele returnate *</label>
              <textarea
                name="products"
                value={form.products}
                onChange={handleChange}
                placeholder="Ex: Lumânare Lavandă x2, Lumânare Vanilie x1"
                className={`${fieldClass} min-h-[80px] resize-y`}
                required
                maxLength={2000}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Motiv retragere (opțional)</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Nu este obligatoriu să specificați motivul."
                className={`${fieldClass} min-h-[60px] resize-y`}
                maxLength={1000}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-4">
              <p>
                Prin trimiterea acestui formular, declar că mă retrag din contractul de vânzare a produselor 
                menționate mai sus, în conformitate cu legislația privind drepturile consumatorilor.
              </p>
              <p className="mt-2">
                Datele personale furnizate vor fi prelucrate conform{" "}
                <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politicii de Confidențialitate</Link>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" disabled={sending} className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Se trimite..." : "Trimite formularul online"}
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint} className="print:hidden">
                <Printer className="mr-2 h-4 w-4" />
                Tipărește formularul
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-6 text-sm text-muted-foreground space-y-3">
          <h2 className="font-heading font-semibold text-foreground">Instrucțiuni</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Completează formularul online și trimite-l direct, sau tipărește-l și trimite-l prin e-mail/poștă.</li>
            <li>Termenul de retragere este de <strong className="text-foreground">14 zile calendaristice</strong> de la primirea produsului.</li>
            <li>Formularul trebuie trimis <strong className="text-foreground">înainte</strong> de expirarea termenului de 14 zile.</li>
            <li>După trimiterea formularului, ai obligația de a returna produsele în cel mult 14 zile.</li>
            <li>Detalii complete în <Link to="/politica-returnare" className="text-accent hover:underline">Politica de Returnare</Link>.</li>
          </ul>
        </div>

        <div className="mt-8 text-xs text-muted-foreground text-center space-y-1 border-t border-border pt-6">
          <p><strong className="text-foreground">{C.name}</strong> · CUI: {C.cui} · Reg. Com.: {C.regCom}</p>
          <p>{C.fullAddress}</p>
          <p>E-mail: {C.email} · Tel: {C.phone}</p>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
