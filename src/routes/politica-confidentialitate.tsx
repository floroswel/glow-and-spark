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

export const Route = createFileRoute("/politica-confidentialitate")({
  head: () => ({
    meta: [
      { title: "Politica de Confidențialitate — Mama Lucica" },
      { name: "description", content: `Politica de confidențialitate GDPR a magazinului Mama Lucica (${C.name}, CUI ${C.cui}). Cum colectăm, utilizăm și protejăm datele tale personale.` },
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

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2 text-center">Politica de Confidențialitate</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Ultima actualizare: 1 mai 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6 [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">

          <h2>1. Operatorul de date</h2>
          <p>Operatorul de date cu caracter personal este:</p>
          <ul className="list-none pl-0 space-y-0.5 text-sm">
            <li><strong>Denumire:</strong> {C.name}</li>
            <li><strong>CUI:</strong> {C.cui}</li>
            <li><strong>Reg. Com.:</strong> {C.regCom}</li>
            <li><strong>Sediu social:</strong> {C.address}</li>
            <li><strong>E-mail DPO:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
            <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
          </ul>

          <h2>2. Ce date colectăm</h2>
          <p>Colectăm următoarele categorii de date personale:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Date de identificare:</strong> nume, prenume, adresă de e-mail, număr de telefon</li>
            <li><strong>Date de livrare:</strong> adresa completă de livrare (stradă, număr, bloc, scară, etaj, apartament, localitate, județ, cod poștal)</li>
            <li><strong>Date de facturare:</strong> adresă de facturare, CUI și denumire firmă (pentru persoane juridice)</li>
            <li><strong>Date de navigare:</strong> adresa IP, cookies, pagini vizitate, tip de browser, sistem de operare, durată vizită (doar cu consimțământ explicit)</li>
            <li><strong>Date de plată:</strong> procesate exclusiv de procesatorul de plăți Netopia Payments SRL; {C.name} <strong>nu stochează</strong> date ale cardului bancar (număr, CVV, dată expirare)</li>
            <li><strong>Date din comunicări:</strong> conținutul mesajelor trimise prin formularul de contact, e-mail sau telefon</li>
          </ul>

          <h2>3. Scopurile prelucrării</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Procesarea și livrarea comenzilor plasate pe site</li>
            <li>Emiterea facturilor fiscale conform Codului Fiscal</li>
            <li>Comunicarea cu clientul privind statusul comenzii (confirmare, expediere, livrare)</li>
            <li>Răspunsuri la solicitări și suport clienți</li>
            <li>Trimiterea de comunicări comerciale (newsletter) — <strong>doar cu consimțământ explicit</strong>, retractabil oricând</li>
            <li>Îmbunătățirea experienței de navigare pe site (analiză anonimizată)</li>
            <li>Respectarea obligațiilor legale (fiscale, contabile, ANPC)</li>
            <li>Prevenirea fraudei și securitatea site-ului</li>
            <li>Gestionarea programului de fidelitate (puncte, niveluri)</li>
          </ul>

          <h2>4. Temeiul legal al prelucrării</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Executarea contractului</strong> (art. 6(1)(b) GDPR) — pentru procesarea comenzilor, livrare și facturare</li>
            <li><strong>Obligație legală</strong> (art. 6(1)(c) GDPR) — pentru evidențe fiscale și contabile, conform Codului Fiscal și Legii Contabilității</li>
            <li><strong>Consimțământ</strong> (art. 6(1)(a) GDPR) — pentru newsletter, cookies analitice/marketing, comunicări promoționale</li>
            <li><strong>Interes legitim</strong> (art. 6(1)(f) GDPR) — pentru prevenirea fraudei, securitatea site-ului, îmbunătățirea serviciilor</li>
          </ul>

          <h2>5. Durata stocării datelor</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Date de comandă și facturare: <strong>10 ani</strong> de la data tranzacției (obligație fiscală conform Legii Contabilității 82/1991)</li>
            <li>Date de cont client: până la ștergerea contului de către utilizator sau la solicitarea explicită de ștergere</li>
            <li>Date de newsletter: până la retragerea consimțământului (dezabonare)</li>
            <li>Date de suport/reclamații: <strong>3 ani</strong> de la soluționare</li>
            <li>Cookies: conform duratelor specificate în <Link to="/politica-cookies" className="text-accent hover:underline">Politica de Cookies</Link></li>
            <li>Jurnale de securitate (IP, încercări de autentificare): <strong>90 de zile</strong></li>
          </ul>

          <h2>6. Destinatari ai datelor</h2>
          <p>Datele pot fi transmise către următorii destinatari, strict în limita necesară:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Servicii de curierat</strong> — pentru livrarea comenzilor (nume, adresă, telefon)</li>
            <li><strong>Netopia Payments SRL</strong> — procesatorul de plăți online autorizat BNR</li>
            <li><strong>Furnizor de hosting și infrastructură</strong> — Supabase Inc. (servere UE) și Cloudflare Inc. (CDN global)</li>
            <li><strong>Furnizor de e-mail tranzacțional</strong> — pentru confirmări de comandă și notificări</li>
            <li><strong>Autorități publice</strong> — când legea o impune (ANAF, ANPC, instanțe judecătorești)</li>
          </ul>
          <p><strong>Nu vindem, nu închiriem și nu transmitem datele personale către terți în scopuri de marketing.</strong></p>

          <h2>7. Drepturile tale conform GDPR</h2>
          <p>Ai următoarele drepturi prevăzute de Regulamentul (UE) 2016/679:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dreptul de acces (art. 15)</strong> — poți solicita o copie a tuturor datelor tale personale pe care le prelucrăm</li>
            <li><strong>Dreptul la rectificare (art. 16)</strong> — poți solicita corectarea datelor inexacte sau completarea celor incomplete</li>
            <li><strong>Dreptul la ștergere (art. 17)</strong> — „dreptul de a fi uitat" — poți solicita ștergerea datelor, cu excepția celor a căror păstrare este impusă de lege (ex: facturi fiscale)</li>
            <li><strong>Dreptul la restricționarea prelucrării (art. 18)</strong> — poți solicita limitarea prelucrării în anumite situații</li>
            <li><strong>Dreptul la portabilitatea datelor (art. 20)</strong> — poți solicita primirea datelor într-un format structurat, utilizat în mod curent (JSON/CSV)</li>
            <li><strong>Dreptul de opoziție (art. 21)</strong> — te poți opune prelucrării bazate pe interesul legitim, inclusiv profilarea</li>
            <li><strong>Dreptul de a nu fi supus unei decizii automate (art. 22)</strong> — nu luăm decizii bazate exclusiv pe prelucrare automatizată cu efecte juridice</li>
            <li><strong>Dreptul de a retrage consimțământul (art. 7)</strong> — oricând, fără a afecta legalitatea prelucrării anterioare retragerii</li>
          </ul>

          <h2>8. Cum îți exerciți drepturile</h2>
          <p>Ai trei opțiuni:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Online:</strong> din secțiunea <Link to="/account/gdpr" className="text-accent hover:underline">Contul meu → Datele mele GDPR</Link>, unde poți exporta sau solicita ștergerea datelor direct</li>
            <li><strong>E-mail:</strong> trimite cererea la <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a> cu subiectul „Cerere GDPR"</li>
            <li><strong>Poștă:</strong> la adresa {C.name}, {C.address}</li>
          </ul>
          <p>
            Vom confirma primirea cererii în <strong>3 zile lucrătoare</strong> și vom răspunde complet 
            în maximum <strong>30 de zile calendaristice</strong> de la primire (extensibil cu încă 60 de zile 
            pentru cereri complexe, cu notificare prealabilă).
          </p>
          <p>
            Pentru verificarea identității, putem solicita informații suplimentare (ex: confirmarea adresei de e-mail asociate contului).
          </p>

          <h2>9. Transferuri internaționale de date</h2>
          <p>
            Datele sunt stocate preponderent pe servere situate în <strong>Uniunea Europeană</strong> (prin Supabase — regiune EU). 
            Serviciul Cloudflare poate procesa date tranzit prin noduri din afara UE, dar numai în cadrul 
            <strong> Clauzelor Contractuale Standard (SCC)</strong> aprobate de Comisia Europeană și cu aplicarea 
            măsurilor suplimentare de securitate (criptare end-to-end, minimizarea datelor).
          </p>

          <h2>10. Securitatea datelor</h2>
          <p>Implementăm măsuri tehnice și organizatorice adecvate:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Criptare TLS (HTTPS) pe toate conexiunile</li>
            <li>Acces restricționat pe bază de roluri (RBAC) la baza de date</li>
            <li>Row Level Security (RLS) pe toate tabelele cu date sensibile</li>
            <li>Parolele sunt stocate cu hashing criptografic (bcrypt), nu în text clar</li>
            <li>Audituri periodice de securitate</li>
            <li>Backup-uri automate zilnice</li>
          </ul>

          <h2>11. Copii (sub 16 ani)</h2>
          <p>
            Nu colectăm cu bună știință date personale de la copii sub 16 ani. Dacă descoperiți că un minor 
            a furnizat date fără consimțământul parental, contactați-ne pentru ștergerea acestora.
          </p>

          <h2>12. Plângeri</h2>
          <p>
            Dacă consideri că prelucrarea datelor tale încalcă GDPR, ai dreptul de a depune o plângere la:
          </p>
          <p>
            <strong>Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</strong><br />
            B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, București, cod poștal 010336<br />
            E-mail: anspdcp@dataprotection.ro<br />
            Website: <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.dataprotection.ro</a>
          </p>

          <h2>13. Modificări ale politicii</h2>
          <p>
            Ne rezervăm dreptul de a actualiza această politică. Modificările vor fi publicate pe această pagină 
            cu data ultimei actualizări vizibilă în partea de sus. Pentru modificări substanțiale, vom notifica 
            utilizatorii prin e-mail sau prin banner pe site.
          </p>
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
