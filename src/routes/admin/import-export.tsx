import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, Package, Users, ShoppingCart, Tag, Database, FileDown, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/import-export")({
  component: AdminImportExport,
});

interface ExportConfig {
  id: string;
  label: string;
  table: string;
  icon: any;
  columns: string[];
  description: string;
}

const exports: ExportConfig[] = [
  { id: "products", label: "Produse", table: "products", icon: Package, columns: ["name", "slug", "sku", "price", "old_price", "cost_price", "stock", "category_id", "is_active", "weight", "brand", "meta_title", "meta_description"], description: "Export toate produsele cu prețuri, stoc și SEO" },
  { id: "orders", label: "Comenzi", table: "orders", icon: ShoppingCart, columns: ["order_number", "customer_name", "customer_email", "customer_phone", "status", "payment_method", "payment_status", "subtotal", "shipping_cost", "discount", "total", "city", "county", "awb_number", "created_at"], description: "Export comenzi cu status și detalii client" },
  { id: "customers", label: "Clienți", table: "profiles", icon: Users, columns: ["full_name", "phone", "user_id", "created_at"], description: "Export bază de date clienți" },
  { id: "categories", label: "Categorii", table: "categories", icon: Tag, columns: ["name", "slug", "description", "sort_order", "visible"], description: "Export categorii produse" },
  { id: "coupons", label: "Cupoane", table: "coupons", icon: Tag, columns: ["code", "type", "value", "min_order", "max_uses", "uses", "active", "expires_at"], description: "Export cupoane de reducere" },
  { id: "subscribers", label: "Abonați Newsletter", table: "newsletter_subscribers", icon: Users, columns: ["email", "name", "source", "is_active", "created_at"], description: "Export lista abonați email" },
];

const REQUIRED_COLS: Record<string, string[]> = {
  products: ["name", "price", "stock"],
  categories: ["name", "slug"],
  coupons: ["code", "value"],
  newsletter_subscribers: ["email"],
};

const PRODUCT_COLUMNS = ["name", "slug", "sku", "price", "old_price", "cost_price", "stock", "category_id", "is_active", "weight", "brand", "meta_title", "meta_description", "short_description", "description"];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
      } else if (c === "," && !inQ) { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur);
    return out.map(s => s.trim());
  };
  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function AdminImportExport() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importTarget, setImportTarget] = useState("products");
  const [importResult, setImportResult] = useState("");
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState<{ headers: string[]; rows: any[]; skipped: { row: number; reason: string }[]; valid: any[] } | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleExport = async (cfg: ExportConfig) => {
    setExporting(cfg.id);
    try {
      const { data, error } = await supabase.from(cfg.table as any).select(cfg.columns.join(",")).limit(10000);
      if (error) throw error;
      if (!data || data.length === 0) { setToast("Nu sunt date de exportat"); setTimeout(() => setToast(""), 3000); setExporting(null); return; }

      const headers = cfg.columns;
      const rows = (data as any[]).map(row => headers.map(h => {
        const val = (row as any)[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }));
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${cfg.id}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      setToast(`${cfg.label} exportate: ${data.length} rânduri`);
    } catch (err: any) {
      setToast(`Eroare: ${err.message}`);
    }
    setExporting(null);
    setTimeout(() => setToast(""), 3000);
  };

  const downloadTemplate = () => {
    const sample = [
      PRODUCT_COLUMNS.join(","),
      `"Produs Exemplu","produs-exemplu","SKU-001",99.99,129.99,50,10,,true,"500g","Brand X","Meta Title","Meta description","Descriere scurtă","Descriere completă"`,
    ].join("\n");
    const blob = new Blob(["\uFEFF" + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template_produse.csv";
    a.click(); URL.revokeObjectURL(url);
    setToast("Template descărcat");
    setTimeout(() => setToast(""), 2500);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult("");
    setPreview(null);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) throw new Error("Fișierul nu conține date");

      const required = REQUIRED_COLS[importTarget] || [];
      const missing = required.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        setImportResult(`❌ Coloane obligatorii lipsă: ${missing.join(", ")}`);
        e.target.value = "";
        return;
      }

      const skipped: { row: number; reason: string }[] = [];
      const valid: any[] = [];

      rows.forEach((vals, idx) => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => { if (vals[i] !== undefined && vals[i] !== "") obj[h] = vals[i].replace(/^"|"$/g, ""); });

        if (importTarget === "products") {
          if (!obj.name || String(obj.name).trim() === "") {
            skipped.push({ row: idx + 2, reason: "nume gol" }); return;
          }
          const price = parseFloat(obj.price);
          if (isNaN(price) || price < 0) {
            skipped.push({ row: idx + 2, reason: `preț invalid (${obj.price})` }); return;
          }
          obj.price = price;
          if (obj.old_price) obj.old_price = parseFloat(obj.old_price) || null;
          if (obj.cost_price) obj.cost_price = parseFloat(obj.cost_price) || 0;
          if (obj.stock) obj.stock = parseInt(obj.stock) || 0;
          if (obj.is_active !== undefined) obj.is_active = String(obj.is_active).toLowerCase() === "true";
          if (!obj.slug) obj.slug = String(obj.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }
        valid.push(obj);
      });

      setPreview({ headers, rows: valid.slice(0, 5), skipped, valid });
    } catch (err: any) {
      setImportResult(`❌ Eroare citire fișier: ${err.message}`);
    }
    e.target.value = "";
  };

  const confirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    setProgress({ current: 0, total: preview.valid.length });
    try {
      const batchSize = 50;
      let imported = 0;
      for (let i = 0; i < preview.valid.length; i += batchSize) {
        const batch = preview.valid.slice(i, i + batchSize);
        const { error } = await supabase.from(importTarget as any).upsert(batch as any, { onConflict: importTarget === "products" ? "slug" : importTarget === "categories" ? "slug" : importTarget === "coupons" ? "code" : importTarget === "newsletter_subscribers" ? "email" : "id" });
        if (error) throw error;
        imported += batch.length;
        setProgress({ current: imported, total: preview.valid.length });
      }
      const skippedSummary = preview.skipped.length > 0
        ? ` ${preview.skipped.length} rânduri sărite (${[...new Set(preview.skipped.map(s => s.reason))].slice(0, 3).join(", ")})`
        : "";
      setImportResult(`✅ ${imported} produse importate cu succes.${skippedSummary}`);
      setPreview(null);
    } catch (err: any) {
      setImportResult(`❌ Eroare import: ${err.message}`);
    }
    setImporting(false);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">{toast}</div>}

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">📥 Import / Export Date</h1>
        <p className="text-sm text-muted-foreground">Exportă sau importă date în format CSV</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground text-lg">Export Date</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exports.map(cfg => (
            <div key={cfg.id} className="rounded-xl border border-border p-4 hover:border-accent/30 transition">
              <div className="flex items-center gap-2 mb-2">
                <cfg.icon className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-sm">{cfg.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{cfg.description}</p>
              <p className="text-[10px] text-muted-foreground/60 mb-3">Coloane: {cfg.columns.join(", ")}</p>
              <button
                onClick={() => handleExport(cfg)}
                disabled={exporting === cfg.id}
                className="flex items-center gap-2 rounded-lg bg-accent/10 text-accent px-3 py-2 text-xs font-medium hover:bg-accent/20 transition disabled:opacity-50"
              >
                {exporting === cfg.id ? (
                  <><div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" /> Exportare...</>
                ) : (
                  <><Download className="h-3.5 w-3.5" /> Descarcă CSV</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground text-lg">Import Date</h2>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">⚠️ Atenție la import!</p>
            <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 space-y-1">
              <li>• Fișierul trebuie să fie CSV cu header pe prima linie</li>
              <li>• Coloanele trebuie să corespundă câmpurilor din baza de date</li>
              <li>• Datele existente cu același ID/slug vor fi actualizate</li>
              <li>• Faceți backup înainte de import masiv</li>
            </ul>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tabel destinație</label>
              <select value={importTarget} onChange={e => { setImportTarget(e.target.value); setPreview(null); setImportResult(""); }} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background">
                {exports.map(e => <option key={e.id} value={e.table}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:border-accent/50 hover:text-accent cursor-pointer transition">
                <Upload className="h-4 w-4" />
                {importing ? `Se importă ${progress.current}/${progress.total}...` : "Alege fișier CSV"}
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" disabled={importing} />
              </label>
            </div>
            {importTarget === "products" && (
              <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/10 transition">
                <FileDown className="h-4 w-4" /> Descarcă Template
              </button>
            )}
          </div>

          {importing && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Se importă {progress.current} din {progress.total} produse...</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-accent transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {preview && !importing && (
            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-semibold text-foreground">Preview: {preview.valid.length} rânduri valide</p>
                </div>
                {preview.skipped.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> {preview.skipped.length} sărite
                  </div>
                )}
              </div>

              {preview.skipped.length > 0 && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-2 max-h-24 overflow-y-auto">
                  <p className="text-[11px] text-yellow-700 dark:text-yellow-400 font-medium mb-1">Rânduri sărite:</p>
                  {preview.skipped.slice(0, 10).map((s, i) => (
                    <div key={i} className="text-[11px] text-yellow-700 dark:text-yellow-400">Rând {s.row}: {s.reason}</div>
                  ))}
                  {preview.skipped.length > 10 && <div className="text-[11px] text-yellow-700 dark:text-yellow-400">... și încă {preview.skipped.length - 10}</div>}
                </div>
              )}

              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>{preview.headers.slice(0, 6).map(h => <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        {preview.headers.slice(0, 6).map(h => <td key={h} className="px-2 py-1.5 text-foreground truncate max-w-[120px]">{String(r[h] ?? "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button onClick={confirmImport} disabled={preview.valid.length === 0} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> Confirmă importul ({preview.valid.length})
                </button>
                <button onClick={() => setPreview(null)} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
                  <XCircle className="h-4 w-4" /> Anulează
                </button>
              </div>
            </div>
          )}

          {importResult && (
            <div className={`rounded-lg p-3 text-sm ${importResult.startsWith("✅") ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"}`}>
              {importResult}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground text-lg">Backup & Restore</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Backup-urile bazei de date sunt gestionate automat de Lovable Cloud cu retenție de 7 zile.</p>
        <div className="flex gap-3">
          <button onClick={() => { exports.forEach(e => handleExport(e)); }} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
            <Download className="h-4 w-4" /> Export Complet (Toate Tabelele)
          </button>
        </div>
      </div>
    </div>
  );
}
