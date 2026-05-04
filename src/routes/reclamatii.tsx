import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageShell, CompanyIdentityBlock } from "@/components/LegalPageShell";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { COMPLAINT_RESPONSE_DAYS } from "@/lib/compliance";

const LAST_UPDATE = "2026-05-04";

export const Route = createFileRoute("/reclamatii")({
  head: () => ({
    meta: [
      { title: "Reclamații — Mama Lucica" },
      { name: "description", content: "Procedura de depunere a reclamațiilor la Mama Lucica. Răspundem în maxim 5 zile lucrătoare. ANPC, SAL, SOL." },
      { property: "og:title", content: "Reclamații — Mama Lucica" },
      { property: "og:description", content: "Cum depui o reclamație și autoritățile competente." },
    ],
  }),
  component: ReclamatiiPage,
});

function ReclamatiiPage() {
  const C = useCompanyInfo();

  return (
    <LegalPageShell title="Reclamații" breadcrumb="Reclamații" lastUpdate={LAST_UPDATE}>

      <h2>1. Cum depui o reclamație</h2>
      <p>
        Dacă nu sunteți mulțumit de un produs sau serviciu oferit de <strong>{C.name}</strong>, 
        puteți depune o reclamație prin următoarele canale:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>E-mail:</strong>{" "}
          <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a>{" "}
          — cu subiectul „Reclamație"
        </li>
        <li>
          <strong>Telefon:</strong>{" "}
          <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a>
        </li>
        <li>
          <strong>Poștă:</strong> {C.name}, {C.fullAddress}
        </li>
        <li>
          <strong>Formularul de contact:</strong>{" "}
          <Link to="/contact" className="text-accent hover:underline">pagina de contact</Link>
        </li>
      </ul>

      <h2>2. Ce trebuie să conțină reclamația</h2>
      <p>Pentru a vă putea ajuta cât mai rapid, vă rugăm să includeți:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Numărul comenzii</li>
        <li>Descrierea problemei întâmpinate</li>
        <li>Fotografii ale produsului (dacă este cazul)</li>
        <li>Datele dumneavoastră de contact (nume, e-mail, telefon)</li>
        <li>Soluția pe care o considerați adecvată (înlocuire, rambursare etc.)</li>
      </ul>

      <h2>3. Termenul de răspuns</h2>
      <p>
        Vom confirma primirea reclamației în cel mult <strong>24 de ore</strong> și vom depune 
        eforturi rezonabile pentru a o soluționa în maximum <strong>{COMPLAINT_RESPONSE_DAYS} zile lucrătoare</strong> 
        de la primirea tuturor informațiilor necesare.
      </p>

      <h2>4. Soluționarea amiabilă</h2>
      <p>
        Ne angajăm să soluționăm toate reclamațiile pe cale amiabilă, în dialogul direct cu 
        clientul. Dacă nu reușim să ajungem la o soluție satisfăcătoare, aveți la dispoziție 
        următoarele opțiuni:
      </p>

      <h2>5. Autoritatea Națională pentru Protecția Consumatorilor (ANPC)</h2>
      <p>
        ANPC este autoritatea publică responsabilă cu protecția drepturilor consumatorilor în România.
      </p>
      <ul className="list-none pl-0 space-y-1 text-sm">
        <li>
          <strong>Website:</strong>{" "}
          <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://anpc.ro</a>
        </li>
        <li>
          <strong>Telefon InfoCons:</strong> 0219615 (linia consumatorului)
        </li>
        <li>
          <strong>Sesizare online:</strong>{" "}
          <a href="https://anpc.ro/sesizare/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            Depune o sesizare la ANPC
          </a>
        </li>
      </ul>

      <h2>6. SAL — Soluționarea Alternativă a Litigiilor</h2>
      <p>
        Conform OUG 38/2015, consumatorii au dreptul de a recurge la proceduri de soluționare 
        alternativă a litigiilor (SAL) prin entitățile înscrise în registrul ANPC.
      </p>
      <p>
        Informații despre entitățile SAL disponibile:{" "}
        <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          https://anpc.ro/ce-este-sal/
        </a>
      </p>

      <h2>7. SOL — Platforma Online de Soluționare a Litigiilor (ODR)</h2>
      <p>
        Conform Regulamentului UE nr. 524/2013, consumatorii din Uniunea Europeană pot utiliza 
        platforma online de soluționare a litigiilor (ODR) pentru a depune o plângere legată 
        de un produs sau serviciu achiziționat online.
      </p>
      <p>
        <strong>Platforma ODR:</strong>{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          https://ec.europa.eu/consumers/odr
        </a>
      </p>
      <p className="text-sm text-muted-foreground">
        La depunerea plângerii pe platforma ODR, va fi necesară adresa de e-mail a vânzătorului:{" "}
        <strong>{C.email}</strong>
      </p>

      <h2>8. Instanțe judecătorești</h2>
      <p>
        Dacă niciuna dintre soluțiile de mai sus nu conduce la rezolvarea litigiului, 
        consumatorul poate sesiza instanțele judecătorești competente din România, 
        conform domiciliului consumatorului.
      </p>

      <section className="mt-8 pt-6 border-t">
        <h2 className="text-lg font-semibold mb-2">Date identificare vânzător</h2>
        <CompanyIdentityBlock C={C} />
      </section>

    </LegalPageShell>
  );
}
