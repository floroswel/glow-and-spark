import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatDeadline, GDPR_RESPONSE_DAYS, GDPR_ACK_DAYS } from "@/lib/compliance";
import { getEnabledPlatforms, CONSENT_POLICY_VERSION } from "@/config/marketing-tech";

const LAST_UPDATE = "2026-05-04";

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
  const { general } = useSiteSettings();
  const allEnabled = getEnabledPlatforms(general);

  return (
    <LegalPageShell title="Politica de Confidențialitate" breadcrumb="Politica de Confidențialitate" lastUpdate={LAST_UPDATE}>

      <h2>1. Operatorul de date</h2>
      <p>Operatorul de date cu caracter personal este:</p>
      <CompanyIdentityBlock C={C} />
      <p className="mt-2">
        Având în vedere dimensiunea activității și natura datelor prelucrate, {C.name} nu a 
        desemnat un Responsabil cu Protecția Datelor (DPO). Pentru orice solicitare privind 
        datele personale, contactați-ne la{" "}
        <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a>.
      </p>

      <h2>2. Ce date colectăm</h2>
      <p>Colectăm următoarele categorii de date personale:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Date de identificare:</strong> nume, prenume, adresă de e-mail, număr de telefon</li>
        <li><strong>Date de livrare:</strong> adresa completă de livrare (stradă, număr, bloc, scară, etaj, apartament, localitate, județ, cod poștal)</li>
        <li><strong>Date de facturare:</strong> adresă de facturare, CUI și denumire firmă (pentru persoane juridice)</li>
        <li><strong>Date de navigare:</strong> adresa IP, cookies, pagini vizitate, tip de browser, sistem de operare, durată vizită (doar cu consimțământ explicit)</li>
        <li><strong>Date de plată:</strong> procesate exclusiv de procesatorul de plăți <strong>Netopia Payments</strong>; {C.name} <strong>nu stochează</strong> date ale cardului bancar (număr, CVV, dată expirare)</li>
        <li><strong>Date din comunicări:</strong> conținutul mesajelor trimise prin formularul de contact, e-mail sau telefon</li>
        <li><strong>Date colectate de instrumente publicitare:</strong> identificatori de cookie, ID-uri de dispozitiv, date de interacțiune cu reclame (click-uri, vizualizări, conversii), evenimente de comerț electronic transmise prin pixeli/SDK-uri (a se vedea secțiunea 3a)</li>
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
        <li>Publicitate online, măsurarea performanței campaniilor și remarketing (secțiunile 3a–3b)</li>
      </ul>

      <h2 id="publicitate">3a. Publicitate și măsurare</h2>
      {allEnabled.length > 0 ? (
        <>
          <p>
            Pentru a măsura eficiența campaniilor publicitare și a optimiza conținutul reclamelor, 
            utilizăm instrumente terțe de tracking. Acestea sunt activate <strong>doar dacă</strong> administratorul 
            a configurat un ID valid <strong>și</strong> vizitatorul a acordat consimțământ explicit prin bannerul de cookie-uri.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-3 py-2 font-semibold">Platformă</th>
                  <th className="text-left px-3 py-2 font-semibold">Entitate UE</th>
                  <th className="text-left px-3 py-2 font-semibold">Categorie</th>
                  <th className="text-left px-3 py-2 font-semibold">Documentație</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {allEnabled.map((p, i) => (
                  <tr key={p.key} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                    <td className="px-3 py-2 font-medium">{p.label}</td>
                    <td className="px-3 py-2">{p.euEntity}</td>
                    <td className="px-3 py-2 capitalize">{p.consentCategory}</td>
                    <td className="px-3 py-2">
                      <a href={p.privacyUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs">Privacy</a>
                      {" / "}
                      <a href={p.dpaUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs">DPA</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground italic">
          În prezent, nicio platformă publicitară sau analitică terță nu este configurată pe site.
        </p>
      )}

      <h2 id="remarketing">3b. Audiențe și remarketing</h2>
      <p>
        Putem utiliza datele colectate prin instrumentele descrise mai sus pentru a crea <strong>audiențe personalizate (custom audiences)</strong> pe 
        platformele publicitare, în scopul afișării de reclame relevante persoanelor care au interacționat cu site-ul nostru.
      </p>
      <p>Aceasta poate include:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Retargetarea vizitatorilor care au vizualizat produse, adăugat în coș sau finalizat comenzi (pe baza pixelilor instalați)</li>
        <li>Crearea de segmente de audiență pe baza comportamentului pe site (audiențe de website visitors)</li>
      </ul>
      <p>
        Puteți opri afișarea reclamelor personalizate retragând consimțământul pentru cookie-uri de marketing 
        sau utilizând setările de confidențialitate ale fiecărei platforme (ex: „Your Ad Choices", setări Facebook Ads, Google Ad Settings, TikTok Privacy).
      </p>

      <h2>4. Temeiul legal al prelucrării</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Executarea contractului</strong> (art. 6 alin. 1 lit. b GDPR) — pentru procesarea comenzilor, livrare și facturare</li>
        <li><strong>Obligație legală</strong> (art. 6 alin. 1 lit. c GDPR) — pentru evidențe fiscale și contabile conform Codului Fiscal</li>
        <li>
          <strong>Consimțământ</strong> (art. 6 alin. 1 lit. a GDPR) — pentru:
          <ul className="list-disc pl-5 mt-1">
            <li>Newsletter și comunicări promoționale</li>
            <li>Cookie-uri analitice și de marketing</li>
            <li>Pixeli publicitari — încărcarea scripturilor și transmiterea de date</li>
            <li>Audiențe personalizate pe baza activității pe site</li>
          </ul>
        </li>
        <li>
          <strong>Interes legitim</strong> (art. 6 alin. 1 lit. f GDPR) — pentru:
          <ul className="list-disc pl-5 mt-1">
            <li>Prevenirea fraudei și securitatea site-ului</li>
            <li>Îmbunătățirea serviciilor (analiză internă fără tracking terț)</li>
          </ul>
        </li>
      </ul>

      <h2>5. Durata stocării datelor</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Date de comandă și facturare: <strong>10 ani</strong> conform obligațiilor fiscale (Legea Contabilității nr. 82/1991)</li>
        <li>Date de cont client: până la ștergerea contului de către utilizator sau la solicitarea explicită de ștergere</li>
        <li>Date de newsletter: până la retragerea consimțământului (dezabonare)</li>
        <li>Date de suport/reclamații: <strong>3 ani</strong> de la soluționarea cererii</li>
        <li>Cookies: conform duratelor specificate în <Link to="/politica-cookies" className="text-accent hover:underline">Politica de Cookies</Link></li>
        <li>Jurnale de securitate (IP, încercări de autentificare): <strong>90 de zile</strong></li>
        <li><strong>Date publicitare și de remarketing:</strong> cookie-urile de marketing expiră conform duratelor din tabelul de cookie-uri; datele transmise către platforme sunt reținute conform politicilor proprii ale fiecărei platforme</li>
        <li><strong>Consimțământ cookie/marketing:</strong> jurnalele de consimțământ sunt păstrate cel puțin pe durata în care datele sunt prelucrate pe baza consimțământului respectiv</li>
      </ul>

      <h2>6. Destinatari ai datelor</h2>
      <p>Datele pot fi transmise către următorii destinatari, strict în limita necesară:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Servicii de curierat</strong> — pentru livrarea comenzilor (nume, adresă, telefon)</li>
        <li><strong>Netopia Payments</strong> — procesator autorizat de plăți online, certificat PCI DSS</li>
        <li><strong>Furnizor de hosting și infrastructură</strong> — servere UE și CDN global</li>
        <li><strong>Furnizor de e-mail tranzacțional</strong> — pentru confirmări de comandă și notificări</li>
        <li><strong>Autorități publice</strong> — când legea o impune (ANAF, ANPC, instanțe judecătorești)</li>
      </ul>
      <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">6a. Parteneri publicitari și de analiză</h3>
      {allEnabled.length > 0 ? (
        <>
          <p>
            Următorii furnizori pot primi date personale în calitate de operatori independenți:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {allEnabled.map((p) => (
              <li key={p.key}><strong>{p.euEntity}</strong> — {p.label}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground italic mt-2">
            Datele sunt transmise <strong>numai dacă</strong> vizitatorul a acordat consimțământ pentru cookie-uri de {allEnabled.some(p => p.consentCategory === "marketing") ? "marketing/" : ""}analiză.
          </p>
        </>
      ) : (
        <p className="text-muted-foreground italic">Niciun partener publicitar/analitic nu este configurat în prezent.</p>
      )}
      <p className="mt-2"><strong>Nu vindem, nu închiriem și nu transmitem datele personale către terți în scopuri de marketing propriu, altele decât cele menționate mai sus.</strong></p>

      <h2>7. Drepturile tale conform GDPR</h2>
      <p>Ai următoarele drepturi prevăzute de Regulamentul (UE) 2016/679:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Dreptul de acces</strong> — poți solicita o copie a tuturor datelor tale personale pe care le prelucrăm</li>
        <li><strong>Dreptul la rectificare</strong> — poți solicita corectarea datelor inexacte sau completarea celor incomplete</li>
        <li><strong>Dreptul la ștergere</strong> — „dreptul de a fi uitat" — poți solicita ștergerea datelor, cu excepția celor a căror păstrare este impusă de lege</li>
        <li><strong>Dreptul la restricționarea prelucrării</strong> — poți solicita limitarea prelucrării în anumite situații</li>
        <li><strong>Dreptul la portabilitatea datelor</strong> — poți solicita primirea datelor într-un format structurat, utilizat în mod curent și citibil automat</li>
        <li><strong>Dreptul de opoziție</strong> — te poți opune prelucrării bazate pe interesul legitim, inclusiv profilarea în scopuri de marketing direct</li>
        <li><strong>Dreptul de a nu fi supus unei decizii automate</strong> — nu luăm decizii bazate exclusiv pe prelucrare automatizată cu efecte juridice</li>
        <li><strong>Dreptul de a retrage consimțământul</strong> — oricând, fără a afecta legalitatea prelucrării anterioare retragerii. Retragerea se face prin: bannerul de cookie-uri (pentru marketing/analitice), link-ul de dezabonare (newsletter), sau cerere la {C.email}</li>
      </ul>

      <h2>8. Cum îți exerciți drepturile</h2>
      <p>Ai trei opțiuni:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Online:</strong> din secțiunea <Link to="/account/gdpr" className="text-accent hover:underline">Contul meu → Datele mele GDPR</Link></li>
        <li><strong>E-mail:</strong> trimite cererea la <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a> cu subiectul „Cerere GDPR"</li>
        <li><strong>Poștă:</strong> la adresa {C.name}, {C.fullAddress}</li>
      </ul>
      <p>
        Vom confirma primirea cererii în <strong>{formatDeadline("gdpr_ack")}</strong> și vom răspunde complet 
        în maximum <strong>{formatDeadline("gdpr_response")}</strong> de la primire.
      </p>

      <h2>9. Transferuri internaționale de date</h2>
      <p>
        Datele sunt stocate preponderent pe servere situate în <strong>Uniunea Europeană</strong>. 
        Platformele publicitare menționate la secțiunea 6a pot transfera date în afara SEE în baza:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Clauzelor Contractuale Standard (SCC) aprobate de Comisia Europeană</li>
        <li>Deciziei de adecvare (unde există — ex: EU-US Data Privacy Framework)</li>
      </ul>

      <h2>10. Securitatea datelor</h2>
      <p>Implementăm măsuri tehnice și organizatorice adecvate:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Criptare TLS (HTTPS) pe toate conexiunile</li>
        <li>Acces restricționat pe bază de roluri la baza de date</li>
        <li>Politici de securitate pe toate tabelele cu date sensibile</li>
        <li>Parolele sunt stocate cu hashing criptografic, nu în text clar</li>
        <li>Backup-uri automate</li>
        <li>Datele transmise prin Conversion API / Events API sunt hashed (SHA-256) înainte de transmitere</li>
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

      {/* ═══════════════════════════════════════════════════════════════
          ANEXĂ — Fișa de prelucrare date pentru platforme publicitare
          ═══════════════════════════════════════════════════════════════ */}
      {allEnabled.length > 0 && (
        <>
          <h2 id="dpa-appendix">Anexă: Fișa de prelucrare date — Platforme publicitare</h2>
          <p>
            Tabelul de mai jos detaliază, pentru fiecare platformă publicitară integrată pe site, 
            evenimentele și parametrii transmiși, scopul prelucrării, politica de retenție și 
            documentația de confidențialitate a furnizorului.
          </p>
          <p className="text-xs text-muted-foreground italic mb-4">
            Versiunea politicii de consimțământ: v{CONSENT_POLICY_VERSION}
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-2 py-1.5 font-semibold">Platformă</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Evenimente transmise</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Parametri</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Scop prelucrare</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Retenție</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Privacy / DPA</th>
                </tr>
              </thead>
              <tbody>
                {allEnabled.map((p, i) => (
                  <tr key={p.key} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                    <td className="px-2 py-1.5 font-medium">{p.label}</td>
                    <td className="px-2 py-1.5">{p.events?.join(", ") || "PageView"}</td>
                    <td className="px-2 py-1.5">{p.params?.join(", ") || "—"}</td>
                    <td className="px-2 py-1.5">Măsurare campanii, optimizare</td>
                    <td className="px-2 py-1.5">{p.retention || "Conform politica furnizorului"}</td>
                    <td className="px-2 py-1.5">
                      <a href={p.privacyUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy</a>
                      {" / "}
                      <a href={p.dpaUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">DPA</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </LegalPageShell>
  );
}
