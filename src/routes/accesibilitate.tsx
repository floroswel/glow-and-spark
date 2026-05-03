import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

export const Route = createFileRoute("/accesibilitate")({
  head: () => ({
    meta: [
      { title: "Accesibilitate — Mama Lucica" },
      { name: "description", content: "Declarație de accesibilitate Mama Lucica — obiectivele noastre privind accesibilitatea digitală și cum poți raporta o barieră." },
      { property: "og:title", content: "Accesibilitate — Mama Lucica" },
      { property: "og:description", content: "Declarație de accesibilitate și cum raportezi bariere de acces." },
    ],
  }),
  component: AccesibilitatePage,
});

function AccesibilitatePage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell title="Accesibilitate" breadcrumb="Accesibilitate">
      <h2>Angajamentul nostru</h2>
      <p>
        Ne dorim ca site-ul <strong>mamalucica.ro</strong> să fie accesibil tuturor utilizatorilor,
        inclusiv persoanelor cu dizabilități. Lucrăm continuu pentru a îmbunătăți experiența de
        navigare și ne ghidăm după recomandările <strong>WCAG 2.1 nivel AA</strong> ca obiectiv de referință.
      </p>

      <h2>Ce facem</h2>
      <ul>
        <li>Utilizăm HTML semantic și structuri de navigare consecvente.</li>
        <li>Textele alternative pentru imagini sunt adăugate progresiv.</li>
        <li>Asigurăm contrast suficient între text și fundal.</li>
        <li>Formularul de contact și procesul de comandă sunt navigabile cu tastatura.</li>
        <li>Testăm periodic site-ul cu instrumente automate de accesibilitate.</li>
      </ul>

      <div className="rounded-xl border border-border bg-muted/30 p-5 not-prose">
        <p className="font-semibold text-foreground text-sm">
          ⚠️ Nu deținem în prezent o certificare de accesibilitate emisă de un auditor independent.
          Această pagină descrie obiectivele noastre, nu o conformitate verificată.
        </p>
      </div>

      <h2>Raportează o barieră de acces</h2>
      <p>
        Dacă întâmpini dificultăți în utilizarea site-ului nostru, te rugăm să ne contactezi:
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
        Descrierea barierelor întâmpinate ne ajută să prioritizăm îmbunătățirile.
        Vom răspunde în cel mai scurt timp posibil.
      </p>

      <h2>Feedback</h2>
      <p>
        Apreciem orice sugestie pentru îmbunătățirea accesibilității. Poți folosi și{" "}
        <Link to="/contact" className="text-accent underline hover:text-accent/80">
          formularul de contact
        </Link>{" "}
        pentru a ne trimite un mesaj.
      </p>
    </LegalPageShell>
  );
}
