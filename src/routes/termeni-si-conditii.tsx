import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { WITHDRAWAL_PERIOD_DAYS, COMPLAINT_RESPONSE_DAYS } from "@/lib/compliance";

const LAST_UPDATE = "2026-05-02";

export const Route = createFileRoute("/termeni-si-conditii")({
  head: () => ({
    meta: [
      { title: "Termeni și Condiții — Mama Lucica" },
      { name: "description", content: "Termenii și condițiile de utilizare ale magazinului online Mama Lucica." },
      { property: "og:title", content: "Termeni și Condiții — Mama Lucica" },
      { property: "og:description", content: "Termenii și condițiile de utilizare ale magazinului online Mama Lucica." },
    ],
  }),
  component: TermeniPage,
});

function TermeniPage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell title="Termeni și Condiții" breadcrumb="Termeni și Condiții" lastUpdate={LAST_UPDATE}>

      <h2>1. Identificarea vânzătorului</h2>
      <p>Magazinul online <strong>{C.site}</strong> este operat de:</p>
      <CompanyIdentityBlock C={C} />

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
        române aplicabile privind drepturile consumatorilor în cadrul contractelor încheiate la distanță.
      </p>

      <h2>3a. Tipul clienților — B2C și B2B</h2>
      <p>
        Site-ul este destinat în principal <strong>consumatorilor</strong> (persoane fizice care achiziționează produse 
        în scopuri personale, non-comerciale) — relație <strong>B2C</strong>.
      </p>
      <p>
        Persoanele juridice sau persoanele fizice autorizate care plasează comenzi în scop profesional 
        (relație <strong>B2B</strong>) beneficiază de aceleași condiții comerciale, cu următoarele excepții:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Dreptul de retragere prevăzut la secțiunea 7 se aplică <strong>exclusiv consumatorilor</strong> (persoane fizice) conform legislației privind protecția consumatorilor. Clienții B2B nu beneficiază de acest drept, cu excepția cazurilor în care legislația aplicabilă prevede altfel. [VERIFICARE_AVOCAT — confirmați aplicabilitatea]</li>
        <li>Garanția legală de conformitate se aplică diferit pentru clienți B2B, conform Codului Civil. [VERIFICARE_AVOCAT]</li>
        <li>Facturarea se face cu datele fiscale ale persoanei juridice (CUI, denumire, adresă sediu social)</li>
      </ul>

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
        [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — specificați regimul fiscal aplicabil]
      </p>
      <p>
        Prețurile pot fi modificate oricând de către Vânzător, dar modificările nu afectează comenzile deja confirmate.
      </p>
      <p>Metodele de plată acceptate:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Plata online cu cardul</strong> — prin procesatorul autorizat de plăți. Datele cardului sunt procesate exclusiv de procesator; {C.name} nu stochează datele cardului. [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — identificați procesatorul]</li>
        <li><strong>Ramburs la livrare</strong> — plata se face la primirea coletului către curier.</li>
      </ul>

      <h2>6. Livrare</h2>
      <p>
        Livrarea se efectuează pe teritoriul României prin servicii de curierat. 
        [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați termenele și costurile efective de livrare]
      </p>
      <p>
        La primirea coletului, verificați integritatea ambalajului. Dacă observați deteriorări vizibile, 
        refuzați coletul și contactați-ne imediat la <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a>.
      </p>

      <h2>7. Dreptul de retragere</h2>
      <p>
        Conform legislației privind drepturile consumatorilor, <strong>Consumatorul</strong> (persoană fizică, achiziție non-profesională) 
        beneficiază de dreptul de retragere din contractul de vânzare la distanță 
        în termen de <strong>{WITHDRAWAL_PERIOD_DAYS} zile calendaristice</strong> de la primirea produsului, fără a fi necesară justificarea deciziei.
      </p>
      <p>
        <strong>Clienții B2B</strong> (persoane juridice, PFA, II) nu beneficiază de dreptul de retragere, 
        cu excepția cazurilor prevăzute expres de legislația aplicabilă. [VERIFICARE_AVOCAT]
      </p>
      <p>
        Detalii complete în <Link to="/politica-returnare" className="text-accent hover:underline">Politica de Returnare</Link>. 
        Formularul-tip de retragere este disponibil la <Link to="/formular-retragere" className="text-accent hover:underline">Formular de retragere</Link>.
      </p>

      <h2>8. Garanție și conformitate</h2>
      <p>
        Produsele comercializate beneficiază de garanția legală de conformitate conform legislației aplicabile.
        [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați durata garanției legale aplicabile produselor comercializate]
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
        Datele personale sunt prelucrate în conformitate cu legislația aplicabilă privind protecția datelor personale. 
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
      </p>
      <p>
        Vom confirma primirea reclamației în cel mult <strong>{COMPLAINT_RESPONSE_DAYS} zile lucrătoare</strong> și 
        vom depune eforturi rezonabile pentru a o soluționa în cel mai scurt timp posibil.
      </p>
      <p>
        <strong>ANPC</strong> — Autoritatea Națională pentru Protecția Consumatorilor: {" "}
        <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://anpc.ro</a>
      </p>
      <p>
        <strong>Platforma SOL/ODR</strong> — Soluționare Online a Litigiilor (pentru consumatori): {" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          https://ec.europa.eu/consumers/odr
        </a>
      </p>

      <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">13a. Procedura de soluționare a disputelor</h3>
      <p>
        În caz de litigiu, părțile vor încerca mai întâi soluționarea amiabilă, prin corespondență directă la {C.email}. 
        Termenul de răspuns este de maximum <strong>{COMPLAINT_RESPONSE_DAYS} zile lucrătoare</strong>.
      </p>
      <p>
        Dacă soluționarea amiabilă nu este posibilă:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Consumatorii</strong> pot sesiza ANPC sau pot utiliza platforma ODR</li>
        <li><strong>Clienții B2B</strong> pot recurge la medierea comercială sau la instanțele judecătorești competente conform secțiunii 15</li>
        <li>Orice parte poate utiliza procedura de mediere conform legislației române [VERIFICARE_AVOCAT — specificați centrul de mediere, dacă este cazul]</li>
      </ul>

      <h2>14. Forța majoră</h2>
      <p>
        Niciuna dintre părți nu va fi responsabilă pentru neexecutarea obligațiilor contractuale 
        dacă aceasta se datorează unui eveniment de forță majoră, conform legislației civile aplicabile.
      </p>

      <h2>15. Legea aplicabilă</h2>
      <p>
        Prezentul contract este guvernat de legislația română. 
      </p>
      <p>
        <strong>Pentru consumatori:</strong> Orice litigiu va fi soluționat de instanțele competente din România, 
        conform domiciliului consumatorului, în conformitate cu legislația privind protecția consumatorilor.
      </p>
      <p>
        <strong>Pentru clienți B2B:</strong> Competența revine instanțelor judecătorești de la sediul Vânzătorului, 
        dacă părțile nu convin altfel. [VERIFICARE_AVOCAT — confirmați clauza de jurisdicție]
      </p>

      <h2>16. Modificări</h2>
      <p>
        {C.name} își rezervă dreptul de a modifica prezentele Termeni și Condiții. 
        Modificările sunt valabile de la data publicării pe site. Comenzile plasate anterior modificării rămân sub incidența 
        versiunii acceptate la momentul plasării.
      </p>

    </LegalPageShell>
  );
}
