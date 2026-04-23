import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-cookies")({
  head: () => ({
    meta: [
      { title: "Politica de Cookie-uri — Mama Lucica" },
      { name: "description", content: "Informații despre cookie-urile utilizate pe site-ul Mama Lucica: necesare, analitice și de marketing." },
      { property: "og:title", content: "Politica de Cookie-uri — Mama Lucica" },
      { property: "og:description", content: "Informații despre cookie-urile utilizate pe site-ul Mama Lucica." },
    ],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
          Politica de Cookie-uri
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Această pagină descrie modul în care site-ul nostru utilizează cookie-uri și tehnologii similare
          pentru a îmbunătăți experiența de navigare. Prin continuarea utilizării site-ului, sunteți de acord
          cu utilizarea cookie-urilor în conformitate cu această politică.
        </p>

        {/* Ce sunt cookie-urile */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-3">Ce sunt cookie-urile?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookie-urile sunt fișiere text de mici dimensiuni stocate pe dispozitivul dumneavoastră atunci când
            vizitați un site web. Acestea permit site-ului să rețină informații despre vizita dumneavoastră,
            facilitând navigarea și făcând site-ul mai util.
          </p>
        </section>

        {/* 1. Necesare */}
        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">1</span>
            <h2 className="text-xl font-semibold text-foreground">Cookie-uri Necesare</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Aceste cookie-uri sunt esențiale pentru funcționarea corectă a site-ului. Fără ele, site-ul nu poate
            oferi serviciile de bază pe care le solicitați.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Menținerea sesiunii de autentificare a utilizatorului</li>
            <li>Salvarea produselor adăugate în coșul de cumpărături</li>
            <li>Memorarea preferințelor de confidențialitate (consimțământ cookie-uri)</li>
            <li>Asigurarea securității și prevenirea fraudelor</li>
          </ul>
          <p className="text-xs text-muted-foreground/70 mt-4">
            <strong>Expirare:</strong> Sesiune — 1 an &nbsp;|&nbsp; <strong>Nu pot fi dezactivate.</strong>
          </p>
        </section>

        {/* 2. Analitice */}
        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">2</span>
            <h2 className="text-xl font-semibold text-foreground">Cookie-uri Analitice</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Ne ajută să înțelegem cum interacționează vizitatorii cu site-ul, oferind informații despre paginile
            vizitate, timpul petrecut și eventualele erori întâmpinate. Datele sunt anonimizate.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Numărul de vizitatori și paginile cele mai populare</li>
            <li>Sursa traficului (motor de căutare, rețea socială, link direct)</li>
            <li>Durata medie a sesiunilor</li>
            <li>Rata de respingere și fluxul de navigare</li>
          </ul>
          <p className="text-xs text-muted-foreground/70 mt-4">
            <strong>Furnizor exemplu:</strong> Google Analytics &nbsp;|&nbsp; <strong>Expirare:</strong> până la 2 ani
          </p>
        </section>

        {/* 3. Marketing */}
        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">3</span>
            <h2 className="text-xl font-semibold text-foreground">Cookie-uri de Marketing</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Sunt utilizate pentru a vă afișa reclame relevante în funcție de interesele dumneavoastră. De
            asemenea, limitează numărul de afișări ale unei reclame și ajută la măsurarea eficienței campaniilor
            publicitare.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Afișarea de reclame personalizate pe site-uri terțe</li>
            <li>Remarketing și retargetare pe platformele sociale</li>
            <li>Măsurarea conversiilor din campanii publicitare</li>
            <li>Crearea de profiluri anonime de interes</li>
          </ul>
          <p className="text-xs text-muted-foreground/70 mt-4">
            <strong>Furnizori exemplu:</strong> Meta Pixel, Google Ads &nbsp;|&nbsp; <strong>Expirare:</strong> până la 1 an
          </p>
        </section>

        {/* Cum gestionezi */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-3">Cum puteți gestiona cookie-urile?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Puteți modifica preferințele de cookie-uri în orice moment din setările browser-ului dumneavoastră.
            De asemenea, la prima vizită pe site vi se afișează un banner de consimțământ prin care puteți
            accepta sau refuza categoriile opționale. Dezactivarea anumitor cookie-uri poate afecta
            funcționalitatea site-ului.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pentru orice întrebări legate de politica noastră de cookie-uri, ne puteți contacta la adresa de
            email disponibilă pe pagina de <a href="/contact" className="text-primary underline hover:no-underline">Contact</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
