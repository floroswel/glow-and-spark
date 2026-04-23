import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/politica-returnare")({
  head: () => ({
    meta: [
      { title: "Politică de Returnare — Mama Lucica" },
      { name: "description", content: "Politica de returnare conform OUG 34/2014. Ai dreptul de retragere în 14 zile calendaristice fără justificare." },
      { property: "og:title", content: "Politică de Returnare — Mama Lucica" },
      { property: "og:description", content: "Informații complete despre dreptul de retur și procedura de returnare." },
    ],
  }),
  component: PoliticaReturnarePage,
});

const sections = [
  {
    title: "Dreptul de retragere",
    content: `Conform OUG 34/2014 privind drepturile consumatorilor, aveți dreptul de a vă retrage din contractul de vânzare la distanță în termen de **14 zile calendaristice** de la data primirii produsului, fără a fi necesară justificarea deciziei și fără a suporta alte costuri decât cele de returnare.

Termenul de retragere expiră după 14 zile calendaristice de la data la care dumneavoastră sau o terță parte desemnată de dumneavoastră, alta decât transportatorul, intră în posesia fizică a produselor.

Pentru a vă exercita dreptul de retragere, trebuie să ne informați cu privire la decizia dumneavoastră de a vă retrage din contract printr-o declarație clară (de exemplu, o scrisoare trimisă prin poștă sau un e-mail).`,
  },
  {
    title: "Cum inițiezi returul",
    content: `Procesul de retur se desfășoară în 3 pași simpli:

**Pasul 1 — Contactează-ne**
Trimite-ne un e-mail la adresa noastră de contact sau completează formularul de contact de pe site, menționând numărul comenzii și produsul/produsele pe care dorești să le returnezi.

**Pasul 2 — Împachetează produsul**
Ambalează produsul în ambalajul original (dacă este posibil) sau într-un ambalaj adecvat care să asigure protecția produsului pe durata transportului. Include în colet o copie a facturii sau a confirmării comenzii.

**Pasul 3 — Trimite coletul**
Expediază coletul la adresa pe care ți-o comunicăm prin e-mail. Recomandam utilizarea unui serviciu de curierat cu confirmare de primire pentru a avea dovada trimiterii.`,
  },
  {
    title: "Produse excluse de la retur",
    content: `Conform art. 16 din OUG 34/2014, dreptul de retragere nu se aplică în cazul:

• **Produselor sigilate din motive de igienă sau de protecție a sănătății** care au fost desigilate după livrare (ex: produse cosmetice desigilate, articole de igienă personală).

• **Produselor personalizate sau fabricate la comandă** conform specificațiilor consumatorului (ex: produse cu gravură personalizată, compoziții realizate la cerere).

• **Produselor care, prin natura lor, nu pot fi returnate** din cauza deteriorării rapide sau expirării (ex: produse perisabile).`,
  },
  {
    title: "Termenul de rambursare",
    content: `Vă vom rambursa toate sumele primite ca plată, inclusiv costurile de livrare inițiale (cu excepția costurilor suplimentare generate de alegerea unui alt mod de livrare decât cel standard), **în cel mult 14 zile calendaristice** de la data la care primim produsele returnate sau dovada expedierii acestora.

Rambursarea se va efectua utilizând aceeași modalitate de plată folosită la tranzacția inițială, cu excepția cazului în care ați acceptat în mod expres o altă modalitate de rambursare.

Putem amâna rambursarea până la primirea produselor înapoi sau până la primirea unei dovezi conform căreia ați trimis produsele, în funcție de care situație survine prima.`,
  },
  {
    title: "Costul returului",
    content: `**Costul direct al returnării produselor este suportat de consumator**, cu excepția cazurilor în care:

• Produsul prezintă **defecte de fabricație** sau nu corespunde descrierii de pe site — în acest caz, costul returului este suportat integral de noi.

• Am livrat un **produs greșit** față de cel comandat.

• Produsul a fost **deteriorat în timpul transportului** — vă rugăm să refuzați coletul la primire sau să ne contactați în termen de 48 de ore.

Costul estimativ al returului prin curier este de 15-25 RON, în funcție de dimensiunea coletului și serviciul de curierat ales.`,
  },
  {
    title: "Starea produsului la retur",
    content: `Pentru ca returul să fie acceptat, produsul trebuie să îndeplinească următoarele condiții:

• Să fie **neutilizat** și în aceeași stare în care a fost primit.

• Să fie returnat în **ambalajul original**, complet, inclusiv accesoriile, etichetele și documentele care l-au însoțit.

• Să nu prezinte **urme de utilizare**, zgârieturi, deteriorări sau modificări.

• Produsele care au fost utilizate sau deteriorate de consumator pot fi supuse unei **reduceri proporționale a sumei rambursate**, corespunzătoare deprecierii bunurilor.

Vă recomandăm să fotografiați produsul înainte de expediere pentru a evita eventualele neînțelegeri.`,
  },
];

function PoliticaReturnarePage() {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true });

  const toggle = (idx: number) =>
    setOpenItems((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Politică de returnare</span>
        </nav>

        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-bold text-foreground">Politică de Returnare</h1>
          <p className="mt-2 text-muted-foreground">
            Conform OUG 34/2014 privind drepturile consumatorilor
          </p>
        </div>

        <div className="space-y-1">
          {sections.map((section, i) => {
            const isOpen = !!openItems[i];
            return (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-foreground hover:bg-secondary/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold">
                      {i + 1}
                    </span>
                    {section.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 duration-200 whitespace-pre-line">
                    {section.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="text-foreground font-semibold">{part}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-semibold text-foreground">Ai întrebări despre retur?</p>
          <p className="mt-1 text-sm text-muted-foreground">Echipa noastră îți răspunde în maxim 24h.</p>
          <Link
            to="/contact"
            className="mt-4 inline-block rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition"
          >
            Contactează-ne
          </Link>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
