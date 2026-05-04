import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useFiscalInfo } from "@/hooks/useFiscalInfo";
import { WITHDRAWAL_PERIOD_DAYS, COMPLAINT_RESPONSE_DAYS } from "@/lib/compliance";

const LAST_UPDATE = "2026-05-04";

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
  const fiscal = useFiscalInfo();

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
        române aplicabile, în special OUG 34/2014 privind drepturile consumatorilor în cadrul 
        contractelor încheiate la distanță.
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
        <li>Dreptul de retragere prevăzut la secțiunea 7 se aplică <strong>exclusiv consumatorilor</strong> (persoane fizice) conform OUG 34/2014. Clienții B2B nu beneficiază de acest drept.</li>
        <li>Garanția legală de conformitate se aplică diferit pentru clienți B2B, conform dispozițiilor Codului Civil.</li>
        <li>Facturarea se face cu datele fiscale ale persoanei juridice (CUI, denumire, adresă sediu social).</li>
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
        Toate prețurile afișate pe site sunt exprimate în <strong>RON (lei românești)</strong> și sunt prețuri finale.{" "}
        {fiscal.priceDisclaimer}
      </p>
      <p>
        Prețurile pot fi modificate oricând de către Vânzător, dar modificările nu afectează comenzile deja confirmate.
      </p>
      <p>Metodele de plată acceptate:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Plata online cu cardul</strong> — prin procesatorul autorizat de plăți <strong>Netopia Payments</strong>. Datele cardului sunt procesate exclusiv de Netopia; {C.name} nu stochează datele cardului.</li>
        <li><strong>Ramburs la livrare</strong> — plata se face la primirea coletului către curier.</li>
        <li><strong>Transfer bancar</strong> — în contul afișat pe pagina <Link to="/metode-plata" className="text-accent hover:underline">Metode de plată</Link>.</li>
      </ul>

      <h2>6. Livrare</h2>
      <p>
        Livrarea se efectuează pe teritoriul României prin servicii de curierat. 
        Detalii complete privind termenele și costurile de livrare sunt disponibile pe pagina{" "}
        <Link to="/transport-livrare" className="text-accent hover:underline">Transport și livrare</Link>.
      </p>
      <p>
        La primirea coletului, verificați integritatea ambalajului. Dacă observați deteriorări vizibile, 
        refuzați coletul și contactați-ne imediat la <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a>.
      </p>

      <h2>7. Dreptul de retragere</h2>
      <p>
        Conform OUG 34/2014, <strong>Consumatorul</strong> (persoană fizică, achiziție non-profesională) 
        beneficiază de dreptul de retragere din contractul de vânzare la distanță 
        în termen de <strong>{WITHDRAWAL_PERIOD_DAYS} zile calendaristice</strong> de la primirea produsului, fără a fi necesară justificarea deciziei.
      </p>
      <p>
        <strong>Clienții B2B</strong> (persoane juridice, PFA, II) nu beneficiază de dreptul de retragere, 
        conform legislației aplicabile.
      </p>
      <p>
        Detalii complete în <Link to="/politica-returnare" className="text-accent hover:underline">Politica de Returnare</Link>. 
        Formularul-tip de retragere este disponibil la <Link to="/formular-retragere" className="text-accent hover:underline">Formular de retragere</Link>.
      </p>

      <h2>8. Garanție și conformitate</h2>
      <p>
        Produsele comercializate beneficiază de garanția legală de conformitate conform OUG 21/1992 
        și Legii 449/2003. Garanția legală de conformitate este de <strong>2 ani</strong> de la data 
        livrării produsului, conform legislației UE în vigoare.
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
        Datele personale sunt prelucrate în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și 
        legislația română aplicabilă. Detalii complete în{" "}
        <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link>.
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
        <strong>SAL</strong> — Soluționarea Alternativă a Litigiilor: {" "}
        <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          https://anpc.ro/ce-este-sal/
        </a>
      </p>
      <p>
        <strong>Platforma SOL/ODR</strong> — Soluționare Online a Litigiilor (Regulamentul UE nr. 524/2013): {" "}
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
        <li><strong>Consumatorii</strong> pot sesiza ANPC sau pot utiliza platforma ODR (link mai sus)</li>
        <li><strong>Consumatorii</strong> pot recurge la procedura SAL (Soluționarea Alternativă a Litigiilor) prin entitățile înscrise în registrul ANPC</li>
        <li><strong>Clienții B2B</strong> pot recurge la medierea comercială sau la instanțele judecătorești competente conform secțiunii 15</li>
      </ul>

      <h2>14. Forța majoră</h2>
      <p>
        Niciuna dintre părți nu va fi responsabilă pentru neexecutarea obligațiilor contractuale 
        dacă aceasta se datorează unui eveniment de forță majoră, conform legislației civile aplicabile.
      </p>

      <h2>15. Legea aplicabilă și jurisdicția</h2>
      <p>
        Prezentul contract este guvernat de legislația română. 
      </p>
      <p>
        <strong>Pentru consumatori:</strong> Orice litigiu va fi soluționat de instanțele competente din România, 
        conform domiciliului consumatorului, în conformitate cu OUG 34/2014 și legislația privind protecția consumatorilor.
      </p>
      <p>
        <strong>Pentru clienți B2B:</strong> Competența revine instanțelor judecătorești de la sediul Vânzătorului, 
        dacă părțile nu convin altfel prin acord scris.
      </p>

      <h2>16. Modificări</h2>
      <p>
        {C.name} își rezervă dreptul de a modifica prezentele Termeni și Condiții. 
        Modificările sunt valabile de la data publicării pe site. Comenzile plasate anterior modificării rămân sub incidența 
        versiunii acceptate la momentul plasării.
      </p>

      <h2>17. Informații suplimentare obligatorii</h2>
      <p>
        Conform OUG 34/2014 și Legii 365/2002 privind comerțul electronic, vă informăm:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Caracteristicile principale ale produselor sunt descrise pe fiecare pagină de produs.</li>
        <li>Prețul total, inclusiv costurile de livrare, este afișat clar înainte de finalizarea comenzii.</li>
        <li>Durata minimă a contractului: nu există o durată minimă — fiecare comandă este un contract individual.</li>
        <li>Funcționalitatea conținutului digital: nu se aplică produselor fizice comercializate.</li>
        <li>Limba contractului: română.</li>
        <li>Pași tehnici de încheiere a contractului: selectare produse → adăugare în coș → completare date livrare → alegere metodă plată → confirmare comandă.</li>
      </ul>

      <h2>18. Programul de puncte de loialitate</h2>
      <p>
        {C.site} oferă un program de puncte de loialitate prin care clienții înregistrați pot acumula 
        și utiliza puncte în contul comenzilor plasate. Participarea la program presupune acceptarea 
        regulilor descrise mai jos.
      </p>

      <h3>18.1. Acumularea punctelor</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Punctele se acordă automat la finalizarea unei comenzi, în funcție de valoarea totală a acesteia.</li>
        <li>Numărul de puncte acordate este egal cu valoarea comenzii rotunjită în jos (1 RON = 1 punct).</li>
        <li>Punctele sunt vizibile în contul clientului imediat după plasarea comenzii.</li>
      </ul>

      <h3>18.2. Utilizarea punctelor</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Punctele acumulate pot fi folosite pentru a obține un discount la o comandă viitoare.</li>
        <li>Rata de conversie: 100 de puncte = 1 RON discount.</li>
        <li><strong>Punctele pot fi utilizate 100% din valoarea unei comenzi</strong> — nu există o limită maximă de discount per comandă din puncte.</li>
        <li><strong>Perioada de așteptare:</strong> punctele pot fi utilizate doar după 15 (cincisprezece) zile calendaristice de la data ultimei comenzi finalizate de client. Această regulă se aplică pentru a preveni abuzurile.</li>
        <li>Dacă nu au trecut 15 zile de la ultima comandă, sistemul va afișa data la care punctele devin disponibile pentru utilizare.</li>
      </ul>

      <h3>18.3. Niveluri de loialitate</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Bronze</strong> — sub 500 de puncte acumulate cumulativ.</li>
        <li><strong>Silver</strong> — între 500 și 1.999 de puncte acumulate cumulativ.</li>
        <li><strong>Gold</strong> — 2.000 sau mai multe puncte acumulate cumulativ.</li>
      </ul>
      <p>Nivelul se calculează pe baza totalului de puncte acumulate în întreaga perioadă (puncte lifetime), nu pe baza soldului curent.</p>

      <h3>18.4. Expirare și pierdere puncte</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Punctele nu expiră atât timp cât contul clientului este activ.</li>
        <li>Ștergerea contului (cerere GDPR sau la cerere) duce la pierderea tuturor punctelor acumulate.</li>
        <li>Punctele nu sunt transferabile între conturi și nu pot fi convertite în numerar.</li>
      </ul>

      <h3>18.5. Modificări ale programului</h3>
      <p>
        {C.name} își rezervă dreptul de a modifica regulile programului de loialitate, ratele de 
        conversie sau nivelurile, cu notificarea prealabilă a clienților prin email sau pe site. 
        Punctele acumulate anterior modificării rămân valabile conform condițiilor de la momentul acumulării.
      </p>

    </LegalPageShell>
  );
}
