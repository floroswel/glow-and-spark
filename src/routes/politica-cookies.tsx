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

export const Route = createFileRoute("/politica-cookies")({
  head: () => ({
    meta: [
      { title: "Politica de Cookie-uri — Mama Lucica" },
      { name: "description", content: `Politica de cookie-uri a magazinului Mama Lucica (${C.name}, CUI ${C.cui}). Informații detaliate despre cookie-urile utilizate, scopul lor și drepturile dumneavoastră.` },
      { property: "og:title", content: "Politica de Cookie-uri — Mama Lucica" },
      { property: "og:description", content: "Informații despre cookie-urile utilizate pe site-ul Mama Lucica: necesare, analitice și de marketing." },
    ],
  }),
  component: CookiePolicyPage,
});

const COOKIES_TABLE = [
  { name: "sb-*-auth-token", provider: C.site, purpose: "Sesiune de autentificare utilizator", type: "Necesar", duration: "1 an" },
  { name: "__cf_bm", provider: "Cloudflare", purpose: "Protecție anti-bot și securitate", type: "Necesar", duration: "30 min" },
  { name: "cookie_consent", provider: C.site, purpose: "Memorarea preferințelor de cookie", type: "Necesar", duration: "1 an" },
  { name: "_ga, _ga_*", provider: "Google Analytics", purpose: "Identificare vizitatori unici, analiză trafic", type: "Analitic", duration: "2 ani" },
  { name: "_gid", provider: "Google Analytics", purpose: "Distingerea vizitatorilor", type: "Analitic", duration: "24 ore" },
  { name: "_gat", provider: "Google Analytics", purpose: "Limitarea ratei de solicitări", type: "Analitic", duration: "1 minut" },
  { name: "_fbp", provider: "Meta (Facebook)", purpose: "Urmărire conversii, remarketing", type: "Marketing", duration: "3 luni" },
  { name: "_fbc", provider: "Meta (Facebook)", purpose: "Atribuirea click-urilor de pe Facebook", type: "Marketing", duration: "3 luni" },
  { name: "_gcl_au", provider: "Google Ads", purpose: "Urmărire conversii publicitare", type: "Marketing", duration: "3 luni" },
];

function CookiePolicyPage() {
  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Politica de Cookie-uri</span>
        </nav>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2 text-center">Politica de Cookie-uri</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Ultima actualizare: 1 mai 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6 [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">

          <h2>1. Operatorul site-ului</h2>
          <p>Site-ul <strong>{C.site}</strong> este operat de:</p>
          <ul className="list-none pl-0 space-y-0.5 text-sm">
            <li><strong>Denumire:</strong> {C.name}</li>
            <li><strong>CUI:</strong> {C.cui}</li>
            <li><strong>Reg. Com.:</strong> {C.regCom}</li>
            <li><strong>Sediu social:</strong> {C.address}</li>
            <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
            <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
          </ul>

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
          <p>
            Utilizarea cookie-urilor pe acest site se face în conformitate cu:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Directiva ePrivacy</strong> (2002/58/CE, modificată prin 2009/136/CE) — transpusă în legislația română prin Legea 506/2004 privind prelucrarea datelor cu caracter personal și protecția vieții private în sectorul comunicațiilor electronice</li>
            <li><strong>Regulamentul General privind Protecția Datelor (GDPR)</strong> — Regulamentul (UE) 2016/679</li>
            <li><strong>Legea 506/2004</strong> — privind prelucrarea datelor cu caracter personal și protecția vieții private în sectorul comunicațiilor electronice, cu modificările ulterioare</li>
          </ul>
          <p>
            Cookie-urile <strong>necesare</strong> sunt plasate în baza interesului legitim (art. 6(1)(f) GDPR) — fără ele site-ul 
            nu poate funcționa. Cookie-urile <strong>analitice</strong> și de <strong>marketing</strong> sunt plasate doar cu 
            <strong> consimțământul dumneavoastră explicit</strong> (art. 6(1)(a) GDPR), acordat prin bannerul de cookie-uri afișat la prima vizită.
          </p>

          <h2>4. Categorii de cookie-uri utilizate</h2>

          <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.1. Cookie-uri strict necesare</h3>
          <p>
            Sunt esențiale pentru funcționarea site-ului. Fără aceste cookie-uri, servicii precum coșul de cumpărături, 
            autentificarea și plata online nu ar funcționa. <strong>Nu necesită consimțământ</strong> și nu pot fi dezactivate.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Menținerea sesiunii de autentificare a utilizatorului</li>
            <li>Salvarea produselor adăugate în coșul de cumpărături</li>
            <li>Memorarea preferințelor de confidențialitate (consimțământ cookie-uri)</li>
            <li>Protecție CSRF și anti-bot (Cloudflare)</li>
            <li>Funcționarea procesatorului de plăți (Netopia Payments)</li>
          </ul>

          <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.2. Cookie-uri analitice / de performanță</h3>
          <p>
            Ne ajută să înțelegem cum interacționează vizitatorii cu site-ul, oferind informații agregate despre paginile 
            vizitate, timpul petrecut și eventualele erori. <strong>Sunt activate doar cu consimțământul dumneavoastră.</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Numărul de vizitatori și paginile cele mai accesate</li>
            <li>Sursa traficului (motor de căutare, rețea socială, acces direct)</li>
            <li>Durata medie a sesiunilor și rata de respingere</li>
            <li>Identificarea erorilor tehnice pentru îmbunătățirea site-ului</li>
          </ul>

          <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.3. Cookie-uri de marketing / publicitate</h3>
          <p>
            Sunt utilizate pentru a vă afișa reclame relevante în funcție de interesele dumneavoastră, atât pe acest site 
            cât și pe platforme terțe. <strong>Sunt activate doar cu consimțământul dumneavoastră.</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Afișarea de reclame personalizate pe Facebook, Instagram și Google</li>
            <li>Remarketing și retargetare pe platformele sociale</li>
            <li>Măsurarea conversiilor din campanii publicitare</li>
            <li>Limitarea frecvenței de afișare a reclamelor</li>
          </ul>

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
              accepta sau refuza categoriile opționale (analitice și marketing). Puteți modifica oricând preferințele 
              din setările de confidențialitate ale site-ului.
            </li>
            <li>
              <strong>Setările browser-ului:</strong> Majoritatea browserelor vă permit să blocați sau să ștergeți cookie-urile. 
              Consultați documentația browser-ului dumneavoastră:
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/ro/kb/protectie-imbunatatita-impotriva-urmaririi-firefox" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/ro-ro/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/ro-ro/microsoft-edge/ștergerea-cookie-urilor-din-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Microsoft Edge</a></li>
              </ul>
            </li>
            <li>
              <strong>Instrumente de opt-out ale terților:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Analytics Opt-out Browser Add-on</a></li>
                <li>Facebook: <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Setări reclame Facebook</a></li>
                <li>Your Online Choices (EU): <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.youronlinechoices.eu</a></li>
              </ul>
            </li>
          </ul>
          <p>
            <strong>Atenție:</strong> Dezactivarea cookie-urilor necesare poate afecta funcționalitatea site-ului 
            (autentificare, coș de cumpărături, procesul de plată).
          </p>

          <h2>7. Cookie-uri ale terților</h2>
          <p>
            Unele cookie-uri sunt plasate de servicii terțe care apar pe paginile noastre. Nu avem control asupra 
            acestor cookie-uri. Vă recomandăm să consultați politicile de confidențialitate ale terților respectivi:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google — Politica de confidențialitate</a></li>
            <li><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Meta (Facebook) — Politica de confidențialitate</a></li>
            <li><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Cloudflare — Politica de confidențialitate</a></li>
          </ul>

          <h2>8. Drepturile dumneavoastră</h2>
          <p>
            În conformitate cu GDPR, aveți dreptul de acces, rectificare, ștergere, restricționare, portabilitate 
            și opoziție cu privire la datele colectate prin cookie-uri. Detalii complete în{" "}
            <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link>.
          </p>
          <p>
            Pentru exercitarea drepturilor, contactați-ne la{" "}
            <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a>.
          </p>
          <p>
            Dacă considerați că drepturile dumneavoastră au fost încălcate, puteți depune o plângere la{" "}
            <strong>Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</strong> — {" "}
            <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.dataprotection.ro</a>.
          </p>

          <h2>9. Modificări ale politicii</h2>
          <p>
            Ne rezervăm dreptul de a actualiza această politică de cookie-uri. Orice modificare va fi publicată pe 
            această pagină cu data ultimei actualizări vizibilă în partea de sus. Pentru modificări semnificative, 
            vom reafișa bannerul de consimțământ.
          </p>

          <h2>10. Contact</h2>
          <p>
            Pentru orice întrebări legate de politica noastră de cookie-uri sau de modul în care utilizăm datele 
            dumneavoastră, ne puteți contacta:
          </p>
          <ul className="list-none pl-0 space-y-0.5 text-sm">
            <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
            <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
            <li><strong>Adresă:</strong> {C.name}, {C.address}</li>
          </ul>
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
