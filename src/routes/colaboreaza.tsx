import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Handshake, TrendingUp, ShieldCheck, Package, Truck, HeadphonesIcon, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/colaboreaza")({
  component: ColaboreazaPage,
  head: () => ({
    meta: [
      { title: "Colaborează cu noi | Mama Lucica" },
      { name: "description", content: "Devino partener sau revânzător Mama Lucica. Trimite o cerere de colaborare și alătură-te rețelei noastre." },
    ],
  }),
});

const BENEFITS = [
  { icon: TrendingUp, title: "Marje competitive", desc: "Beneficiezi de prețuri speciale de revânzător și marje atractive." },
  { icon: Package, title: "Produse de calitate", desc: "Produse naturale, testate și apreciate de mii de clienți." },
  { icon: Truck, title: "Livrare rapidă", desc: "Sistem logistic eficient cu livrare directă din depozitul nostru." },
  { icon: ShieldCheck, title: "Suport dedicat", desc: "Echipă dedicată partenerilor — te ajutăm cu materiale, prețuri și strategie." },
  { icon: HeadphonesIcon, title: "Training & materiale", desc: "Primești materiale de marketing, poze de produs și suport la vânzare." },
  { icon: Handshake, title: "Parteneriat pe termen lung", desc: "Construim relații de afaceri durabile, bazate pe încredere și transparență." },
];

function ColaboreazaPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company_name: "", city: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Completează cel puțin numele și emailul.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Adresa de email nu este validă.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("partner_applications" as any).insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      city: form.city.trim() || null,
      message: form.message.trim() || null,
    } as any);
    setSending(false);
    if (error) {
      toast.error("Eroare la trimitere. Încearcă din nou.");
      return;
    }
    setSent(true);
    toast.success("Cererea a fost trimisă!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-accent/10 via-background to-accent/5 py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Handshake className="h-4 w-4" /> Parteneriat
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Colaborează cu noi
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vrei să vinzi produsele Mama Lucica în magazinul tău fizic sau online?
              Trimite-ne o cerere și te contactăm în cel mai scurt timp.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              De ce să devii partener Mama Lucica?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-xl border border-border bg-background p-6 space-y-3 hover:shadow-md transition">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              Cum funcționează?
            </h2>
            <div className="space-y-6">
              {[
                { step: "1", title: "Trimite cererea", desc: "Completează formularul de mai jos cu datele tale de contact și detalii despre afacerea ta." },
                { step: "2", title: "Analiză și contact", desc: "Echipa noastră analizează cererea și te contactează telefonic sau pe email în 1-3 zile lucrătoare." },
                { step: "3", title: "Stabilim condițiile", desc: "Discutăm condițiile de colaborare: prețuri, volume, livrare, materiale de marketing." },
                { step: "4", title: "Începem colaborarea", desc: "Plasezi prima comandă și începi să vinzi produse Mama Lucica!" },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="py-16 bg-card" id="formular">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
              Trimite cererea de colaborare
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Nu este nevoie de cont. Completează formularul și te contactăm noi.
            </p>

            {sent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="font-heading text-xl font-bold text-foreground">Cerere trimisă cu succes!</h3>
                <p className="text-muted-foreground">
                  Mulțumim pentru interes! Echipa noastră va analiza cererea și te va contacta în 1-3 zile lucrătoare.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Nume complet *</label>
                    <input
                      value={form.name}
                      onChange={set("name")}
                      required
                      maxLength={100}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                      placeholder="Ion Popescu"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      required
                      maxLength={150}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                      placeholder="email@exemplu.ro"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Telefon</label>
                    <input
                      value={form.phone}
                      onChange={set("phone")}
                      maxLength={20}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                      placeholder="07xx xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Oraș</label>
                    <input
                      value={form.city}
                      onChange={set("city")}
                      maxLength={80}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                      placeholder="București"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Numele firmei (opțional)</label>
                  <input
                    value={form.company_name}
                    onChange={set("company_name")}
                    maxLength={150}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                    placeholder="SC Exemplu SRL"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Mesaj / Detalii despre colaborare</label>
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                    placeholder="Descrie pe scurt cum vrei să colaborăm: magazin fizic, online, volum estimat..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-accent text-accent-foreground rounded-lg px-6 py-3 font-bold text-sm hover:bg-accent/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? "Se trimite..." : "Trimite cererea"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* CTA affiliate */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <p className="text-muted-foreground">
              Ești persoană fizică și vrei să câștigi comision? Înscrie-te în{" "}
              <a href="/afiliat" className="text-accent font-semibold hover:underline">Programul de Afiliere</a>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
