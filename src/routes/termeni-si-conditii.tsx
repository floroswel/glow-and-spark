import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight } from "lucide-react";

const C = {
  name: "SC Vomix Genius SRL",
  cui: "43025661",
  regCom: "J2020000459343",
  address: "Strada Constructorilor Nr 39, sat Voievoda, comuna Furculești, județul Teleorman, cod poștal 147148",
  email: "contact@mamalucica.ro",
  phone: "+40 753 326 405",
  site: "mamalucica.ro",
};

export const Route = createFileRoute("/termeni-si-conditii")({
  head: () => ({
    meta: [
      { title: "Termeni și Condiții — Mama Lucica" },
      { name: "description", content: `Termenii și condițiile de utilizare ale magazinului online Mama Lucica, operat de ${C.name}, CUI ${C.cui}.` },
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

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2 text-center">Termeni și Condiții</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Ultima actualizare: 1 mai 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6 [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">

          <h2>1. Identificarea vânzătorului</h2>
          <p>
            Magazinul online <strong>{C.site}</strong> este operat de:
          </p>
          <ul className="list-none pl-0 space-y-0.5 text-sm">
            <li><strong>Denumire:</strong> {C.name}</li>
            <li><strong>CUI:</strong> {C.cui}</li>
            <li><strong>Reg. Com.:</strong> {C.regCom}</li>
            <li><strong>Sediu social:</strong> {C.address}</li>
            <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
            <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
          </ul>

          <h2>2. Definiții</h2>
          <p><strong>Vânzătorul</strong> — {C.name}, cu datele de identificare de mai sus.</p>
          <p><strong>Cumpărătorul / Clientul</strong> — orice persoană fizică cu vârsta peste 18 ani sau persoană juridică ce plasează o comandă pe site.</p>
          <p><strong>Site-ul</strong> — {C.site} și toate subdomeniile aferente.</p>
          <p><strong>Comanda</strong> — documentul electronic prin care Cumpărătorul transmite Vânzătorului intenția de a achiziționa produse de pe Site.</p>
          <p><strong>Contractul</strong> — contractul la distanță încheiat între Vânzător și Cumpărător, fără prezența fizică simultană, prin acceptarea unei comenzi pe Site.</p>

          <h2>3. Obiectul contractului</h2>
          <p>
            Prezentele Termeni și Condiții reglementează relația comercială dintre Vânzător și Cumpărător 
            privind vânzarea la distanță a produselor comercializate pe {C.site}, conform legislației 
            române aplicabile, inclusiv OUG 34/2014 privind drepturile consumatorilor în cadrul 
            contractelor încheiate la distanță.
          </p>

          <h2>4. Plasarea și confirmarea comenzii</h2>
          <p>Prin plasarea unei comenzi pe site, Cumpărătorul confirmă că:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A citit și acceptat prezentele Termeni și Condiții</li>
            <li>A citit <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link> și consimte la prelucrarea datelor personale conform acesteia</li>
            <li>Are vârsta minimă de 18 ani sau acționează cu acordul unui reprezentant legal</li>
            <li>Datele furnizate sunt corecte și complete</li>
            <li>Acceptă prețurile, termenele de livrare și metodele de plată afișate la momentul plasării comenzii</li>
          </ul>
          <p>
            Contractul de vânzare se consideră încheiat la momentul confirmării comenzii de către Vânzător prin e-mail. 
            Confirmarea conține: numărul comenzii, produsele achiziționate, prețul total (inclusiv livrare), 
            termenul estimat de livrare și informații privind dreptul de retragere.
          </p>

          <h2>5. Prețuri și plată</h2>
          <p>
            Toate prețurile afișate pe site sunt exprimate în <strong>RON (lei românești)</strong> și sunt prețuri finale. 
            Prețurile pot fi modificate oricând de către Vânzător, dar modificările nu afectează comenzile deja confirmate.
          </p>
          <p>Metodele de plată acceptate:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Plata online cu cardul</strong> — prin procesatorul autorizat Netopia Payments (Visa, Mastercard). Datele cardului sunt procesate exclusiv de Netopia; {C.name} nu stochează datele cardului.</li>
            <li><strong>Ramburs la livrare</strong> — plata se face la primirea coletului către curier.</li>
          </ul>

          <h2>6. Livrare</h2>
          <p>
            Livrarea se efectuează pe teritoriul României prin servicii de curierat. 
            Termenul estimativ de livrare este de <strong>2-5 zile lucrătoare</strong> de la confirmarea comenzii și procesarea plății.
          </p>
          <p>Costurile de livrare:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Livrare standard: <strong>25 RON</strong></li>
            <li>Livrare express: <strong>30 RON</strong></li>
            <li>Livrare gratuită pentru comenzi de peste <strong>200 RON</strong></li>
          </ul>
          <p>
            La primirea coletului, verificați integritatea ambalajului. Dacă observați deteriorări vizibile, 
            refuzați coletul și contactați-ne imediat la {C.email}.
          </p>

          <h2>7. Dreptul de retragere</h2>
          <p>
            Conform OUG 34/2014, Cumpărătorul beneficiază de dreptul de retragere din contractul de vânzare la distanță 
            în termen de <strong>14 zile calendaristice</strong> de la primirea produsului, fără a fi necesară justificarea deciziei. 
          </p>
          <p>
            Detalii complete în <Link to="/politica-returnare" className="text-accent hover:underline">Politica de Returnare</Link>. 
            Formularul-tip de retragere este disponibil la <Link to="/formular-retragere" className="text-accent hover:underline">Formular de retragere</Link>.
          </p>

          <h2>8. Garanție și conformitate</h2>
          <p>
            Produsele comercializate beneficiază de garanția legală de conformitate de <strong>2 ani</strong> 
            de la data livrării, conform Legii 449/2003 privind vânzarea produselor și garanțiile asociate acestora.
          </p>
          <p>
            Dacă produsul nu este conform cu descrierea de pe site sau prezintă defecte, 
            Cumpărătorul are dreptul la: reparare gratuită, înlocuire, reducere corespunzătoare a prețului sau rambursare.
          </p>

          <h2>9. Proprietate intelectuală</h2>
          <p>
            Conținutul site-ului (texte, imagini, logo-uri, grafice, design) este proprietatea {C.name} și este protejat 
            de legislația privind drepturile de autor și proprietatea intelectuală. Reproducerea, distribuirea sau 
            utilizarea conținutului fără acordul scris prealabil este interzisă.
          </p>

          <h2>10. Responsabilitate</h2>
          <p>Vânzătorul nu răspunde pentru:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Daunele rezultate din utilizarea necorespunzătoare a produselor, contrară instrucțiunilor</li>
            <li>Întârzieri ale serviciului de curierat cauzate de forță majoră sau condiții meteorologice extreme</li>
            <li>Indisponibilitatea temporară a site-ului din motive tehnice (mentenanță, actualizări)</li>
            <li>Erori de introducere a datelor de către Cumpărător (adresă greșită, telefon incorect)</li>
          </ul>

          <h2>11. Protecția datelor cu caracter personal</h2>
          <p>
            Datele personale sunt prelucrate în conformitate cu GDPR (Regulamentul UE 2016/679) și legislația națională. 
            Detalii complete în <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link>.
          </p>

          <h2>12. Cookie-uri</h2>
          <p>
            Site-ul utilizează cookie-uri conform <Link to="/politica-cookies" className="text-accent hover:underline">Politicii de Cookie-uri</Link>. 
            Utilizatorul poate gestiona preferințele de cookie-uri prin bannerul afișat la prima vizită.
          </p>

          <h2>13. Reclamații și soluționarea litigiilor</h2>
          <p>
            Pentru reclamații, contactați-ne la <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a> sau 
            la <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a>. 
            Ne angajăm să răspundem în termen de <strong>5 zile lucrătoare</strong>.
          </p>
          <p>
            <strong>ANPC</strong> — Autoritatea Națională pentru Protecția Consumatorilor: {" "}
            <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://anpc.ro</a>
          </p>
          <p>
            <strong>Platforma SOL/ODR</strong> — Soluționare Online a Litigiilor (conform OUG 38/2015): {" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>

          <h2>14. Forța majoră</h2>
          <p>
            Niciuna dintre părți nu va fi responsabilă pentru neexecutarea obligațiilor contractuale 
            dacă aceasta se datorează unui eveniment de forță majoră, conform Codului Civil (art. 1351).
            Partea afectată va notifica cealaltă parte în termen de 5 zile lucrătoare de la producerea evenimentului.
          </p>

          <h2>15. Legea aplicabilă</h2>
          <p>
            Prezentul contract este guvernat de legislația română. Orice litigiu va fi soluționat pe cale amiabilă, 
            iar în caz de imposibilitate, de către instanțele competente din România, conform domiciliului consumatorului.
          </p>

          <h2>16. Modificări</h2>
          <p>
            {C.name} își rezervă dreptul de a modifica prezentele Termeni și Condiții. 
            Modificările sunt valabile de la data publicării pe site. Utilizarea site-ului după publicare 
            constituie acceptarea modificărilor. Comenzile plasate anterior modificării rămân sub incidența 
            versiunii acceptate la momentul plasării.
          </p>
        </div>

        <div className="mt-8 text-xs text-muted-foreground text-center space-y-1 border-t border-border pt-6">
          <p><strong className="text-foreground">{C.name}</strong> · CUI: {C.cui} · Reg. Com.: {C.regCom}</p>
          <p>{C.address}</p>
          <p>E-mail: {C.email} · Tel: {C.phone}</p>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
