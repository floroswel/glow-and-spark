import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { getEnabledPlatforms, ESSENTIAL_COOKIES, CONSENT_POLICY_VERSION } from "@/config/marketing-tech";

const LAST_UPDATE = "2026-05-02";

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
  const { general } = useSiteSettings();

  const analyticsPlatforms = getEnabledPlatforms(general, "analytics");
  const marketingPlatforms = getEnabledPlatforms(general, "marketing");
  const allEnabled = getEnabledPlatforms(general);

  // Build dynamic cookie table from enabled platforms + essential
  const cookieRows = [
    ...ESSENTIAL_COOKIES.map((c) => ({ ...c, type: "Necesar" as const })),
    ...analyticsPlatforms.flatMap((p) =>
      p.cookies.map((c) => ({ name: c.name, provider: p.label, purpose: c.purpose, type: "Analitic" as const, duration: c.duration }))
    ),
    ...marketingPlatforms.flatMap((p) =>
      p.cookies.map((c) => ({ name: c.name, provider: p.label, purpose: c.purpose, type: "Marketing" as const, duration: c.duration }))
    ),
  ];

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

      <h2>3. Temeiul legal</h2>
      <p>[VERIFICARE_AVOCAT — temeiurile juridice exacte pentru cookie-uri trebuie confirmate de un avocat]</p>
      <p>
        Cookie-urile <strong>necesare</strong> sunt plasate în baza interesului legitim — fără ele site-ul 
        nu poate funcționa. Cookie-urile <strong>analitice</strong> și de <strong>marketing</strong> sunt plasate doar cu 
        <strong> consimțământul dumneavoastră explicit</strong>, acordat prin bannerul de cookie-uri afișat la prima vizită.
      </p>

      <h2>4. Categorii de cookie-uri utilizate</h2>

      <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.1. Cookie-uri strict necesare</h3>
      <p>
        Sunt esențiale pentru funcționarea site-ului. <strong>Nu necesită consimțământ</strong> și nu pot fi dezactivate.
      </p>

      {analyticsPlatforms.length > 0 && (
        <>
          <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.2. Cookie-uri analitice / de performanță</h3>
          <p>
            Aceste cookie-uri sunt setate <strong>doar dacă</strong> administratorul site-ului a configurat un ID de tracking 
            <strong> și</strong> dumneavoastră ați acceptat categoria „Analitice" în bannerul de consimțământ.
          </p>
          <p>Platforme analitice active:</p>
          <ul className="list-disc pl-5 space-y-1">
            {analyticsPlatforms.map((p) => (
              <li key={p.key}><strong>{p.label}</strong> — {p.euEntity}</li>
            ))}
          </ul>
        </>
      )}

      {marketingPlatforms.length > 0 && (
        <>
          <h3 className="text-foreground font-semibold text-lg mt-6 mb-2">4.3. Cookie-uri de marketing</h3>
          <p>
            Cookie-urile de marketing sunt setate <strong>doar dacă</strong> administratorul site-ului a configurat un Pixel/Tag ID 
            <strong> și</strong> dumneavoastră ați acceptat categoria „Marketing" în bannerul de consimțământ.
          </p>
          <p>Platforme de marketing active:</p>
          <ul className="list-disc pl-5 space-y-1">
            {marketingPlatforms.map((p) => (
              <li key={p.key}><strong>{p.label}</strong> — {p.euEntity}</li>
            ))}
          </ul>
        </>
      )}

      {allEnabled.length === 0 && (
        <p className="text-muted-foreground italic mt-4">
          În prezent, nicio platformă analitică sau de marketing nu este configurată pe site. 
          Doar cookie-urile esențiale sunt utilizate.
        </p>
      )}

      <p className="text-xs text-muted-foreground/70 italic mt-4">
        [VERIFY_REAL_SCRIPTS — Dacă adăugați noi servicii terțe, actualizați configurarea din admin și această pagină se va actualiza automat]
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
            {cookieRows.map((c, i) => (
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

      <h2>6. Cum vă gestionați preferințele</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Bannerul de consimțământ:</strong> La prima vizită, vi se afișează un banner prin care puteți accepta sau refuza categoriile opționale. Consimțământul este jurnalizat cu timestamp și versiunea politicii (v{CONSENT_POLICY_VERSION}).</li>
        <li><strong>Setările browser-ului:</strong> Majoritatea browserelor vă permit să blocați sau să ștergeți cookie-urile.</li>
        <li>
          <strong>Instrumente de opt-out ale terților:</strong>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>Google: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Analytics Opt-out</a></li>
            <li>Your Online Choices (EU): <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.youronlinechoices.eu</a></li>
            {allEnabled.map((p) => (
              <li key={p.key}>{p.label}: <a href={p.privacyUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Settings</a></li>
            ))}
          </ul>
        </li>
      </ul>

      <h2>7. Drepturile dumneavoastră</h2>
      <p>
        Detalii complete în{" "}
        <Link to="/politica-confidentialitate" className="text-accent hover:underline">Politica de Confidențialitate</Link>.
        Plângeri la <strong>ANSPDCP</strong> — <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.dataprotection.ro</a>.
      </p>

      <h2>8. Contact</h2>
      <ul className="list-none pl-0 space-y-0.5 text-sm">
        <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
        <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
        <li><strong>Adresă:</strong> {C.name}, {C.fullAddress}</li>
      </ul>

    </LegalPageShell>
  );
}
