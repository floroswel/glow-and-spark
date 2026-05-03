import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Download, Trash2, FileEdit, Check, X, Plus, ExternalLink,
  AlertTriangle, Printer, ClipboardCheck, Calendar, Package, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { CONSENT_POLICY_VERSION } from "@/config/marketing-tech";

export const Route = createFileRoute("/admin/compliance-kit")({
  component: ComplianceKitPage,
});

/* ─── helpers ─── */
const DISCLAIMER = "Instrument intern; nu înlocuiește consultanța juridică. [DRAFT_FOR_LEGAL_REVIEW]";
const POLICY_STALE_DAYS = 180;

const TRAINING_CHECKLIST = [
  "Scripturile CS reflectă politica de retur publicată pe site.",
  "CS cunoaște termenul legal de retur (14 zile OUG 34/2014).",
  "CS nu oferă promisiuni suplimentare față de politica de garanție publicată.",
  "Politica cookies a fost verificată să corespundă CMP-ului activ.",
  "Disclaimerul fiscal (TVA / non-TVA) este corect pe toate paginile.",
  "Datele companiei (CUI, Reg.Com, adresă) sunt identice pe factură și site.",
  "Link-uri canonice către politici: /politica-confidentialitate, /termeni-si-conditii, /politica-cookies, /politica-retur.",
];

const TABS = ["incident", "gdpr", "vendors", "training", "review"] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  incident: "A · Incident & Export",
  gdpr: "GDPR Cereri",
  vendors: "B · Inventar Furnizori (DPA)",
  training: "C · Checklist Instruire",
  review: "D · Revizuire Trimestrială",
};

/* ─── MAIN ─── */
function ComplianceKitPage() {
  const [tab, setTab] = useState<Tab>("incident");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-accent" />
        <div>
          <h1 className="font-heading text-2xl font-bold">Operational Compliance Kit</h1>
          <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${tab === t ? "bg-foreground text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "incident" && <SectionIncident />}
      {tab === "gdpr" && <SectionGdpr />}
      {tab === "vendors" && <SectionVendors />}
      {tab === "training" && <SectionTraining />}
      {tab === "review" && <SectionReview />}
    </div>
  );
}

/* ════════════ A — Incident & Evidence Export ════════════ */
function SectionIncident() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const exportBundle = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // 1. order
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber.trim().toUpperCase())
        .maybeSingle();
      if (oErr || !order) throw new Error("Comanda nu a fost găsită.");

      // 2. consent snapshot (by user or email)
      let consent: any[] = [];
      const { data: cData } = await supabase
        .from("marketing_consents")
        .select("*")
        .or(`session_id.eq.${order.customer_email},user_id.eq.${order.user_id ?? "00000000-0000-0000-0000-000000000000"}`)
        .order("created_at", { ascending: false })
        .limit(5);
      consent = cData ?? [];

      // 3. activity log entries for this order
      const { data: logs } = await supabase
        .from("activity_log")
        .select("*")
        .eq("entity_type", "order")
        .eq("entity_id", order.id)
        .order("created_at", { ascending: false });

      const bundle = {
        exported_at: new Date().toISOString(),
        order,
        consent_snapshots: consent,
        activity_logs: logs ?? [],
        consent_policy_version: CONSENT_POLICY_VERSION,
      };
      setResult(bundle);

      // Log export in activity
      await supabase.from("activity_log").insert({
        action: "Export bundle compliance",
        entity_type: "order",
        entity_id: order.id,
        entity_name: order.order_number,
        details: { exported_at: bundle.exported_at },
      });

      toast.success("Bundle generat.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-bundle-${result.order?.order_number ?? "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><Package className="h-5 w-5" />Export Bundle Comandă</h2>
      <p className="text-sm text-muted-foreground">Generează un pachet JSON cu datele comenzii, statusul plății, snapshot consimțământ și log activitate. [LEGAL: pentru PDF/ZIP complet, integrare externă necesară.]</p>

      <div className="flex gap-2">
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Ex: ML00123"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm w-48"
        />
        <button onClick={exportBundle} disabled={loading} className="rounded-md bg-foreground text-primary-foreground px-4 py-2 text-sm disabled:opacity-50">
          {loading ? "Se generează…" : "Generează Bundle"}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-card p-4 text-xs overflow-auto max-h-80">
            <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
          <button onClick={downloadJson} className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
            <Download className="h-4 w-4" /> Descarcă JSON
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════ GDPR Requests ════════════ */
function SectionGdpr() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"pending" | "processing" | "completed" | "all">("pending");

  const load = useCallback(async () => {
    let q = supabase.from("gdpr_requests").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setItems(data ?? []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("gdpr_requests").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Eroare"); else { toast.success("Actualizat"); load(); }
  };

  const ICONS: Record<string, any> = { export: Download, delete: Trash2, rectify: FileEdit };

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5" />Cereri GDPR (ACCESS / DELETE / RECTIFY)</h2>
      <p className="text-sm text-muted-foreground">Workflow: Noi → În lucru → Finalizat/Respins. Termen legal: 30 zile. [PROCESS + LEGAL]</p>

      <div className="flex gap-2">
        {(["pending", "processing", "completed", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs ${filter === f ? "bg-foreground text-primary-foreground" : "bg-secondary"}`}>
            {f === "all" ? "Toate" : f === "pending" ? "Noi" : f === "processing" ? "În lucru" : "Finalizate"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nicio cerere.</p>}
        {items.map((r) => {
          const Icon = ICONS[r.request_type] ?? Shield;
          return (
            <div key={r.id} className="p-4 flex flex-wrap items-start gap-4">
              <Icon className="h-5 w-5 text-accent mt-0.5" />
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold capitalize text-sm">{r.request_type === "export" ? "Export date" : r.request_type === "delete" ? "Ștergere cont" : "Rectificare"}</div>
                <div className="text-xs text-muted-foreground">{r.email} · {new Date(r.created_at).toLocaleString("ro-RO")}</div>
                {r.details && <p className="mt-1 text-xs bg-secondary/50 rounded p-2">{r.details}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {r.status === "pending" && <button onClick={() => updateStatus(r.id, "processing")} className="rounded-md bg-blue-600 text-white px-3 py-1 text-xs">În lucru</button>}
                {r.status !== "completed" && r.status !== "rejected" && (
                  <>
                    <button onClick={() => updateStatus(r.id, "completed")} className="rounded-md bg-emerald-600 text-white px-3 py-1 text-xs flex items-center gap-1"><Check className="h-3 w-3" />Finalizează</button>
                    <button onClick={() => updateStatus(r.id, "rejected")} className="rounded-md bg-red-600 text-white px-3 py-1 text-xs flex items-center gap-1"><X className="h-3 w-3" />Respinge</button>
                  </>
                )}
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{r.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════ B — Vendor DPA Inventory ════════════ */
function SectionVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vendor_name: "", vendor_type: "other", privacy_url: "", dpa_signed: false, dpa_notes: "", contact_email: "" });

  const load = useCallback(async () => {
    const { data } = await supabase.from("compliance_vendors").select("*").order("vendor_name");
    setVendors(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.vendor_name.trim()) { toast.error("Nume furnizor obligatoriu"); return; }
    const { error } = await supabase.from("compliance_vendors").insert(form);
    if (error) { toast.error("Eroare: " + error.message); return; }
    toast.success("Furnizor adăugat");
    setForm({ vendor_name: "", vendor_type: "other", privacy_url: "", dpa_signed: false, dpa_notes: "", contact_email: "" });
    setShowForm(false);
    load();
  };

  const toggleDpa = async (id: string, current: boolean) => {
    await supabase.from("compliance_vendors").update({ dpa_signed: !current }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ștergi furnizorul?")) return;
    await supabase.from("compliance_vendors").delete().eq("id", id);
    toast.success("Șters");
    load();
  };

  const TYPES = ["hosting", "email", "payments", "ads", "analytics", "other"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" />Inventar Furnizori & DPA</h2>
        <button onClick={() => setShowForm(!showForm)} className="rounded-md bg-foreground text-primary-foreground px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus className="h-4 w-4" /> Adaugă furnizor
        </button>
      </div>
      <p className="text-sm text-muted-foreground">Evidența furnizorilor cu care se procesează date personale. [MANAGEMENT]</p>

      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} placeholder="Nume furnizor" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <select value={form.vendor_type} onChange={(e) => setForm({ ...form, vendor_type: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={form.privacy_url} onChange={(e) => setForm({ ...form, privacy_url: e.target.value })} placeholder="URL politică confidențialitate" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="Email contact DPO" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <input value={form.dpa_notes} onChange={(e) => setForm({ ...form, dpa_notes: e.target.value })} placeholder="Note DPA (data semnare, obs.)" className="rounded-md border border-border bg-background px-3 py-2 text-sm w-full" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dpa_signed} onChange={(e) => setForm({ ...form, dpa_signed: e.target.checked })} /> DPA semnat</label>
          <div className="flex gap-2">
            <button onClick={save} className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm">Salvează</button>
            <button onClick={() => setShowForm(false)} className="rounded-md bg-secondary px-4 py-2 text-sm">Anulează</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-2">Furnizor</th>
              <th className="p-2">Tip</th>
              <th className="p-2">DPA</th>
              <th className="p-2">Politică</th>
              <th className="p-2">Note</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Niciun furnizor adăugat.</td></tr>}
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="p-2 font-medium">{v.vendor_name}</td>
                <td className="p-2 capitalize">{v.vendor_type}</td>
                <td className="p-2">
                  <button onClick={() => toggleDpa(v.id, v.dpa_signed)} className={`rounded-full px-2 py-0.5 text-xs ${v.dpa_signed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {v.dpa_signed ? "✓ Da" : "✗ Nu"}
                  </button>
                </td>
                <td className="p-2">{v.privacy_url ? <a href={v.privacy_url} target="_blank" rel="noopener noreferrer" className="text-accent flex items-center gap-1"><ExternalLink className="h-3 w-3" />Link</a> : "—"}</td>
                <td className="p-2 text-xs text-muted-foreground max-w-[200px] truncate">{v.dpa_notes || "—"}</td>
                <td className="p-2"><button onClick={() => remove(v.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════ C — Training Checklist ════════════ */
function SectionTraining() {
  const company = useCompanyInfo();
  const [checked, setChecked] = useState<boolean[]>(TRAINING_CHECKLIST.map(() => false));

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  const printChecklist = () => window.print();

  return (
    <div className="space-y-4 print:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />Checklist Instruire Echipă</h2>
        <button onClick={printChecklist} className="rounded-md bg-secondary px-3 py-1.5 text-sm flex items-center gap-1 print:hidden"><Printer className="h-4 w-4" /> Printează</button>
      </div>
      <p className="text-sm text-muted-foreground">{company.name} — Verificare periodică că scripturile CS corespund politicilor publicate. [PROCESS]</p>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {TRAINING_CHECKLIST.map((item, i) => (
          <label key={i} className="flex items-start gap-3 p-4 cursor-pointer hover:bg-secondary/30">
            <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} className="mt-0.5" />
            <span className="text-sm">{item}</span>
          </label>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        <strong>Link-uri canonice politici:</strong>{" "}
        <a href="/politica-confidentialitate" className="text-accent underline">/politica-confidentialitate</a>{" · "}
        <a href="/termeni-si-conditii" className="text-accent underline">/termeni-si-conditii</a>{" · "}
        <a href="/politica-cookies" className="text-accent underline">/politica-cookies</a>{" · "}
        <a href="/politica-retur" className="text-accent underline">/politica-retur</a>
      </div>
    </div>
  );
}

/* ════════════ D — Quarterly Review Reminders ════════════ */
function SectionReview() {
  const { general } = useSiteSettings();
  const policyUpdated = general?.policy_last_updated as string | undefined;
  const lastDate = policyUpdated ? new Date(policyUpdated) : null;
  const daysSince = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / 86400000) : null;
  const stale = daysSince !== null && daysSince > POLICY_STALE_DAYS;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><Calendar className="h-5 w-5" />Revizuire Trimestrială Politici</h2>
      <p className="text-sm text-muted-foreground">Banner de avertizare dacă politicile nu au fost actualizate în ultimele {POLICY_STALE_DAYS} zile. [CONFIGURABLE]</p>

      <div className={`rounded-lg border p-4 ${stale ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"}`}>
        <div className="flex items-center gap-3">
          {stale ? <AlertTriangle className="h-6 w-6 text-red-500" /> : <Check className="h-6 w-6 text-emerald-500" />}
          <div>
            {lastDate ? (
              <>
                <p className="font-semibold text-sm">
                  {stale
                    ? `⚠️ Politicile nu au fost revizuite de ${daysSince} zile!`
                    : `✓ Politicile au fost actualizate acum ${daysSince} zile.`}
                </p>
                <p className="text-xs text-muted-foreground">Ultima actualizare: {lastDate.toLocaleDateString("ro-RO")}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm">⚠️ Data ultimei actualizări nu este setată.</p>
                <p className="text-xs text-muted-foreground">Setați <code>policy_last_updated</code> în site_settings.general (format ISO 8601).</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
        <h3 className="font-semibold">Acțiuni recomandate la revizuire:</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
          <li>Verificați dacă politica de confidențialitate reflectă furnizori actuali (Tab B).</li>
          <li>Verificați dacă politica cookies corespunde CMP-ului activ.</li>
          <li>Verificați dacă termenii și condițiile reflectă procesul actual de comandă.</li>
          <li>Actualizați <code>policy_last_updated</code> în setări după revizuire.</li>
          <li>Documentați modificările în changelog-ul intern.</li>
          <li>[LEGAL] — Solicitați aviz avocat dacă s-au schimbat fluxuri de date.</li>
        </ul>
      </div>
    </div>
  );
}
