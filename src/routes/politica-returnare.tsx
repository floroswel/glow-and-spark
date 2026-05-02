import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LegalPageShell } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

const LAST_UPDATE = "2026-05-02";

export const Route = createFileRoute("/politica-returnare")({
  head: () => ({
    meta: [
      { title: "Politică de Returnare — Mama Lucica" },
      { name: "description", content: "Politica de returnare Mama Lucica — retur în 14 zile calendaristice, fără justificare, conform legislației privind drepturile consumatorilor." },
      { property: "og:title", content: "Politică de Returnare — Mama Lucica" },
      { property: "og:description", content: "Informații complete despre dreptul de retur și procedura de returnare." },
    ],
  }),
  component: PoliticaReturnarePage,
});

function PoliticaReturnarePage() {
  const C = useCompanyInfo();
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true });

  const toggle = (idx: number) =>
    setOpenItems((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const sections = [
    {
      title: "1. Dreptul de retragere",
      content: `Conform legislației privind drepturile consumatorilor, aveți dreptul de a vă retrage din contractul de vânzare la distanță în termen de **14 zile calendaristice** de la data primirii produsului, fără a fi necesară justificarea deciziei și fără a suporta alte costuri decât cele de returnare.

Termenul de retragere expiră după 14 zile calendaristice de la data la care dumneavoastră sau o terță parte desemnată de dumneavoastră, alta decât transportatorul, intră în posesia fizică a produselor.

Pentru a vă exercita dreptul de retragere, trebuie să ne informați cu privire la decizia dumneavoastră printr-o declarație clară:
• **E-mail:** ${C.email}
• **Telefon:** ${C.phone}
• **Poștă:** ${C.name}, ${C.fullAddress}

De asemenea, puteți utiliza **formularul-tip de retragere** disponibil pe pagina dedicată: [Formular de retragere](/formular-retragere).`,
    },
    {
      title: "2. Cum inițiezi returul",
      content: `Procesul de retur se desfășoară în 3 pași simpli:

**Pasul 1 — Contactează-ne**
Trimite un e-mail la **${C.email}** sau sună la **${C.phone}**, menționând:
• Numărul comenzii
• Produsul/produsele pe care dorești să le returnezi
• Motivul returului (opțional)

**Pasul 2 — Împachetează produsul**
Ambalează produsul în ambalajul original (dacă este posibil) sau într-un ambalaj adecvat care să asigure protecția pe durata transportului. Include în colet:
• O copie a facturii sau confirmării comenzii
• Formularul de retragere completat (descarcabil de pe site)

**Pasul 3 — Trimite coletul**
Expediază coletul la adresa:
**${C.name}**
**${C.fullAddress}**

Recomandăm utilizarea unui serviciu de curierat cu confirmare de primire pentru a avea dovada trimiterii.`,
    },
    {
      title: "3. Produse excluse de la retur",
      content: `[PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați lista de excepții aplicabile produselor dumneavoastră conform legislației]

Dreptul de retragere NU se aplică în cazul:
• **Produselor sigilate din motive de igienă sau de protecție a sănătății** care au fost desigilate după livrare.
• **Produselor personalizate sau fabricate la comandă** conform specificațiilor consumatorului.
• **Produselor care, prin natura lor, nu pot fi returnate** din cauza deteriorării rapide sau expirării.
• **Produselor care au fost amestecate inseparabil** cu alte bunuri după livrare.`,
    },
    {
      title: "4. Starea produsului la retur",
      content: `Pentru ca returul să fie acceptat, produsul trebuie să îndeplinească următoarele condiții:
• Să fie **neutilizat** și în aceeași stare în care a fost primit.
• Să fie returnat în **ambalajul original**, complet, inclusiv accesoriile, etichetele și documentele care l-au însoțit.
• Să nu prezinte **urme de utilizare**, zgârieturi, deteriorări sau modificări.

**Important:** Produsele care au fost utilizate sau deteriorate de consumator pot fi supuse unei **reduceri proporționale a sumei rambursate**, corespunzătoare deprecierii bunurilor, conform legislației aplicabile.

Vă recomandăm să fotografiați produsul înainte de expediere pentru a evita eventualele neînțelegeri.`,
    },
    {
      title: "5. Termenul de rambursare",
      content: `Vă vom rambursa toate sumele primite ca plată, inclusiv costurile de livrare inițiale (cu excepția costurilor suplimentare generate de alegerea unui alt mod de livrare decât cel standard oferit de noi), **în cel mult 14 zile calendaristice** de la data la care primim produsele returnate sau dovada expedierii acestora.

Rambursarea se va efectua utilizând **aceeași modalitate de plată** folosită la tranzacția inițială, cu excepția cazului în care ați acceptat în mod expres o altă modalitate de rambursare, fără a suporta costuri suplimentare.

Putem amâna rambursarea până la primirea produselor înapoi sau până la primirea unei dovezi conform căreia ați trimis produsele, în funcție de care situație survine prima.`,
    },
    {
      title: "6. Costul returului",
      content: `**Costul direct al returnării produselor este suportat de consumator**, cu excepția cazurilor în care:

• Produsul prezintă **defecte de fabricație** sau nu corespunde descrierii de pe site — costul returului este suportat integral de ${C.name}.
• Am livrat un **produs greșit** față de cel comandat.
• Produsul a fost **deteriorat în timpul transportului** — vă rugăm să refuzați coletul la primire sau să ne contactați în termen de 48 de ore cu fotografii ale deteriorării.

[PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați costul estimativ al returului]`,
    },
    {
      title: "7. Produse neconforme / garanție",
      content: `Dacă produsul primit prezintă defecte de fabricație sau nu corespunde descrierii de pe site, aveți dreptul la:

• **Înlocuirea produsului** cu unul conform
• **Repararea gratuită** (dacă este posibil)
• **Rambursarea integrală** a prețului, inclusiv costurile de livrare și retur

Garanția legală de conformitate se aplică conform legislației în vigoare.
[PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați durata garanției legale aplicabile]

Pentru sesizări privind produse neconforme, contactați-ne la **${C.email}** cu:
• Fotografii ale produsului și defectului
• Numărul comenzii și data achiziției`,
    },
    {
      title: "8. Reclamații ANPC",
      content: `Dacă nu sunteți mulțumit de modul în care a fost soluționat returul, puteți depune o reclamație la:

**Autoritatea Națională pentru Protecția Consumatorilor (ANPC)**
Website: https://anpc.ro
Telefon InfoCons: 0219615 (linia consumatorului)

**Platforma SOL (Soluționare Online a Litigiilor)**
Consumatorii pot utiliza platforma europeană:
https://ec.europa.eu/consumers/odr

**Date identificare vânzător:**
${C.name}
CUI: ${C.cui}
Reg. Com.: ${C.regCom}
Sediu: ${C.fullAddress}
E-mail: ${C.email}
Telefon: ${C.phone}`,
    },
  ];

  return (
    <LegalPageShell title="Politică de Returnare" breadcrumb="Politică de returnare" lastUpdate={LAST_UPDATE}>
      <p className="text-center text-muted-foreground -mt-4 mb-6">
        Conform legislației privind drepturile consumatorilor
      </p>

      {/* Prominent withdrawal form CTA — near top per legal best practice */}
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-3 not-prose -mt-2 mb-6">
        <div>
          <p className="font-semibold text-foreground text-sm">Dorești să returnezi un produs?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completează formularul de retragere online — 14 zile calendaristice de la primire.</p>
        </div>
        <Link
          to="/formular-retragere"
          className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
        >
          Formular de retragere
        </Link>
      </div>

      <div className="space-y-1 not-prose">
        {sections.map((section, i) => {
          const isOpen = !!openItems[i];
          return (
            <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-foreground hover:bg-secondary/50 transition"
              >
                <span>{section.title}</span>
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
                      <span key={j}>
                        {part.split(/\[([^\]]+)\]\(([^)]+)\)/g).map((seg, k) =>
                          k % 3 === 1 ? (
                            <Link key={k} to={part.split(/\[([^\]]+)\]\(([^)]+)\)/g)[k + 1]} className="text-accent underline hover:text-accent/80 transition-colors">
                              {seg}
                            </Link>
                          ) : k % 3 === 2 ? null : (
                            <span key={k}>{seg}</span>
                          )
                        )}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center not-prose">
        <p className="font-semibold text-foreground">Formular de retragere</p>
        <p className="mt-1 text-sm text-muted-foreground">Completează online formularul standard de retragere din contract.</p>
        <Link
          to="/formular-retragere"
          className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
        >
          Formular de retragere
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center not-prose">
        <p className="font-semibold text-foreground">Ai întrebări despre retur?</p>
        <p className="mt-1 text-sm text-muted-foreground">Echipa noastră îți răspunde în maxim 24h.</p>
        <Link
          to="/contact"
          className="mt-4 inline-block rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition"
        >
          Contactează-ne
        </Link>
      </div>

    </LegalPageShell>
  );
}
