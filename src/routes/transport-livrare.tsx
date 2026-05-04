import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock, DraftBanner } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

export const Route = createFileRoute("/transport-livrare")({
  head: () => ({
    meta: [
      { title: "Transport și livrare — Mama Lucica" },
      { name: "description", content: "Informații despre transport și livrare pentru comenzile Mama Lucica." },
    ],
  }),
  component: TransportPage,
});

function TransportPage() {
  const C = useCompanyInfo();
  return (
    <LegalPageShell
      title="Transport și livrare"
      breadcrumb="Transport și livrare"
      lastUpdate="2026-05-03"
    >
      <DraftBanner />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Modalități de livrare</h2>
        <p>
          Comenzile plasate pe <strong>mamalucica.ro</strong> sunt livrate prin curier pe
          teritoriul României. Livrarea se face la adresa indicată în momentul plasării comenzii.
        </p>

        <h3 className="text-lg font-semibold">Termene de livrare</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Comenzile sunt procesate în <strong>1-2 zile lucrătoare</strong> de la confirmarea plății.</li>
          <li>Livrarea prin curier durează în general <strong>1-3 zile lucrătoare</strong> de la expediere.</li>
          <li>În perioadele aglomerate (sărbători, promoții) termenele se pot prelungi.</li>
        </ul>

        <h3 className="text-lg font-semibold">Costuri de livrare</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Livrare gratuită</strong> pentru comenzi peste <strong>200 RON</strong>.</li>
          <li>Pentru comenzi sub 200 RON, costul livrării variază în funcție de curierul ales.</li>
        </ul>

        <h3 className="text-lg font-semibold">Verificarea coletului</h3>
        <p>
          La primirea coletului, vă rugăm să verificați integritatea ambalajului.
          Dacă observați deteriorări, vă rugăm să semnalați curierului și să ne contactați
          la <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a>.
        </p>
      </section>

      <section className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold mb-2">Date de contact</h2>
        <CompanyIdentityBlock C={C} />
      </section>
    </LegalPageShell>
  );
}
