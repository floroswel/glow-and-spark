import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatDeadline, GDPR_RESPONSE_DAYS, GDPR_ACK_DAYS } from "@/lib/compliance";
import { getEnabledPlatforms, CONSENT_POLICY_VERSION } from "@/config/marketing-tech";

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
      <p>
        Pentru a măsura eficiența campaniilor publicitare și a optimiza conținutul reclamelor, 
        utilizăm instrumente terțe de tracking furnizate de platformele publicitare enumerate mai jos. 
        Aceste instrumente pot colecta date prin <strong>pixeli (scripturi)</strong> încărcate în browser 
        și, unde este cazul, prin <strong>integrări server-to-server (Conversion API / CAPI)</strong>.
      </p>
      <p>Instrumentele sunt activate <strong>doar dacă</strong>:</p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Administratorul site-ului a configurat un ID de tracking valid pentru platforma respectivă;</li>
        <li>Vizitatorul a acordat <strong>consimțământ explicit</strong> pentru categoria „Marketing" în bannerul de cookie-uri.</li>
      </ol>
      <p>Platforme utilizate sau care pot fi activate [VERIFICARE_AVOCAT — confirmați lista finală]:</p>
      <div className="overflow-x-auto rounded-lg border border-border my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-semibold">Platformă</th>
              <th className="text-left px-3 py-2 font-semibold">Instrument</th>
              <th className="text-left px-3 py-2 font-semibold">Tip date colectate</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="bg-card"><td className="px-3 py-2">Meta (Facebook/Instagram)</td><td className="px-3 py-2">Facebook Pixel + Conversions API</td><td className="px-3 py-2">Evenimente: PageView, ViewContent, AddToCart, Purchase; cookie _fbp, _fbc</td></tr>
            <tr className="bg-secondary/20"><td className="px-3 py-2">Google</td><td className="px-3 py-2">Google Analytics 4 / Google Tag Manager / Google Ads</td><td className="px-3 py-2">Evenimente e-commerce GA4; cookies _ga, _gid, _gat, _gcl_au</td></tr>
            <tr className="bg-card"><td className="px-3 py-2">TikTok</td><td className="px-3 py-2">TikTok Pixel + Events API</td><td className="px-3 py-2">Evenimente: PageView, ViewContent, AddToCart, CompletePayment; cookie _ttp</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground italic">
        [VERIFICARE_AVOCAT — Dacă adăugați alte platforme publicitare (ex: Pinterest, Snapchat, Microsoft Ads), actualizați această secțiune și tabelul de cookie-uri din <Link to="/politica-cookies" className="text-accent hover:underline">Politica de Cookie-uri</Link>]
      </p>

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
      <p className="text-xs text-muted-foreground italic">
        [VERIFY_IMPLEMENTATION — Funcționalitățile „Customer Match" (Google) / „Custom Audiences din liste" (Meta) / upload de liste hashed de e-mail 
        <strong> NU sunt implementate în prezent</strong> în cod. Dacă le activați manual în platformele publicitare, actualizați această secțiune 
        și adăugați temeiul legal corespunzător cu [VERIFICARE_AVOCAT].]
      </p>
      <p>
        Puteți opri afișarea reclamelor personalizate retragând consimțământul pentru cookie-uri de marketing 
        sau utilizând setările de confidențialitate ale fiecărei platforme (ex: „Your Ad Choices", setări Facebook Ads, Google Ad Settings, TikTok Privacy).
      </p>

      <h2>4. Temeiul legal al prelucrării</h2>
      <p>[VERIFICARE_AVOCAT — temeiurile juridice trebuie confirmate de un avocat specializat în protecția datelor]</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Executarea contractului</strong> (art. 6(1)(b) GDPR) — pentru procesarea comenzilor, livrare și facturare</li>
        <li><strong>Obligație legală</strong> (art. 6(1)(c) GDPR) — pentru evidențe fiscale și contabile</li>
        <li>
          <strong>Consimțământ</strong> (art. 6(1)(a) GDPR) — pentru:
          <ul className="list-disc pl-5 mt-1">
            <li>Newsletter și comunicări promoționale</li>
            <li>Cookie-uri analitice și de marketing</li>
            <li>Pixeli publicitari (Facebook, Google, TikTok) — încărcarea scripturilor ȘI transmiterea de date</li>
            <li>Audiențe personalizate pe baza activității pe site</li>
          </ul>
        </li>
        <li>
          <strong>Interes legitim</strong> (art. 6(1)(f) GDPR) — pentru:
          <ul className="list-disc pl-5 mt-1">
            <li>Prevenirea fraudei și securitatea site-ului</li>
            <li>Îmbunătățirea serviciilor (analiză internă fără tracking terț)</li>
            <li>[VERIFICARE_AVOCAT — evaluați dacă remarketing/CAPI pe baza interesului legitim este acceptabil în contextul dvs. sau dacă este necesar consimțământ pentru toate operațiunile de marketing]</li>
          </ul>
        </li>
      </ul>

      <h2>5. Durata stocării datelor</h2>
      <p>[VERIFICARE_AVOCAT — duratele de stocare trebuie validate cu un contabil/avocat]</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Date de comandă și facturare: conform obligațiilor legale fiscale aplicabile</li>
        <li>Date de cont client: până la ștergerea contului de către utilizator sau la solicitarea explicită de ștergere</li>
        <li>Date de newsletter: până la retragerea consimțământului (dezabonare)</li>
        <li>Date de suport/reclamații: conform termenelor legale aplicabile</li>
        <li>Cookies: conform duratelor specificate în <Link to="/politica-cookies" className="text-accent hover:underline">Politica de Cookies</Link></li>
        <li>Jurnale de securitate (IP, încercări de autentificare): <strong>90 de zile</strong></li>
        <li><strong>Date publicitare și de remarketing:</strong> cookie-urile de marketing expiră conform duratelor din tabelul de cookie-uri; datele transmise către platforme (Meta, Google, TikTok) sunt reținute conform politicilor proprii ale fiecărei platforme. [VERIFICARE_AVOCAT — confirmați alinierea cu GDPR]</li>
        <li><strong>Consimțământ cookie/marketing:</strong> jurnalele de consimțământ sunt păstrate cel puțin pe durata în care datele sunt prelucrate pe baza consimțământului respectiv</li>
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
      <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">6a. Parteneri publicitari și de analiză</h3>
      <p>
        Următorii furnizori pot primi date personale (identificatori de cookie, adrese IP trunchiate, date de evenimente) 
        în calitate de <strong>operatori asociați sau operatori independenți</strong>, conform condițiilor contractuale proprii 
        [VERIFICARE_AVOCAT — verificați dacă fiecare platformă acționează ca operator independent sau operator asociat]:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Meta Platforms Ireland Ltd.</strong> — Facebook Pixel, Conversions API, Custom Audiences (sediu UE: Dublin, Irlanda)</li>
        <li><strong>Google Ireland Ltd.</strong> — Google Analytics 4, Google Tag Manager, Google Ads (sediu UE: Dublin, Irlanda)</li>
        <li><strong>TikTok Technology Ltd.</strong> — TikTok Pixel, TikTok Events API (sediu UE: Dublin, Irlanda) [VERIFICARE_AVOCAT — verificați transferurile de date către TikTok și mecanismele de protecție adecvate]</li>
      </ul>
      <p className="text-xs text-muted-foreground italic">
        Datele sunt transmise către acești parteneri <strong>numai dacă</strong> vizitatorul a acordat consimțământ pentru cookie-uri de marketing. 
        Transmiterile de date includ, după caz, hashing-ul datelor (SHA-256) înainte de upload.
      </p>
      <p className="mt-2"><strong>Nu vindem, nu închiriem și nu transmitem datele personale către terți în scopuri de marketing propriu, altele decât cele menționate mai sus.</strong></p>

      <h2>7. Drepturile tale conform GDPR</h2>
      <p>Ai următoarele drepturi prevăzute de legislația privind protecția datelor:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Dreptul de acces</strong> — poți solicita o copie a tuturor datelor tale personale pe care le prelucrăm</li>
        <li><strong>Dreptul la rectificare</strong> — poți solicita corectarea datelor inexacte sau completarea celor incomplete</li>
        <li><strong>Dreptul la ștergere</strong> — „dreptul de a fi uitat" — poți solicita ștergerea datelor, cu excepția celor a căror păstrare este impusă de lege</li>
        <li><strong>Dreptul la restricționarea prelucrării</strong> — poți solicita limitarea prelucrării în anumite situații</li>
        <li><strong>Dreptul la portabilitatea datelor</strong> — poți solicita primirea datelor într-un format structurat, utilizat în mod curent</li>
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
        <li>Deciziei de adecvare (unde există — ex: EU-US Data Privacy Framework pentru Google și Meta)</li>
        <li>[VERIFICARE_AVOCAT — verificați mecanismele de transfer specifice pentru TikTok și orice alt partener din afara SEE]</li>
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
          (Data Processing Addendum — Appendix)
          ═══════════════════════════════════════════════════════════════ */}
      <h2 id="dpa-appendix">Anexă: Fișa de prelucrare date — Platforme publicitare</h2>
      <p>
        Tabelul de mai jos detaliază, pentru fiecare platformă publicitară integrată pe site, 
        evenimentele și parametrii transmiși, scopul prelucrării, politica de retenție și 
        documentația de confidențialitate a furnizorului.
      </p>
      <p className="text-xs text-muted-foreground italic mb-4">
        Datele sunt transmise <strong>exclusiv</strong> după obținerea consimțământului vizitatorului pentru cookie-uri de marketing 
        ȘI configurarea unui ID de tracking valid de către administrator.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-semibold text-foreground">Platformă</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Evenimente transmise</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Parametri / Date</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Scop</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Retenție</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Documentație</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {/* ── Meta (Facebook / Instagram) ── */}
            <tr className="bg-card align-top">
              <td className="px-3 py-2 font-medium" rowSpan={2}>
                <strong>Meta</strong><br />
                <span className="text-muted-foreground">(Facebook / Instagram)</span>
              </td>
              <td className="px-3 py-2">
                <code>PageView</code>, <code>ViewContent</code>, <code>AddToCart</code>, <code>InitiateCheckout</code>, <code>Purchase</code>
              </td>
              <td className="px-3 py-2">
                content_type, content_ids, content_name, content_category, value, currency (RON), num_items.<br />
                <strong>Nu se transmit</strong>: adrese de e-mail, nume, telefon prin pixel browser.
              </td>
              <td className="px-3 py-2">Măsurare conversii, optimizare campanii, retargetare vizitatori site</td>
              <td className="px-3 py-2">[LEGAL — Conform politicii Meta; implicit 2 ani pentru date de evenimente. Verificați cu avocatul.]</td>
              <td className="px-3 py-2">
                <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Policy</a>{", "}
                <a href="https://www.facebook.com/legal/terms/dataprocessing" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Data Processing Terms</a>
              </td>
            </tr>
            <tr className="bg-card align-top border-t border-border/30">
              <td className="px-3 py-2 text-muted-foreground" colSpan={5}>
                <strong>Customer Match / Custom Audiences din liste:</strong> NU este implementat în codul site-ului. 
                Dacă operatorul încarcă manual liste (email hashed SHA-256) în Meta Business Suite, 
                această prelucrare trebuie documentată separat. [VERIFY_IMPLEMENTATION]
              </td>
            </tr>

            {/* ── Google ── */}
            <tr className="bg-secondary/20 align-top">
              <td className="px-3 py-2 font-medium" rowSpan={2}>
                <strong>Google</strong><br />
                <span className="text-muted-foreground">(Analytics / Ads / GTM)</span>
              </td>
              <td className="px-3 py-2">
                <code>view_item</code>, <code>add_to_cart</code>, <code>begin_checkout</code>, <code>purchase</code>
              </td>
              <td className="px-3 py-2">
                item_id, item_name, price, quantity, currency (RON), transaction_id, value.<br />
                <strong>Nu se transmit</strong>: date PII necriptate prin GA4/GTM.
              </td>
              <td className="px-3 py-2">Analiză trafic, măsurare conversii Google Ads, optimizare campanii</td>
              <td className="px-3 py-2">[LEGAL — GA4 implicit 14 luni; Google Ads conform contractului. Verificați cu avocatul.]</td>
              <td className="px-3 py-2">
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Policy</a>{", "}
                <a href="https://business.safety.google/processorterms/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Data Processing Terms</a>
              </td>
            </tr>
            <tr className="bg-secondary/20 align-top border-t border-border/30">
              <td className="px-3 py-2 text-muted-foreground" colSpan={5}>
                <strong>Customer Match:</strong> NU este implementat în codul site-ului. 
                Dacă operatorul încarcă manual liste (email hashed) în Google Ads, 
                documentați separat. [VERIFY_IMPLEMENTATION]
              </td>
            </tr>

            {/* ── TikTok ── */}
            <tr className="bg-card align-top">
              <td className="px-3 py-2 font-medium">
                <strong>TikTok</strong><br />
                <span className="text-muted-foreground">(TikTok for Business)</span>
              </td>
              <td className="px-3 py-2">
                <code>page</code> (PageView)<br />
                <span className="text-muted-foreground">
                  [VERIFY_IMPLEMENTATION — Evenimente suplimentare (ViewContent, AddToCart, CompletePayment) 
                  pot fi adăugate prin <code>trackTikTokEvent()</code> în cod. La acest moment, doar PageView este activ automat.]
                </span>
              </td>
              <td className="px-3 py-2">
                Parametri impliciti SDK: URL pagină, referrer, user agent, IP (trunchiat de TikTok).<br />
                <strong>Nu se transmit</strong>: date PII din cod.
              </td>
              <td className="px-3 py-2">Măsurare conversii TikTok Ads, retargetare vizitatori</td>
              <td className="px-3 py-2">[LEGAL — Conform politicii TikTok; verificați cu avocatul. Cookie _ttp: 13 luni.]</td>
              <td className="px-3 py-2">
                <a href="https://www.tiktok.com/legal/page/global/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Policy</a>{", "}
                <a href="https://ads.tiktok.com/i18n/official/policy/business-products-terms" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Business Products Terms</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground italic">
        [VERIFICARE_AVOCAT — Acest tabel este documentație tehnică, nu consiliere juridică. 
        Verificați cu avocatul dacă este necesară o anexă separată DPA (Data Processing Addendum) 
        semnată cu fiecare furnizor. Majoritatea platformelor mari oferă DPA standard acceptat prin 
        utilizarea serviciului (click-through).]
      </p>
      <p className="text-xs text-muted-foreground italic">
        [VERIFY_IMPLEMENTATION — Dacă adăugați Conversion API (CAPI) server-side pentru Meta sau TikTok Events API, 
        actualizați coloana „Parametri / Date" deoarece CAPI poate transmite date suplimentare (email hashed, IP server-side, user agent).]
      </p>

    </LegalPageShell>
  );
}
