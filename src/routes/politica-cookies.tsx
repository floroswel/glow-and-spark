import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

const LAST_UPDATE = "2026-05-02";

const COOKIES_TABLE = [
  // ── Necesare ──
  { name: "sb-*-auth-token", provider: "mamalucica.ro", purpose: "Sesiune de autentificare utilizator", type: "Necesar", duration: "1 an" },
  { name: "__cf_bm", provider: "Cloudflare", purpose: "Protecție anti-bot și securitate", type: "Necesar", duration: "30 min" },
  { name: "cookie_consent", provider: "mamalucica.ro (localStorage)", purpose: "Memorarea preferințelor de cookie", type: "Necesar", duration: "Permanent (localStorage)" },
  // ── Analitice — încărcate DOAR dacă admin configurează un ID GA4/GTM ȘI vizitatorul acceptă ──
  { name: "_ga, _ga_*", provider: "Google Analytics", purpose: "Identificare vizitatori unici, analiză trafic", type: "Analitic", duration: "2 ani" },
  { name: "_gid", provider: "Google Analytics", purpose: "Distingerea vizitatorilor", type: "Analitic", duration: "24 ore" },
  { name: "_gat", provider: "Google Analytics", purpose: "Limitarea ratei de solicitări", type: "Analitic", duration: "1 minut" },
  // ── Marketing — încărcate DOAR dacă admin configurează Pixel ID ȘI vizitatorul acceptă ──
  { name: "_fbp", provider: "Meta (Facebook Pixel)", purpose: "Urmărire conversii, remarketing", type: "Marketing", duration: "3 luni" },
  { name: "_fbc", provider: "Meta (Facebook Pixel)", purpose: "Atribuirea click-urilor de pe Facebook", type: "Marketing", duration: "3 luni" },
  { name: "_ttp", provider: "TikTok Pixel", purpose: "Identificare vizitatori unici pentru remarketing TikTok", type: "Marketing", duration: "13 luni" },
  { name: "_tt_enable_cookie", provider: "TikTok Pixel", purpose: "Verificarea suportului de cookie-uri", type: "Marketing", duration: "13 luni" },
  { name: "ttq_*", provider: "TikTok Pixel", purpose: "Urmărire conversii și atribuire TikTok Ads", type: "Marketing", duration: "Sesiune / 13 luni" },
  // NOTA: Google Ads (_gcl_au) va fi adăugat DOAR dacă se configurează Google Ads. [VERIFY_REAL_SCRIPTS]
];

export const Route = createFileRoute("/politica-cookies")({
  head: () => ({
    meta: [
      { title: "Politica de Cookie-uri — Mama Lucica" },
      { name: "description", content: "Politica de cookie-uri a magazinului Mama Lucica. Informații detaliate despre cookie-urile utilizate, scopul lor și drepturile dumneavoastră." },
      { property: "og:title", content: "Politica de Cookie-uri — Mama Lucica" },
      { property: "og:description", content: "Informații despre cookie-urile utilizate pe site-ul Mama Lucica: necesare, analitice și de marketing." },
    ],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell title="Politica de Cookie-uri" breadcrumb="Politica de Cookie-uri" lastUpdate={LAST_UPDATE}>

      <h2>1. Operatorul site-ului</h2>
      <p>Site-ul <strong>{C.site}</strong> este operat de:</p>
      <CompanyIdentityBlock C={C} />

      <h2>2. Ce sunt cookie-urile?</h2>
      <p>
        Cookie-urile sunt fișiere text de mici dimensiuni stocate pe dispozitivul dumneavoastră (computer, telefon, tabletă) 
        atunci când vizitați un site web. Acestea sunt utilizate pe scară largă pentru a face site-urile web să funcționeze 
        sau să funcționeze mai eficient, precum și pentru a furniza informații proprietarilor site-ului.
      </p>
      <p>
        Cookie-urile nu pot accesa alte informații de pe dispozitivul dumneavoastră, nu conțin viruși și nu pot 
        instala programe malware.
      </p>

      <h2>3. Temeiul legal</h2>
      <p>[VERIFICARE_AVOCAT — temeiurile juridice exacte pentru cookie-uri trebuie confirmate de un avocat]</p>
      <p>
        Utilizarea cookie-urilor pe acest site se face în conformitate cu legislația aplicabilă privind comunicațiile electronice și protecția datelor personale.
      </p>
      <p>
        Cookie-urile <strong>necesare</strong> sunt plasate în baza interesului legitim — fără ele site-ul 
        nu poate funcționa. Cookie-urile <strong>analitice</strong> și de <strong>marketing</strong> sunt plasate doar cu 
        <strong> consimțământul dumneavoastră explicit</strong>, acordat prin bannerul de cookie-uri afișat la prima vizită.
      </p>

      <h2>4. Categorii de cookie-uri utilizate</h2>

      <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.1. Cookie-uri strict necesare</h3>
      <p>
        Sunt esențiale pentru funcționarea site-ului. Fără aceste cookie-uri, servicii precum coșul de cumpărături, 
        autentificarea și plata online nu ar funcționa. <strong>Nu necesită consimțământ</strong> și nu pot fi dezactivate.
      </p>

      <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.2. Cookie-uri analitice / de performanță</h3>
      <p>
        Aceste cookie-uri sunt setate <strong>doar dacă</strong> administratorul site-ului a configurat un ID Google Analytics (GA4 sau GTM) 
        <strong> și</strong> dumneavoastră ați acceptat categoria „Analitice" în bannerul de consimțământ. 
        Dacă niciun ID nu este configurat, scriptul Google Analytics nu se încarcă și niciun cookie analitic nu este plasat.
      </p>

      <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.3. Cookie-uri de marketing</h3>
      <p>
        Cookie-urile de marketing sunt utilizate pentru urmărirea conversiilor și remarketing. Acestea sunt setate 
        <strong> doar dacă</strong> administratorul site-ului a configurat un Pixel ID pentru platforma respectivă 
        <strong> și</strong> dumneavoastră ați acceptat categoria „Marketing" în bannerul de consimțământ.
      </p>
      <p>Platformele de marketing configurabile:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Meta (Facebook/Instagram):</strong> Facebook Pixel — script de la connect.facebook.net, setează _fbp, _fbc</li>
        <li><strong>Google Ads:</strong> dacă este configurat prin GTM, poate seta _gcl_au [VERIFY_REAL_SCRIPTS — adăugați doar dacă există ID Google Ads configurat]</li>
        <li><strong>TikTok:</strong> TikTok Pixel — script de la analytics.tiktok.com, setează _ttp, _tt_enable_cookie, ttq_*</li>
      </ul>
      <p className="text-xs text-muted-foreground/70 italic">
        [VERIFY_REAL_SCRIPTS — Dacă adăugați noi servicii terțe (ex: Pinterest Pixel, Snapchat Pixel, Microsoft UET), actualizați această pagină și tabelul de mai jos]
      </p>

      <h2>5. Lista detaliată a cookie-urilor</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-semibold text-foreground">Nume</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Furnizor</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Scop</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Categorie</th>
              <th className="text-left px-3 py-2 font-semibold text-foreground">Durată</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES_TABLE.map((c, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-secondary/20"}>
                <td className="px-3 py-2 font-mono text-xs text-foreground">{c.name}</td>
                <td className="px-3 py-2">{c.provider}</td>
                <td className="px-3 py-2">{c.purpose}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.type === "Necesar" ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                    c.type === "Analitic" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400" :
                    "bg-orange-500/10 text-orange-700 dark:text-orange-400"
                  }`}>
                    {c.type}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground/70">
        * Această listă este actualizată periodic. Cookie-uri suplimentare pot fi adăugate de furnizorii terți enumerați mai sus.
      </p>

      <h2>6. Cum vă gestionați preferințele</h2>
      <p>Aveți mai multe opțiuni pentru a controla cookie-urile:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Bannerul de consimțământ:</strong> La prima vizită pe site, vi se afișează un banner prin care puteți 
          accepta sau refuza categoriile opționale (analitice și marketing). Consimțământul este jurnalizat cu timestamp și versiunea politicii.
        </li>
        <li>
          <strong>Setările browser-ului:</strong> Majoritatea browserelor vă permit să blocați sau să ștergeți cookie-urile.
        </li>
        <li>
          <strong>Instrumente de opt-out ale terților:</strong>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Analytics Opt-out</a></li>
            <li>Your Online Choices (EU): <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.youronlinechoices.eu</a></li>
            <li>TikTok: <a href="https://www.tiktok.com/legal/page/global/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">TikTok Privacy Settings</a></li>
          </ul>
        </li>
      </ul>
      <p>
        <strong>Atenție:</strong> Dezactivarea cookie-urilor necesare poate afecta funcționalitatea site-ului.
      </p>

      <h2>7. Drepturile dumneavoastră</h2>
      <p>
        În conformitate cu legislația privind protecția datelor, aveți dreptul de acces, rectificare, ștergere, restricționare, portabilitate 
        și opoziție cu privire la datele colectate prin cookie-uri. Detalii complete în{" "}
        <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link>.
      </p>
      <p>
        Pentru exercitarea drepturilor, contactați-ne la{" "}
        <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a>.
      </p>
      <p>
        Puteți depune o plângere la{" "}
        <strong>ANSPDCP</strong> — {" "}
        <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.dataprotection.ro</a>.
      </p>

      <h2>8. Modificări ale politicii</h2>
      <p>
        Ne rezervăm dreptul de a actualiza această politică de cookie-uri. Orice modificare va fi publicată pe 
        această pagină cu data ultimei actualizări vizibilă în partea de sus.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pentru orice întrebări legate de politica noastră de cookie-uri:
      </p>
      <ul className="list-none pl-0 space-y-0.5 text-sm">
        <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
        <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
        <li><strong>Adresă:</strong> {C.name}, {C.fullAddress}</li>
      </ul>

    </LegalPageShell>
  );
}
