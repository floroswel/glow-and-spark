import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/termeni-si-conditii")({
  head: () => ({
    meta: [
      { title: "Termeni și Condiții — Mama Lucica" },
      { name: "description", content: "Termenii și condițiile de utilizare ale magazinului online Mama Lucica, operat de SC Vomix Genius SRL." },
      { property: "og:title", content: "Termeni și Condiții — Mama Lucica" },
      { property: "og:description", content: "Termenii și condițiile de utilizare ale magazinului online Mama Lucica." },
    ],
  }),
  component: TermeniPage,
});

function TermeniPage() {
  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Termeni și Condiții</span>
        </nav>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8 text-center">Termeni și Condiții</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6 [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">

          <p>Ultima actualizare: 1 mai 2026</p>

          <h2>1. Identificarea vânzătorului</h2>
          <p>
            Magazinul online <strong>mamalucica.ro</strong> este operat de <strong>SC Vomix Genius SRL</strong>, 
            cu sediul social în Județul Teleorman, România, înregistrată la Registrul Comerțului sub nr. J34/XXX/2023, 
            CUI <strong>43025661</strong>.
          </p>
          <p>Contact: <a href="mailto:contact@mamalucica.ro" className="text-accent hover:underline">contact@mamalucica.ro</a></p>

          <h2>2. Definiții</h2>
          <p><strong>Vânzătorul</strong> — SC Vomix Genius SRL.</p>
          <p><strong>Cumpărătorul / Clientul</strong> — orice persoană fizică cu vârsta peste 18 ani sau persoană juridică ce plasează o comandă pe site.</p>
          <p><strong>Site-ul</strong> — mamalucica.ro și toate paginile aferente.</p>
          <p><strong>Comanda</strong> — documentul electronic prin care Cumpărătorul transmite intenția de a achiziționa produse de pe Site.</p>

          <h2>3. Obiectul contractului</h2>
          <p>
            Prezentele Termeni și Condiții reglementează relația comercială dintre Vânzător și Cumpărător 
            privind vânzarea la distanță a produselor comercializate pe mamalucica.ro, conform legislației 
            române aplicabile, inclusiv OUG 34/2014 privind drepturile consumatorilor.
          </p>

          <h2>4. Plasarea comenzii</h2>
          <p>Prin plasarea unei comenzi pe site, Cumpărătorul confirmă că:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A citit și acceptat prezentele Termeni și Condiții</li>
            <li>Are vârsta minimă de 18 ani sau acționează cu acordul unui reprezentant legal</li>
            <li>Datele furnizate sunt corecte și complete</li>
            <li>Acceptă prețurile, termenele de livrare și metodele de plată afișate la momentul plasării comenzii</li>
          </ul>
          <p>Contractul de vânzare se consideră încheiat la momentul confirmării comenzii de către Vânzător prin e-mail.</p>

          <h2>5. Prețuri și plată</h2>
          <p>
            Toate prețurile afișate pe site includ TVA (19%) și sunt exprimate în RON (lei românești). 
            Prețurile pot fi modificate oricând, dar modificările nu afectează comenzile deja confirmate.
          </p>
          <p>Metodele de plată acceptate: plată online cu cardul (prin procesatorul Netopia Payments), ramburs la livrare.</p>

          <h2>6. Livrare</h2>
          <p>
            Livrarea se efectuează pe teritoriul României, prin servicii de curierat. 
            Termenul estimativ de livrare este de <strong>2-5 zile lucrătoare</strong> de la confirmarea comenzii. 
            Costul de livrare este afișat în coș înainte de finalizarea comenzii.
          </p>
          <p>
            Produsele sunt ambalate corespunzător pentru a preveni deteriorarea pe durata transportului. 
            La primirea coletului, verificați integritatea ambalajului și semnați de primire doar dacă acesta este intact.
          </p>

          <h2>7. Dreptul de retragere</h2>
          <p>
            Conform OUG 34/2014, Cumpărătorul beneficiază de dreptul de retragere din contractul de vânzare la distanță 
            în termen de <strong>14 zile calendaristice</strong> de la primirea produsului, fără a fi necesară justificarea deciziei. 
            Detalii complete în <Link to="/politica-returnare" className="text-accent hover:underline">Politica de Returnare</Link>.
          </p>

          <h2>8. Garanție și conformitate</h2>
          <p>
            Produsele comercializate beneficiază de garanția legală de conformitate de <strong>2 ani</strong> 
            de la data livrării, conform Legii 449/2003. Dacă produsul nu este conform descrierii, 
            Cumpărătorul are dreptul la reparare, înlocuire sau rambursare.
          </p>

          <h2>9. Responsabilitate</h2>
          <p>Vânzătorul nu răspunde pentru:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Daunele rezultate din utilizarea necorespunzătoare a produselor</li>
            <li>Întârzieri ale serviciului de curierat cauzate de forță majoră</li>
            <li>Indisponibilitatea temporară a site-ului din motive tehnice</li>
          </ul>

          <h2>10. Protecția datelor cu caracter personal</h2>
          <p>
            Datele personale sunt prelucrate în conformitate cu GDPR (Regulamentul UE 2016/679). 
            Detalii complete în <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link>.
          </p>

          <h2>11. Reclamații și litigii</h2>
          <p>
            Pentru reclamații, vă rugăm să ne contactați la <a href="mailto:contact@mamalucica.ro" className="text-accent hover:underline">contact@mamalucica.ro</a>.
          </p>
          <p>
            Conform OUG 38/2015, consumatorii pot utiliza platforma europeană de soluționare online a litigiilor (SOL/ODR): {" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            ANPC — Autoritatea Națională pentru Protecția Consumatorilor: {" "}
            <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              https://anpc.ro
            </a>
          </p>

          <h2>12. Forța majoră</h2>
          <p>
            Niciuna dintre părți nu va fi responsabilă pentru neexecutarea obligațiilor contractuale 
            dacă aceasta se datorează unui eveniment de forță majoră, conform legislației în vigoare.
          </p>

          <h2>13. Legea aplicabilă</h2>
          <p>
            Prezentul contract este guvernat de legislația română. Orice litigiu va fi soluționat pe cale amiabilă, 
            iar în caz de imposibilitate, de către instanțele competente din România.
          </p>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
