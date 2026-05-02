import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

const LAST_UPDATE = "2026-05-02";

export const Route = createFileRoute("/politica-confidentialitate")({
  head: () => ({
    meta: [
      { title: "Politica de Confidențialitate — Mama Lucica" },
      { name: "description", content: "Politica de confidențialitate GDPR a magazinului Mama Lucica. Cum colectăm, utilizăm și protejăm datele tale personale." },
      { property: "og:title", content: "Politica de Confidențialitate — Mama Lucica" },
      { property: "og:description", content: "Cum colectăm, utilizăm și protejăm datele tale personale conform GDPR." },
    ],
  }),
  component: PoliticaConfidentialitatePage,
});

function PoliticaConfidentialitatePage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell title="Politica de Confidențialitate" breadcrumb="Politica de Confidențialitate" lastUpdate={LAST_UPDATE}>

      <h2>1. Operatorul de date</h2>
      <p>Operatorul de date cu caracter personal este:</p>
      <CompanyIdentityBlock C={C} />

      <h2>2. Ce date colectăm</h2>
      <p>Colectăm următoarele categorii de date personale:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Date de identificare:</strong> nume, prenume, adresă de e-mail, număr de telefon</li>
        <li><strong>Date de livrare:</strong> adresa completă de livrare (stradă, număr, bloc, scară, etaj, apartament, localitate, județ, cod poștal)</li>
        <li><strong>Date de facturare:</strong> adresă de facturare, CUI și denumire firmă (pentru persoane juridice)</li>
        <li><strong>Date de navigare:</strong> adresa IP, cookies, pagini vizitate, tip de browser, sistem de operare, durată vizită (doar cu consimțământ explicit)</li>
        <li><strong>Date de plată:</strong> procesate exclusiv de procesatorul de plăți; {C.name} <strong>nu stochează</strong> date ale cardului bancar (număr, CVV, dată expirare). [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați identitatea procesatorului de plăți și certificările acestuia]</li>
        <li><strong>Date din comunicări:</strong> conținutul mesajelor trimise prin formularul de contact, e-mail sau telefon</li>
      </ul>

      <h2>3. Scopurile prelucrării</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Procesarea și livrarea comenzilor plasate pe site</li>
        <li>Emiterea facturilor fiscale conform legislației fiscale aplicabile</li>
        <li>Comunicarea cu clientul privind statusul comenzii (confirmare, expediere, livrare)</li>
        <li>Răspunsuri la solicitări și suport clienți</li>
        <li>Trimiterea de comunicări comerciale (newsletter) — <strong>doar cu consimțământ explicit</strong>, retractabil oricând</li>
        <li>Îmbunătățirea experienței de navigare pe site (analiză anonimizată)</li>
        <li>Respectarea obligațiilor legale (fiscale, contabile, protecția consumatorilor)</li>
        <li>Prevenirea fraudei și securitatea site-ului</li>
        <li>Gestionarea programului de fidelitate (puncte, niveluri)</li>
      </ul>

      <h2>4. Temeiul legal al prelucrării</h2>
      <p>[PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — temeiurile juridice trebuie confirmate de un avocat specializat în protecția datelor]</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Executarea contractului</strong> — pentru procesarea comenzilor, livrare și facturare</li>
        <li><strong>Obligație legală</strong> — pentru evidențe fiscale și contabile</li>
        <li><strong>Consimțământ</strong> — pentru newsletter, cookies analitice/marketing, comunicări promoționale</li>
        <li><strong>Interes legitim</strong> — pentru prevenirea fraudei, securitatea site-ului, îmbunătățirea serviciilor</li>
      </ul>

      <h2>5. Durata stocării datelor</h2>
      <p>[PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — duratele de stocare trebuie validate cu un contabil/avocat]</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Date de comandă și facturare: conform obligațiilor legale fiscale aplicabile</li>
        <li>Date de cont client: până la ștergerea contului de către utilizator sau la solicitarea explicită de ștergere</li>
        <li>Date de newsletter: până la retragerea consimțământului (dezabonare)</li>
        <li>Date de suport/reclamații: conform termenelor legale aplicabile</li>
        <li>Cookies: conform duratelor specificate în <Link to="/politica-cookies" className="text-accent hover:underline">Politica de Cookies</Link></li>
        <li>Jurnale de securitate (IP, încercări de autentificare): <strong>90 de zile</strong></li>
      </ul>

      <h2>6. Destinatari ai datelor</h2>
      <p>Datele pot fi transmise către următorii destinatari, strict în limita necesară:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Servicii de curierat</strong> — pentru livrarea comenzilor (nume, adresă, telefon)</li>
        <li><strong>Procesator de plăți online</strong> — [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — specificați procesatorul autorizat]</li>
        <li><strong>Furnizor de hosting și infrastructură</strong> — servere UE și CDN global</li>
        <li><strong>Furnizor de e-mail tranzacțional</strong> — pentru confirmări de comandă și notificări</li>
        <li><strong>Autorități publice</strong> — când legea o impune (ANAF, ANPC, instanțe judecătorești)</li>
      </ul>
      <p><strong>Nu vindem, nu închiriem și nu transmitem datele personale către terți în scopuri de marketing.</strong></p>

      <h2>7. Drepturile tale conform GDPR</h2>
      <p>Ai următoarele drepturi prevăzute de legislația privind protecția datelor:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Dreptul de acces</strong> — poți solicita o copie a tuturor datelor tale personale pe care le prelucrăm</li>
        <li><strong>Dreptul la rectificare</strong> — poți solicita corectarea datelor inexacte sau completarea celor incomplete</li>
        <li><strong>Dreptul la ștergere</strong> — „dreptul de a fi uitat" — poți solicita ștergerea datelor, cu excepția celor a căror păstrare este impusă de lege</li>
        <li><strong>Dreptul la restricționarea prelucrării</strong> — poți solicita limitarea prelucrării în anumite situații</li>
        <li><strong>Dreptul la portabilitatea datelor</strong> — poți solicita primirea datelor într-un format structurat, utilizat în mod curent</li>
        <li><strong>Dreptul de opoziție</strong> — te poți opune prelucrării bazate pe interesul legitim, inclusiv profilarea</li>
        <li><strong>Dreptul de a nu fi supus unei decizii automate</strong> — nu luăm decizii bazate exclusiv pe prelucrare automatizată cu efecte juridice</li>
        <li><strong>Dreptul de a retrage consimțământul</strong> — oricând, fără a afecta legalitatea prelucrării anterioare retragerii</li>
      </ul>

      <h2>8. Cum îți exerciți drepturile</h2>
      <p>Ai trei opțiuni:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Online:</strong> din secțiunea <Link to="/account/gdpr" className="text-accent hover:underline">Contul meu → Datele mele GDPR</Link></li>
        <li><strong>E-mail:</strong> trimite cererea la <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a> cu subiectul „Cerere GDPR"</li>
        <li><strong>Poștă:</strong> la adresa {C.name}, {C.fullAddress}</li>
      </ul>
      <p>
        Vom confirma primirea cererii în <strong>3 zile lucrătoare</strong> și vom răspunde complet 
        în termenul legal aplicabil de la primire. [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați termenul exact conform GDPR]
      </p>

      <h2>9. Transferuri internaționale de date</h2>
      <p>
        Datele sunt stocate preponderent pe servere situate în <strong>Uniunea Europeană</strong>. 
        [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL — verificați mecanismele de transfer (SCC, etc.) cu furnizorul de hosting și CDN]
      </p>

      <h2>10. Securitatea datelor</h2>
      <p>Implementăm măsuri tehnice și organizatorice adecvate:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Criptare TLS (HTTPS) pe toate conexiunile</li>
        <li>Acces restricționat pe bază de roluri la baza de date</li>
        <li>Politici de securitate pe toate tabelele cu date sensibile</li>
        <li>Parolele sunt stocate cu hashing criptografic, nu în text clar</li>
        <li>Backup-uri automate</li>
      </ul>

      <h2>11. Copii (sub 16 ani)</h2>
      <p>
        Nu colectăm cu bună știință date personale de la copii sub 16 ani. Dacă descoperiți că un minor 
        a furnizat date fără consimțământul parental, contactați-ne pentru ștergerea acestora.
      </p>

      <h2>12. Plângeri</h2>
      <p>
        Dacă consideri că prelucrarea datelor tale nu respectă legislația aplicabilă, ai dreptul de a depune o plângere la:
      </p>
      <p>
        <strong>Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</strong><br />
        B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București, cod poștal 010336<br />
        E-mail: anspdcp@dataprotection.ro<br />
        Website: <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.dataprotection.ro</a>
      </p>

      <h2>13. Modificări ale politicii</h2>
      <p>
        Ne rezervăm dreptul de a actualiza această politică. Modificările vor fi publicate pe această pagină 
        cu data ultimei actualizări vizibilă în partea de sus. Pentru modificări substanțiale, vom notifica 
        utilizatorii prin e-mail sau prin banner pe site.
      </p>

    </LegalPageShell>
  );
}
