import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, RotateCcw, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/pre-launch")({
  component: PreLaunchChecklist,
});

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: string;
}

interface CheckState {
  done: boolean;
  timestamp: string | null;
}

const STORAGE_KEY = "mama-lucica-prelaunch-checklist";

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "test-order-cod",
    label: "Comandă test — Plată la livrare (COD)",
    description: "Plasează o comandă completă cu ramburs. Verifică email confirmare, statusul în admin, și stocul actualizat.",
    category: "Comenzi & Plăți",
  },
  {
    id: "test-netopia-sandbox",
    label: "Comandă test — Netopia Sandbox",
    description: "Plasează o comandă cu card test în modul sandbox Netopia. Verifică redirect-ul către pagina de plată și întoarcerea pe site.",
    category: "Comenzi & Plăți",
  },
  {
    id: "verify-ipn",
    label: "Verifică IPN — status comandă actualizat la „plătit"",
    description: "După plata sandbox, confirmă că IPN-ul Netopia actualizează automat comanda la status „paid" în baza de date.",
    category: "Comenzi & Plăți",
  },
  {
    id: "verify-confirmation-email",
    label: "Verifică email-ul de confirmare comandă",
    description: "Verifică inbox-ul pentru email-ul de confirmare. Checklist: subiect corect, detalii comandă, link tracking, date comerciale corecte.",
    category: "Comunicare",
  },
  {
    id: "verify-invoice-pdf",
    label: "Verifică factura PDF (dacă este activată)",
    description: "Dacă facturarea PDF este activată, descarcă factura din admin și verifică: date firmă, CUI, nr. factură, TVA, totaluri corecte.",
    category: "Comunicare",
  },
  {
    id: "verify-sitemap",
    label: "Verifică sitemap.xml — status 200, XML valid",
    description: "Accesează /sitemap.xml și confirmă răspuns 200 cu <urlset> valid. Verifică că include pagini principale și produse.",
    category: "SEO & Tehnic",
  },
  {
    id: "verify-robots",
    label: "Verifică robots.txt — Sitemap URL corect",
    description: "Accesează /robots.txt și confirmă că linia Sitemap: pointează la URL-ul corect al sitemap-ului.",
    category: "SEO & Tehnic",
  },
  {
    id: "verify-health",
    label: "Verifică /api/public/health — status healthy",
    description: "Accesează endpoint-ul de health check și confirmă status „healthy" cu toate check-urile trecute.",
    category: "SEO & Tehnic",
  },
  {
    id: "verify-legal-pages",
    label: "Verifică pagini legale (T&C, GDPR, Returnare, Cookies)",
    description: "Navighează pe fiecare pagină legală. Confirmă: conținut prezent, date comerciale corecte, linkuri funcționale.",
    category: "Legal & Compliance",
  },
  {
    id: "verify-withdrawal-14days",
    label: "Verifică menționarea „14 zile retragere" (OUG 34/2014)",
    description: "Caută pe site orice referință la perioada de retur. Toate trebuie să menționeze 14 zile calendaristice conform OUG 34/2014.",
    category: "Legal & Compliance",
  },
  {
    id: "verify-ssl",
    label: "Verifică HTTPS / SSL valid pe domeniul custom",
    description: "Accesează https://mamalucica.ro și confirmă certificat SSL valid, fără mixed content warnings.",
    category: "Infrastructură",
  },
  {
    id: "verify-mobile",
    label: "Testare pe mobil — flow complet",
    description: "Parcurge un flow complet (homepage → produs → coș → checkout) pe un dispozitiv mobil real sau emulator.",
    category: "Infrastructură",
  },
];

function loadState(): Record<string, CheckState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function PreLaunchChecklist() {
  const [state, setState] = useState<Record<string, CheckState>>({});

  useEffect(() => {
    setState(loadState());
  }, []);

  const toggle = (id: string) => {
    setState((prev) => {
      const current = prev[id];
      const next = {
        ...prev,
        [id]: current?.done
          ? { done: false, timestamp: null }
          : { done: true, timestamp: new Date().toISOString() },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({});
  };

  const doneCount = CHECKLIST_ITEMS.filter((i) => state[i.id]?.done).length;
  const total = CHECKLIST_ITEMS.length;
  const allDone = doneCount === total;

  const categories = [...new Set(CHECKLIST_ITEMS.map((i) => i.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Pre-Launch Checklist
          </h1>
          <p className="text-muted-foreground mt-1">
            Verificări obligatorii înainte de go-live. Fiecare item se marchează cu timestamp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={allDone ? "default" : "secondary"} className="text-sm px-3 py-1">
            {allDone ? (
              <><CheckCircle2 className="h-4 w-4 mr-1" /> READY FOR LAUNCH</>
            ) : (
              <><Circle className="h-4 w-4 mr-1" /> {doneCount}/{total} completate</>
            )}
          </Badge>
          <Button variant="outline" size="sm" onClick={resetAll}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {!allDone && doneCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Nu lansa în producție până când toate itemele nu sunt bifate!</span>
        </div>
      )}

      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {CHECKLIST_ITEMS.filter((i) => i.category === cat).map((item) => {
              const s = state[item.id];
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${s?.done ? "bg-green-500/5" : ""}`}
                >
                  <Checkbox
                    checked={!!s?.done}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${s?.done ? "line-through text-muted-foreground" : ""}`}>
                      {item.label}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                    {s?.done && s.timestamp && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Completat: {new Date(s.timestamp).toLocaleString("ro-RO")}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
