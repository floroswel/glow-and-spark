import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

export const Route = createFileRoute("/siguranta-produse")({
  head: () => ({
    meta: [
      { title: "Siguranță și utilizare produse — Mama Lucica" },
      { name: "description", content: "Informații privind siguranța produselor Mama Lucica — avertizări de utilizare pentru lumânări, cum raportezi o neconformitate." },
      { property: "og:title", content: "Siguranță și utilizare produse — Mama Lucica" },
      { property: "og:description", content: "Avertizări de siguranță, instrucțiuni de utilizare și cum raportezi o neconformitate." },
    ],
  }),
  component: SigurantaProdusePage,
});

function SigurantaProdusePage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell title="Siguranță și utilizare produse" breadcrumb="Siguranță produse">
      <p>
        Produsele comercializate de <strong>{C.name}</strong> sunt destinate utilizării casnice.
        Vă rugăm să citiți cu atenție instrucțiunile de mai jos pentru o utilizare sigură.
      </p>

      <h2>🕯️ Instrucțiuni de siguranță pentru lumânări</h2>
      <ul>
        <li>Aprindeți lumânarea doar pe o <strong>suprafață stabilă, plană și rezistentă la căldură</strong>.</li>
        <li>Nu lăsați niciodată o lumânare aprinsă <strong>nesupravegheată</strong>.</li>
        <li>Țineți lumânările la distanță de <strong>copii și animale de companie</strong>.</li>
        <li>Nu amplasați lumânări lângă <strong>materiale inflamabile</strong> (perdele, cărți, hârtie, textile).</li>
        <li>Asigurați o distanță de minim <strong>10 cm</strong> între lumânări aprinse.</li>
        <li>Nu mutați o lumânare aprinsă sau cu ceara topită — riscul de arsuri este ridicat.</li>
        <li>Stingeți lumânarea cu un <strong>stingător de lumânări</strong> sau prin suflare ușoară; nu utilizați apă.</li>
        <li>Tăiați fitilul la <strong>5-7 mm</strong> înainte de fiecare aprindere.</li>
        <li>Nu ardeți lumânarea mai mult de <strong>3-4 ore</strong> consecutiv.</li>
        <li>Nu ardeți lumânarea până la baza recipientului — opriți la <strong>~1 cm</strong> de fund.</li>
      </ul>

      <h2>⚠️ Avertizări generale</h2>
      <ul>
        <li>Produsele sunt destinate exclusiv <strong>utilizării decorative și aromate</strong>.</li>
        <li>Utilizarea necorespunzătoare poate cauza <strong>incendii sau arsuri</strong>.</li>
        <li>Păstrați produsele în ambalajul original, într-un loc răcoros și uscat.</li>
      </ul>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-5 not-prose">
        <p className="font-semibold text-foreground text-sm">
          Textul de pe această pagină are caracter informativ și trebuie verificat cu un specialist
          în siguranța produselor. Instrucțiunile specifice se regăsesc pe etichetele fiecărui produs.
        </p>
      </div>

      <h2>Raportarea unei neconformități</h2>
      <p>
        Dacă ați identificat un defect, o neconformitate sau un risc legat de un produs achiziționat
        de la noi, vă rugăm să ne contactați imediat:
      </p>
      <ul>
        <li>
          <strong>E-mail:</strong>{" "}
          <a href={`mailto:${C.email}`}>{C.email}</a>
        </li>
        <li>
          <strong>Telefon:</strong>{" "}
          <a href={`tel:${C.phone.replace(/\s/g, "")}`}>{C.phone}</a>
        </li>
      </ul>
      <p>
        Includeți în sesizare: numărul comenzii, fotografii ale produsului și descrierea problemei.
        Vom analiza situația și vom reveni cu un răspuns în maxim <strong>48 de ore lucrătoare</strong>.
      </p>

      <h2>Responsabilitatea vânzătorului</h2>
      <p>
        Produsele sunt vândute direct de <strong>{C.name}</strong> (CUI: {C.cui}).
        Suntem singurul responsabil pentru produsele comercializate pe acest site.
      </p>

      <h2>Autorități relevante</h2>
      <p>
        Pentru sesizări privind siguranța produselor, puteți contacta și{" "}
        <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-accent underline">
          Autoritatea Națională pentru Protecția Consumatorilor (ANPC)
        </a>.
      </p>
    </LegalPageShell>
  );
}
