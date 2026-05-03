import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    label: "Comanda test - Plata la livrare (COD)",
    description: "Plaseaza o comanda completa cu ramburs. Verifica email confirmare, statusul in admin, si stocul actualizat.",
    category: "Comenzi si Plati",
  },
  {
    id: "test-netopia-sandbox",
    label: "Comanda test - Netopia Sandbox",
    description: "Plaseaza o comanda cu card test in modul sandbox Netopia. Verifica redirect-ul catre pagina de plata si intoarcerea pe site.",
    category: "Comenzi si Plati",
  },
  {
    id: "verify-ipn",
    label: "Verifica IPN - status comanda actualizat la paid",
    description: "Dupa plata sandbox, confirma ca IPN-ul Netopia actualizeaza automat comanda la status paid in baza de date.",
    category: "Comenzi si Plati",
  },
  {
    id: "verify-confirmation-email",
    label: "Verifica email-ul de confirmare comanda",
    description: "Verifica inbox-ul pentru email-ul de confirmare. Checklist: subiect corect, detalii comanda, link tracking, date comerciale corecte.",
    category: "Comunicare",
  },
  {
    id: "verify-invoice-pdf",
    label: "Verifica factura PDF (daca este activata)",
    description: "Daca facturarea PDF este activata, descarca factura din admin si verifica: date firma, CUI, nr. factura, totaluri corecte. Operatorul NU este platitor de TVA - factura NU trebuie sa contina linie TVA.",
    category: "Comunicare",
  },
  {
    id: "verify-sitemap",
    label: "Verifica sitemap.xml - status 200, XML valid",
    description: "Acceseaza /sitemap.xml si confirma raspuns 200 cu urlset valid. Verifica ca include pagini principale si produse.",
    category: "SEO si Tehnic",
  },
  {
    id: "verify-robots",
    label: "Verifica robots.txt - Sitemap URL corect",
    description: "Acceseaza /robots.txt si confirma ca linia Sitemap pointeaza la URL-ul corect al sitemap-ului.",
    category: "SEO si Tehnic",
  },
  {
    id: "verify-health",
    label: "Verifica /api/public/health - status healthy",
    description: "Acceseaza endpoint-ul de health check si confirma status healthy cu toate check-urile trecute.",
    category: "SEO si Tehnic",
  },
  {
    id: "verify-legal-pages",
    label: "Verifica pagini legale (T&C, GDPR, Returnare, Cookies)",
    description: "Navigheaza pe fiecare pagina legala. Confirma: continut prezent, date comerciale corecte, linkuri functionale.",
    category: "Legal si Compliance",
  },
  {
    id: "verify-withdrawal-14days",
    label: "Verifica mentionarea 14 zile retragere (OUG 34/2014)",
    description: "Cauta pe site orice referinta la perioada de retur. Toate trebuie sa mentioneze 14 zile calendaristice conform OUG 34/2014.",
    category: "Legal si Compliance",
  },
  {
    id: "verify-ssl",
    label: "Verifica HTTPS / SSL valid pe domeniul custom",
    description: "Acceseaza https://mamalucica.ro si confirma certificat SSL valid, fara mixed content warnings.",
    category: "Infrastructura",
  },
  {
    id: "verify-mobile",
    label: "Testare pe mobil - flow complet",
    description: "Parcurge un flow complet (homepage, produs, cos, checkout) pe un dispozitiv mobil real sau emulator.",
    category: "Infrastructura",
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Pre-Launch Checklist
          </h1>
          <p className="text-muted-foreground mt-1">
            Verificari obligatorii inainte de go-live. Fiecare item se marcheaza cu timestamp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={allDone ? "default" : "secondary"} className="text-sm px-3 py-1">
            {allDone ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1 inline" />
                READY FOR LAUNCH
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 mr-1 inline" />
                {doneCount}/{total} completate
              </>
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
          <span>Nu lansa in productie pana cand toate itemele nu sunt bifate!</span>
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
                        Completat: {new Date(s.timestamp).toLocaleString("ro-RO")}
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
