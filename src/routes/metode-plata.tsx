import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock, DraftBanner } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { useFiscalInfo } from "@/hooks/useFiscalInfo";

export const Route = createFileRoute("/metode-plata")({
  head: () => ({
    meta: [
      { title: "Metode de plată — Mama Lucica" },
      { name: "description", content: "Metode de plată acceptate pe mamalucica.ro — card online, ramburs, transfer bancar." },
    ],
  }),
  component: MetodePlatPage,
});

function MetodePlatPage() {
  const C = useCompanyInfo();
  const { priceDisclaimer } = useFiscalInfo();

  return (
    <LegalPageShell
      title="Metode de plată"
      breadcrumbs={[{ label: "Acasă", href: "/" }, { label: "Metode de plată" }]}
    >
      <DraftBanner />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Plata cu cardul online</h2>
        <p>
          Acceptăm plăți cu carduri Visa și Mastercard prin procesatorul <strong>Netopia Payments</strong>.
          Tranzacțiile sunt securizate prin protocol 3D Secure. Datele cardului nu sunt stocate
          pe serverele noastre.
        </p>

        <h2 className="text-xl font-semibold">Ramburs la livrare</h2>
        <p>
          Plata se face în numerar la primirea coletului de la curier. Poate fi aplicat un
          cost suplimentar de procesare, afișat în pagina de checkout.
        </p>

        <h2 className="text-xl font-semibold">Transfer bancar</h2>
        <p>
          Puteți plăti prin transfer bancar în contul:
        </p>
        <ul className="list-none pl-0 space-y-0.5 text-sm">
          <li><strong>Beneficiar:</strong> {C.name}</li>
          <li><strong>IBAN:</strong> {C.iban}</li>
          <li><strong>Bancă:</strong> {C.bank}</li>
          <li><strong>CUI:</strong> {C.cui}</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Comanda va fi procesată după confirmarea plății (1-2 zile lucrătoare).
        </p>

        {priceDisclaimer && (
          <p className="text-xs text-muted-foreground mt-4 border-t pt-4">
            {priceDisclaimer}
          </p>
        )}
      </section>

      <section className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold mb-2">Date de contact</h2>
        <CompanyIdentityBlock C={C} />
      </section>
    </LegalPageShell>
  );
}
