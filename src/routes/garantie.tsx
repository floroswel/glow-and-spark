import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock, DraftBanner } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { CANONICAL_DEADLINES } from "@/lib/compliance";

export const Route = createFileRoute("/garantie")({
  head: () => ({
    meta: [
      { title: "Garanția produselor — Mama Lucica" },
      { name: "description", content: "Informații despre garanția și calitatea produselor Mama Lucica." },
    ],
  }),
  component: GarantiePage,
});

function GarantiePage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell
      title="Garanția produselor"
      breadcrumbs={[{ label: "Acasă", href: "/" }, { label: "Garanție" }]}
    >
      <DraftBanner />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Calitatea produselor</h2>
        <p>
          Toate produsele comercializate pe <strong>mamalucica.ro</strong> sunt realizate manual,
          din ingrediente de calitate. Verificăm fiecare produs înainte de expediere pentru a ne
          asigura că respectă standardele noastre de calitate.
        </p>

        <h2 className="text-xl font-semibold">Garanție de conformitate</h2>
        <p>
          Conform legislației românești (OUG 21/1992, Legea 449/2003), produsele trebuie să
          corespundă descrierii de pe site. Dacă un produs prezintă defecte de fabricație sau
          nu corespunde descrierii, aveți dreptul la reparare, înlocuire sau rambursare.
        </p>

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

        <h2 className="text-xl font-semibold">Reclamații</h2>
        <p>
          Pentru orice problemă legată de calitatea produselor, ne puteți contacta la:
        </p>
        <ul className="list-none pl-0 space-y-0.5 text-sm">
          <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
          <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
        </ul>
      </section>

      <section className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold mb-2">Date comerciale</h2>
        <CompanyIdentityBlock C={C} />
      </section>
    </LegalPageShell>
  );
}
