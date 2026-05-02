import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight, ChevronDown, Search } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Întrebări Frecvente (FAQ) — Mama Lucica" },
      { name: "description", content: "Găsește răspunsuri la cele mai frecvente întrebări despre comenzi, livrare, retur și produsele noastre." },
      { property: "og:title", content: "FAQ — Mama Lucica" },
      { property: "og:description", content: "Răspunsuri rapide la întrebările frecvente." },
    ],
  }),
  component: FAQPage,
});

const faqCategories = [
  {
    title: "Comenzi & Plăți",
    icon: "🛒",
    items: [
      { q: "Cum plasez o comandă?", a: "Adaugă produsele dorite în coș, apoi mergi la Checkout. Completează datele de livrare și alege metoda de plată. Vei primi o confirmare pe email." },
      { q: "Ce metode de plată acceptați?", a: "Acceptăm plata ramburs (numerar la livrare), transfer bancar și plata cu cardul online." },
      { q: "Pot modifica o comandă după plasare?", a: "Da, dacă ne contactezi în maxim 2 ore de la plasarea comenzii. După ce comanda a fost expediată, nu mai putem face modificări." },
      { q: "Cum pot folosi un cod de reducere?", a: "Introduci codul de reducere în câmpul dedicat din pagina de checkout, înainte de a finaliza comanda." },
    ],
  },
  {
    title: "Livrare",
    icon: "🚚",
    items: [
      { q: "Cât durează livrarea?", a: "Comenzile sunt procesate în 24h și livrate în 1-3 zile lucrătoare prin Fan Courier, DPD sau Sameday." },
      { q: "Cât costă livrarea?", a: "Livrarea este gratuită pentru comenzi peste 200 RON. Sub această sumă, costul este de 15-20 RON în funcție de curier." },
      { q: "Livrați și în afara României?", a: "Momentan livrăm doar în România. Pentru comenzi internaționale, contactează-ne la contact@mamalucica.ro." },
      { q: "Cum pot urmări comanda?", a: "După expediere, vei primi un email cu numărul AWB. Poți urmări coletul pe pagina 'Urmărește comanda' sau direct pe site-ul curierului." },
    ],
  },
  {
    title: "Retururi & Schimburi",
    icon: "↩️",
    items: [
      { q: "Care este politica de retur?", a: "Conform OUG 34/2014, ai dreptul de retragere în 14 zile calendaristice de la primirea produsului, fără a invoca vreun motiv. Produsul trebuie să fie nefolosit și în ambalajul original. Consultă pagina Politica de Returnare pentru detalii complete." },
      { q: "Cum returnez un produs?", a: "Contactează-ne prin email sau telefon, iar noi vom aranja ridicarea coletului prin curier. Costul returului este suportat de noi." },
      { q: "Când primesc banii înapoi?", a: "Rambursarea se face în 5-10 zile lucrătoare de la primirea produsului returnat, prin aceeași metodă de plată folosită la comandă." },
    ],
  },
  {
    title: "Produse",
    icon: "🕯️",
    items: [
      { q: "Din ce sunt făcute lumânările?", a: "Lumânările noastre sunt 100% din ceară de soia pură, cu fitil din bumbac sau lemn natural și parfumate cu uleiuri esențiale premium." },
      { q: "Cât arde o lumânare?", a: "Durata de ardere variază: lumânările mici (150g) ard ~25h, medii (250g) ~40h, iar cele mari (400g+) peste 60h." },
      { q: "Sunt produsele voastre vegane?", a: "Da! Toate produsele sunt vegane, cruelty-free și fără parafină sau coloranți artificiali." },
      { q: "Cum îngrijesc lumânarea corect?", a: "La prima ardere, lasă lumânarea să ardă 2-3 ore până se topește uniform suprafața. Tăiați fitilul la 5mm înainte de fiecare utilizare." },
    ],
  },
];

function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggle = (key: string) => setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredCategories = searchQuery.trim()
    ? faqCategories.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">FAQ</span>
        </nav>

        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-bold text-foreground">Întrebări Frecvente</h1>
          <p className="mt-2 text-muted-foreground">Găsește rapid răspunsurile de care ai nevoie</p>

          <div className="relative mt-6 mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută o întrebare..."
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredCategories.map((cat) => (
            <div key={cat.title}>
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground mb-3">
                <span>{cat.icon}</span> {cat.title}
              </h2>
              <div className="space-y-1">
                {cat.items.map((item, i) => {
                  const key = `${cat.title}-${i}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div key={key} className="rounded-lg border border-border bg-card overflow-hidden">
                      <button
                        onClick={() => toggle(key)}
                        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-foreground hover:bg-secondary/50 transition"
                      >
                        {item.q}
                        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-1 duration-200">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Nu am găsit nicio întrebare pentru „{searchQuery}"</p>
              <Link to="/contact" className="mt-3 inline-block text-accent hover:underline text-sm">
                Contactează-ne direct →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-semibold text-foreground">Nu ai găsit răspunsul?</p>
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
