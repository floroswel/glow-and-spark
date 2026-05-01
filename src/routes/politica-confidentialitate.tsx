import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/politica-confidentialitate")({
  head: () => ({
    meta: [
      { title: "Politica de Confidențialitate — Mama Lucica" },
      { name: "description", content: "Politica de confidențialitate GDPR a magazinului Mama Lucica. Cum colectăm, utilizăm și protejăm datele tale personale." },
      { property: "og:title", content: "Politica de Confidențialitate — Mama Lucica" },
      { property: "og:description", content: "Cum colectăm, utilizăm și protejăm datele tale personale conform GDPR." },
    ],
  }),
  component: PoliticaConfidentialitatePage,
});

function PoliticaConfidentialitatePage() {
  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Politica de Confidențialitate</span>
        </nav>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8 text-center">Politica de Confidențialitate</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6 [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">

          <p>Ultima actualizare: 1 mai 2026</p>

          <h2>1. Operatorul de date</h2>
          <p>
            Operatorul de date cu caracter personal este <strong>SC Vomix Genius SRL</strong>, 
            CUI <strong>43025661</strong>, cu sediul în Județul Teleorman, România. 
            Contact DPO: <a href="mailto:contact@mamalucica.ro" className="text-accent hover:underline">contact@mamalucica.ro</a>.
          </p>

          <h2>2. Ce date colectăm</h2>
          <p>Colectăm următoarele categorii de date personale:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Date de identificare:</strong> nume, prenume, adresă de e-mail, număr de telefon</li>
            <li><strong>Date de livrare:</strong> adresa completă de livrare</li>
            <li><strong>Date de facturare:</strong> adresă de facturare, CUI (pentru persoane juridice)</li>
            <li><strong>Date de navigare:</strong> adresa IP, cookies, pagini vizitate, tip de browser (cu consimțământ)</li>
            <li><strong>Date de plată:</strong> procesate direct de Netopia Payments; nu stocăm datele cardului</li>
          </ul>

          <h2>3. Scopurile prelucrării</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Procesarea și livrarea comenzilor plasate pe site</li>
            <li>Emiterea facturilor fiscale conform legislației în vigoare</li>
            <li>Comunicarea cu clientul privind statusul comenzii</li>
            <li>Răspunsuri la solicitări și suport clienți</li>
            <li>Trimiterea de comunicări comerciale (newsletter) — doar cu consimțământ explicit</li>
            <li>Îmbunătățirea experienței de navigare pe site</li>
            <li>Respectarea obligațiilor legale (fiscale, contabile, ANPC)</li>
          </ul>

          <h2>4. Temeiul legal al prelucrării</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Executarea contractului</strong> — pentru procesarea comenzilor (art. 6(1)(b) GDPR)</li>
            <li><strong>Obligație legală</strong> — pentru evidențe fiscale/contabile (art. 6(1)(c) GDPR)</li>
            <li><strong>Consimțământ</strong> — pentru newsletter și cookies analitice/marketing (art. 6(1)(a) GDPR)</li>
            <li><strong>Interes legitim</strong> — pentru prevenirea fraudei și securitatea site-ului (art. 6(1)(f) GDPR)</li>
          </ul>

          <h2>5. Durata stocării</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Date de comandă și facturare: <strong>10 ani</strong> (obligație fiscală)</li>
            <li>Date de cont client: până la ștergerea contului sau la solicitare</li>
            <li>Date de newsletter: până la retragerea consimțământului</li>
            <li>Cookies: conform duratelor specificate în <Link to="/politica-cookies" className="text-accent hover:underline">Politica de Cookies</Link></li>
          </ul>

          <h2>6. Destinatari ai datelor</h2>
          <p>Datele pot fi transmise către:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Servicii de curierat — pentru livrarea comenzilor</li>
            <li>Procesator de plăți — Netopia Payments (pentru tranzacțiile online)</li>
            <li>Furnizor de hosting și infrastructură — Supabase / Cloudflare</li>
            <li>Autorități publice — când legea o impune</li>
          </ul>
          <p>Nu vindem și nu închiriem datele personale către terți.</p>

          <h2>7. Drepturile tale (GDPR)</h2>
          <p>Ai următoarele drepturi conform Regulamentului UE 2016/679:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dreptul de acces</strong> — poți solicita o copie a datelor tale personale</li>
            <li><strong>Dreptul la rectificare</strong> — poți solicita corectarea datelor inexacte</li>
            <li><strong>Dreptul la ștergere</strong> („dreptul de a fi uitat") — poți solicita ștergerea datelor, cu excepția celor impuse de lege</li>
            <li><strong>Dreptul la restricționarea prelucrării</strong></li>
            <li><strong>Dreptul la portabilitatea datelor</strong> — poți solicita exportul datelor în format structurat</li>
            <li><strong>Dreptul de opoziție</strong> — te poți opune prelucrării bazate pe interes legitim</li>
            <li><strong>Dreptul de a retrage consimțământul</strong> — oricând, fără a afecta legalitatea prelucrării anterioare</li>
          </ul>
          <p>
            Pentru exercitarea drepturilor, trimite un e-mail la {" "}
            <a href="mailto:contact@mamalucica.ro" className="text-accent hover:underline">contact@mamalucica.ro</a>. 
            Vom răspunde în maximum <strong>30 de zile</strong>.
          </p>
          <p>
            De asemenea, poți accesa secțiunea <Link to="/account/gdpr" className="text-accent hover:underline">Contul meu → Datele mele GDPR</Link> pentru a-ți exporta sau șterge datele direct din cont.
          </p>

          <h2>8. Transferuri internaționale</h2>
          <p>
            Datele pot fi prelucrate pe servere situate în UE/SEE (prin Supabase și Cloudflare). 
            Transferurile în afara SEE sunt realizate doar cu garanții adecvate (clauze contractuale standard).
          </p>

          <h2>9. Securitatea datelor</h2>
          <p>
            Implementăm măsuri tehnice și organizatorice adecvate pentru protecția datelor: 
            criptare TLS, acces restricționat pe bază de roluri, autentificare cu doi factori pentru personalul autorizat, 
            audituri periodice de securitate.
          </p>

          <h2>10. Plângeri</h2>
          <p>
            Dacă consideri că prelucrarea datelor tale încalcă GDPR, ai dreptul de a depune o plângere la 
            Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP): {" "}
            <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              www.dataprotection.ro
            </a>
          </p>

          <h2>11. Modificări</h2>
          <p>
            Ne rezervăm dreptul de a actualiza această politică. Modificările vor fi publicate pe această pagină 
            cu data ultimei actualizări. Continuarea utilizării site-ului după publicare constituie acceptarea modificărilor.
          </p>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
