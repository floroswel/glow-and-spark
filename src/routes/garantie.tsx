import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { CANONICAL_DEADLINES } from "@/lib/compliance";

export const Route = createFileRoute("/garantie")({
  head: () => ({
    meta: [
      { title: "Garanția produselor — Mama Lucica" },
      { name: "description", content: "Informații despre garanția legală de conformitate și calitatea produselor Mama Lucica — 2 ani garanție conform legislației UE." },
    ],
  }),
  component: GarantiePage,
});

function GarantiePage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell
      title="Garanția produselor"
      breadcrumb="Garanție"
      lastUpdate="2026-05-04"
    >

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Calitatea produselor</h2>
        <p>
          Toate produsele comercializate pe <strong>mamalucica.ro</strong> sunt realizate manual,
          din ingrediente de calitate. Verificăm fiecare produs înainte de expediere pentru a ne
          asigura că respectă standardele noastre de calitate.
        </p>

        <h2 className="text-xl font-semibold">Garanție legală de conformitate</h2>
        <p>
          Conform legislației românești (OUG 21/1992, Legea 449/2003) și a Directivei UE 2019/771, 
          produsele beneficiază de o garanție legală de conformitate de <strong>2 ani</strong> de la 
          data livrării. Aceasta înseamnă că produsele trebuie să corespundă descrierii de pe site 
          și să fie lipsite de defecte de fabricație.
        </p>
        <p>
          Dacă un produs prezintă defecte de conformitate în perioada de garanție, aveți dreptul la:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Reparare gratuită</strong> a produsului</li>
          <li><strong>Înlocuire</strong> cu un produs conform</li>
          <li><strong>Reducere proporțională a prețului</strong></li>
          <li><strong>Rambursare integrală</strong> (în cazul în care repararea sau înlocuirea nu sunt posibile)</li>
        </ul>

        <h2 className="text-xl font-semibold">Dreptul de retragere</h2>
        <p>
          Conform OUG 34/2014, beneficiați de un drept de retragere de{" "}
          <strong>{CANONICAL_DEADLINES.withdrawal.days} zile calendaristice</strong> de la
          primirea produsului, fără a invoca un motiv. Consultați{" "}
          <a href="/politica-returnare" className="text-accent hover:underline">
            Politica de returnare
          </a>{" "}
          pentru detalii complete.
        </p>

        <h2 className="text-xl font-semibold">Cum depui o reclamație</h2>
        <p>
          Pentru orice problemă legată de calitatea sau conformitatea produselor, ne puteți contacta la:
        </p>
        <ul className="list-none pl-0 space-y-0.5 text-sm">
          <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
          <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Vă rugăm să includeți: numărul comenzii, fotografii ale produsului/defectului și o descriere 
          a problemei. Vom răspunde în maximum 5 zile lucrătoare.
        </p>

        <h2 className="text-xl font-semibold">Autorități competente</h2>
        <p>
          Dacă nu sunteți mulțumit de soluția oferită, puteți contacta:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>ANPC</strong> — Autoritatea Națională pentru Protecția Consumatorilor:{" "}
            <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://anpc.ro</a>
          </li>
          <li>
            <strong>SAL</strong> — Soluționarea Alternativă a Litigiilor:{" "}
            <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://anpc.ro/ce-este-sal/</a>
          </li>
          <li>
            <strong>SOL/ODR</strong> — Platforma online a UE:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://ec.europa.eu/consumers/odr</a>
          </li>
        </ul>
      </section>

      <section className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold mb-2">Date comerciale</h2>
        <CompanyIdentityBlock C={C} />
      </section>
    </LegalPageShell>
  );
}
