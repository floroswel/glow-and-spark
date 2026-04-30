import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Banknote, Smartphone, Check, X, Settings, ToggleLeft, ToggleRight, Zap, Loader2, ExternalLink, AlertCircle, CheckCircle2, ShieldAlert, LogIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsGuard,
});

function AdminPaymentsGuard() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
        <h2 className="mt-3 font-heading text-xl font-bold text-amber-900">Trebuie să te autentifici</h2>
        <p className="mt-2 text-sm text-amber-800">
          Pagina <strong>Metode de Plată</strong> (inclusiv butonul „Testează Netopia acum”) este disponibilă doar pentru administratori autentificați.
        </p>
        <Link
          to="/admin"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition"
        >
          <LogIn className="h-4 w-4" /> Mergi la login admin
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-300 bg-red-50 p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
        <h2 className="mt-3 font-heading text-xl font-bold text-red-900">Acces refuzat</h2>
        <p className="mt-2 text-sm text-red-800">
          Ești autentificat ca <strong>{user.email}</strong>, dar acest cont nu are rol de administrator.
        </p>
        <p className="mt-2 text-xs text-red-700">
          Loghează-te cu contul admin (<code className="bg-white/60 px-1 rounded">gicaflorinionut1987@gmail.com</code>) pentru a accesa diagnosticul Netopia.
        </p>
        <Link
          to="/admin"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
        >
          <LogIn className="h-4 w-4" /> Schimbă contul
        </Link>
      </div>
    );
  }

  return <AdminPayments />;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  icon: string;
  enabled: boolean;
  description: string;
  fee_percent: number;
  fee_fixed: number;
  min_order: number;
  sort_order: number;
}

const defaultMethods: PaymentMethod[] = [
  { id: "1", name: "Ramburs la livrare", code: "ramburs", icon: "💵", enabled: true, description: "Plata cash la livrare prin curier", fee_percent: 0, fee_fixed: 0, min_order: 0, sort_order: 0 },
  { id: "2", name: "Card online (Netopia)", code: "netopia", icon: "💳", enabled: true, description: "Plata cu cardul Visa/Mastercard prin Netopia", fee_percent: 1.5, fee_fixed: 0, min_order: 0, sort_order: 1 },
  { id: "3", name: "Transfer bancar", code: "transfer", icon: "🏦", enabled: false, description: "Plata prin ordin de plată sau transfer bancar", fee_percent: 0, fee_fixed: 0, min_order: 0, sort_order: 2 },
  { id: "4", name: "Rate (Mokka)", code: "mokka", icon: "📱", enabled: false, description: "Plata în 3-12 rate fără dobândă", fee_percent: 3, fee_fixed: 0, min_order: 200, sort_order: 3 },
  { id: "5", name: "Apple Pay / Google Pay", code: "wallet", icon: "📲", enabled: false, description: "Plata rapidă cu wallet digital", fee_percent: 1.5, fee_fixed: 0, min_order: 0, sort_order: 4 },
];

function AdminPayments() {
  const { user, isAdmin } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [toast, setToast] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [clientLog, setClientLog] = useState<string[]>([]);
  const [diagLoading, setDiagLoading] = useState<"none" | "secrets" | "probe">("none");
  const [diagResult, setDiagResult] = useState<any>(null);

  async function runDiagnostic(mode: "secrets" | "probe") {
    setDiagLoading(mode);
    setDiagResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setDiagResult({ ok: false, error: "Nu ești autentificat. Re-loghează-te." });
        return;
      }
      const { data, error } = await supabase.functions.invoke("netopia-diagnostic", {
        body: { mode },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        setDiagResult({ ok: false, error: error.message });
        return;
      }
      setDiagResult(data);
    } catch (e: any) {
      setDiagResult({ ok: false, error: e?.message || String(e) });
    } finally {
      setDiagLoading("none");
    }
  }

  function copyDiagToClipboard() {
    if (!diagResult) return;
    const text = JSON.stringify(diagResult, null, 2);
    navigator.clipboard.writeText(text);
    setToast("Log diagnostic copiat!");
    setTimeout(() => setToast(""), 2000);
  }

  async function runNetopiaTest() {
    const log: string[] = [];
    const push = (line: string) => {
      const ts = new Date().toISOString().slice(11, 23);
      const entry = `[${ts}] ${line}`;
      log.push(entry);
      console.log("[netopia-test-client]", entry);
    };

    setTesting(true);
    setTestResult(null);
    setClientLog([]);

    push(`User: ${user?.email || "anonim"} (id=${user?.id || "—"})`);
    push(`Rol admin: ${isAdmin ? "DA" : "NU"}`);
    push(`Rută: ${typeof window !== "undefined" ? window.location.pathname : "—"}`);
    push(`Origin: ${typeof window !== "undefined" ? window.location.origin : "—"}`);

    const t0 = performance.now();
    try {
      push("Cer sesiunea Supabase...");
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        push("✗ Nu există access_token. Trebuie să te re-loghezi.");
        setTestResult({ ok: false, message: "Nu ești autentificat. Re-loghează-te." });
        setClientLog([...log]);
        return;
      }
      push(`✓ Token primit (${token.length} car., expiră la ${sessionData.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toLocaleTimeString("ro-RO") : "?"})`);
      push("Apelez edge function 'netopia-test'...");

      const { data, error } = await supabase.functions.invoke("netopia-test", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const elapsed = Math.round(performance.now() - t0);
      push(`Răspuns primit în ${elapsed}ms`);

      if (error) {
        push(`✗ Eroare invoke: ${error.message}`);
        setTestResult({ ok: false, message: `Eroare apel: ${error.message}`, error });
        setClientLog([...log]);
        return;
      }

      push(`Status edge: ok=${data?.ok}, stage=${data?.stage}`);
      if (data?.config) {
        push(`Config Netopia: ENV=${data.config.env}, apiKeyLen=${data.config.apiKeyLen}, posSigLen=${data.config.posSignatureLen}`);
        push(`API Key preview: ${data.config.apiKeyPreview}`);
        push(`POS Sig preview: ${data.config.posSignaturePreview}`);
      }
      if (data?.netopiaStatus !== undefined) {
        push(`Netopia HTTP: ${data.netopiaStatus} (auth=${data.usedAuthScheme}, ${data.elapsedMs}ms)`);
      }
      if (data?.ntpID) push(`✓ ntpID: ${data.ntpID}`);
      if (data?.paymentUrl) push(`✓ Payment URL: ${data.paymentUrl}`);
      if (!data?.ok && data?.rawResponse) {
        const raw = typeof data.rawResponse === "string" ? data.rawResponse : JSON.stringify(data.rawResponse);
        push(`✗ Răspuns brut Netopia: ${raw.slice(0, 200)}${raw.length > 200 ? "..." : ""}`);
      }

      setTestResult(data);
    } catch (e: any) {
      push(`✗ Excepție: ${e?.message || String(e)}`);
      setTestResult({ ok: false, message: `Excepție: ${e?.message || String(e)}` });
    } finally {
      setClientLog([...log]);
      setTesting(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "payment_methods").maybeSingle();
    if (data?.value && Array.isArray(data.value)) {
      setMethods(data.value as unknown as PaymentMethod[]);
    } else {
      setMethods(defaultMethods);
    }
    setLoading(false);
  }

  async function saveAll(updated: PaymentMethod[]) {
    setMethods(updated);
    await supabase.from("site_settings").upsert({ key: "payment_methods", value: updated as any }, { onConflict: "key" });
    setToast("Salvat cu succes!");
    setTimeout(() => setToast(""), 3000);
  }

  function toggleMethod(code: string) {
    const updated = methods.map(m => m.code === code ? { ...m, enabled: !m.enabled } : m);
    saveAll(updated);
  }

  function saveEdit() {
    if (!editing) return;
    const updated = methods.map(m => m.id === editing.id ? editing : m);
    saveAll(updated);
    setEditing(null);
  }

  const stats = useMemo(() => ({
    active: methods.filter(m => m.enabled).length,
    total: methods.length,
  }), [methods]);

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Metode de Plată</h1>
          <p className="text-sm text-muted-foreground">{stats.active} active din {stats.total} metode configurate</p>
        </div>
      </div>

      {/* Netopia diagnostic test card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-accent/10 p-3 text-accent"><Zap className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-semibold text-foreground">Test conexiune Netopia</h3>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">DIAGNOSTIC</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inițiază o tranzacție test de 1 RON folosind credențialele configurate (API key + POS Signature + ENV).
              Folosește pentru a verifica că integrarea funcționează fără să mai treci prin checkout.
            </p>
            <button
              onClick={runNetopiaTest}
              disabled={testing}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 transition disabled:opacity-50"
            >
              {testing ? <><Loader2 className="h-4 w-4 animate-spin" /> Se testează...</> : <><Zap className="h-4 w-4" /> Testează Netopia acum</>}
            </button>

            {testResult && (
              <div className={`mt-4 rounded-lg border p-4 text-sm ${testResult.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <div className="flex items-center gap-2 font-semibold">
                  {testResult.ok ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                  <span className={testResult.ok ? "text-green-800" : "text-red-800"}>
                    {testResult.ok ? "✓ Tranzacție aprobată de Netopia" : "✗ Tranzacție respinsă"}
                  </span>
                </div>
                <p className={`mt-1 text-xs ${testResult.ok ? "text-green-700" : "text-red-700"}`}>{testResult.message}</p>

                {testResult.config && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono bg-white/60 rounded p-2">
                    <div><span className="text-muted-foreground">ENV:</span> <strong>{testResult.config.env}</strong> {testResult.config.envRaw !== testResult.config.env && <span className="text-red-600">(raw: "{testResult.config.envRaw}")</span>}</div>
                    <div><span className="text-muted-foreground">Auth scheme:</span> <strong>{testResult.usedAuthScheme || "—"}</strong></div>
                    <div><span className="text-muted-foreground">API Key:</span> <strong>{testResult.config.apiKeyPreview}</strong> ({testResult.config.apiKeyLen} car.)</div>
                    <div><span className="text-muted-foreground">POS Sig:</span> <strong>{testResult.config.posSignaturePreview}</strong> ({testResult.config.posSignatureLen} car.)</div>
                    <div><span className="text-muted-foreground">Status HTTP:</span> <strong>{testResult.netopiaStatus ?? "—"}</strong></div>
                    <div><span className="text-muted-foreground">Răspuns în:</span> <strong>{testResult.elapsedMs ?? "—"}ms</strong></div>
                  </div>
                )}

                {testResult.ntpID && (
                  <div className="mt-2 text-xs"><span className="text-muted-foreground">ntpID:</span> <code className="bg-white/60 px-1.5 py-0.5 rounded">{testResult.ntpID}</code></div>
                )}

                {testResult.paymentUrl && (
                  <a href={testResult.paymentUrl} target="_blank" rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                    Deschide pagină de plată test <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {!testResult.ok && testResult.rawResponse && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-red-700">Vezi răspuns brut Netopia</summary>
                    <pre className="mt-2 max-h-60 overflow-auto rounded bg-white/60 p-2 text-[10px] font-mono whitespace-pre-wrap break-all">{typeof testResult.rawResponse === "string" ? testResult.rawResponse : JSON.stringify(testResult.rawResponse, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}

            {clientLog.length > 0 && (
              <details className="mt-3" open={!testResult?.ok}>
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                  📋 Log detaliat client ({clientLog.length} linii)
                </summary>
                <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-900 text-slate-100 p-3 text-[10px] font-mono whitespace-pre-wrap break-all">{clientLog.join("\n")}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(clientLog.join("\n"))}
                  className="mt-2 text-[10px] text-accent hover:underline"
                >
                  Copiază log în clipboard
                </button>
              </details>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {methods.map(method => (
          <div key={method.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-3xl">{method.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{method.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${method.enabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {method.enabled ? "ACTIV" : "INACTIV"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
              {(method.fee_percent > 0 || method.fee_fixed > 0) && (
                <p className="text-xs text-accent mt-1">Comision: {method.fee_percent}%{method.fee_fixed > 0 ? ` + ${method.fee_fixed} RON` : ""}</p>
              )}
              {method.min_order > 0 && <p className="text-xs text-muted-foreground">Comandă minimă: {method.min_order} RON</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing({ ...method })} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary transition">
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => toggleMethod(method.code)} className="text-muted-foreground hover:text-foreground transition">
                {method.enabled ? <ToggleRight className="h-6 w-6 text-accent" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">Editare: {editing.name}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descriere</label>
                <input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Comision (%)</label>
                  <input type="number" step="0.1" value={editing.fee_percent} onChange={e => setEditing({ ...editing, fee_percent: +e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Comision fix (RON)</label>
                  <input type="number" step="0.5" value={editing.fee_fixed} onChange={e => setEditing({ ...editing, fee_fixed: +e.target.value })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Comandă minimă (RON)</label>
                <input type="number" value={editing.min_order} onChange={e => setEditing({ ...editing, min_order: +e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
              <button onClick={saveEdit} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Salvează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
