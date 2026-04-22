import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, FileText, Package, Users, ShoppingCart, Tag, Database } from "lucide-react";

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

function AdminImportExport() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importTarget, setImportTarget] = useState("products");
  const [importResult, setImportResult] = useState("");
  const [toast, setToast] = useState("");

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult("");

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) throw new Error("Fișierul nu conține date");

      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => { if (vals[i] !== undefined && vals[i] !== "") obj[h] = vals[i]; });
        return obj;
      });

      const { error } = await supabase.from(importTarget as any).upsert(rows as any, { onConflict: importTarget === "products" ? "slug" : "id" });
      if (error) throw error;
      setImportResult(`✅ Import reușit: ${rows.length} rânduri procesate în ${importTarget}`);
    } catch (err: any) {
      setImportResult(`❌ Eroare import: ${err.message}`);
    }
    setImporting(false);
    e.target.value = "";
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
          <div className="flex items-end gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tabel destinație</label>
              <select value={importTarget} onChange={e => setImportTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm bg-background">
                {exports.map(e => <option key={e.id} value={e.table}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:border-accent/50 hover:text-accent cursor-pointer transition">
                <Upload className="h-4 w-4" />
                {importing ? "Se importă..." : "Alege fișier CSV"}
                <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
              </label>
            </div>
          </div>
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
