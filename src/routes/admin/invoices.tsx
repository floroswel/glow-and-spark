import { createFileRoute } from "@tanstack/react-router";
import { escapeHtml } from "@/lib/escape-html";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, Search, Download, Printer, Eye, CheckCircle, Clock, XCircle, Mail, Loader2, FileDown } from "lucide-react";

export const Route = createFileRoute("/admin/invoices")({
  component: AdminInvoices,
});

function AdminInvoices() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [previewOrder, setPreviewOrder] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);

  const downloadPDF = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", { body: { order_id: inv.id } });
      if (error || !data?.base64) throw new Error(error?.message || "Eroare generare PDF");
      const bytes = atob(data.base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || `factura-${inv.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Factură descărcată");
    } catch (e: any) {
      toast.error(e.message || "Eroare la descărcare");
    } finally {
      setDownloadingId(null);
    }
  };

  const emailInvoice = async (inv: any) => {
    setEmailingId(inv.id);
    try {
      const { data: gen, error: genErr } = await supabase.functions.invoke("generate-invoice", { body: { order_id: inv.id } });
      if (genErr || !gen?.base64) throw new Error(genErr?.message || "Eroare generare PDF");
      const { error: mailErr } = await supabase.functions.invoke("send-email", {
        body: {
          type: "invoice",
          to: inv.customer_email,
          data: {
            customer_name: inv.customer_name,
            order_number: inv.order_number,
            invoice_number: gen.invoice_number,
            total: inv.total,
          },
          attachments: [{ filename: gen.filename, content: gen.base64, type: "application/pdf" }],
        },
      });
      if (mailErr) throw new Error(mailErr.message);
      toast.success(`Factură trimisă către ${inv.customer_email}`);
    } catch (e: any) {
      toast.error(e.message || "Eroare la trimitere email");
    } finally {
      setEmailingId(null);
    }
  };

  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, []);

  const invoices = useMemo(() => orders.map((o, i) => ({
    ...o,
    invoice_number: `GS-${new Date(o.created_at).getFullYear()}-${String(orders.length - i).padStart(5, "0")}`,
    invoice_status: o.payment_status === "paid" ? "paid" : o.status === "cancelled" ? "cancelled" : "pending",
  })), [orders]);

  const filtered = useMemo(() => invoices.filter(inv => {
    if (filterStatus !== "all" && inv.invoice_status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return inv.invoice_number.toLowerCase().includes(s) || inv.order_number?.toLowerCase().includes(s) || inv.customer_name?.toLowerCase().includes(s);
    }
    return true;
  }), [invoices, search, filterStatus]);

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter(i => i.invoice_status === "paid").length,
    pending: invoices.filter(i => i.invoice_status === "pending").length,
    totalValue: invoices.filter(i => i.invoice_status !== "cancelled").reduce((a, i) => a + Number(i.total || 0), 0),
  }), [invoices]);

  const statusCfg: Record<string, { label: string; color: string; icon: any }> = {
    paid: { label: "Plătită", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
    pending: { label: "În așteptare", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
    cancelled: { label: "Anulată", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  };

  const printInvoice = (inv: any) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Factură ${inv.invoice_number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; }
        .logo span { color: #f59e0b; }
        .invoice-info { text-align: right; }
        .invoice-info h2 { margin: 0; font-size: 28px; color: #374151; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .party { width: 45%; }
        .party h3 { font-size: 12px; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f9fafb; padding: 10px; text-align: left; font-size: 12px; border-bottom: 2px solid #e5e7eb; }
        td { padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .totals { text-align: right; }
        .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
        .totals .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 8px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <div class="logo">GLOW<span>&</span>SPARK 🕯️</div>
        <div class="invoice-info">
          <h2>FACTURĂ</h2>
          <p><strong>${inv.invoice_number}</strong></p>
          <p>Data: ${new Date(inv.created_at).toLocaleDateString("ro-RO")}</p>
          <p>Comandă: ${inv.order_number}</p>
        </div>
      </div>
      <div class="parties">
        <div class="party">
          <h3>Furnizor</h3>
          <p><strong>SC Vomix Genius SRL</strong></p>
           <p>CUI: 43025661</p>
           <p>Str. Constructorilor Nr 39, sat Voievoda, com. Furculești, jud. Teleorman</p>
        </div>
        <div class="party">
          <h3>Client</h3>
          <p><strong>${inv.customer_name}</strong></p>
          ${inv.billing_type === "company" ? `<p>CUI: ${inv.company_cui || "—"}</p><p>${inv.company_name || ""}</p>` : ""}
          <p>${inv.shipping_address || ""}, ${inv.city || ""}, ${inv.county || ""}</p>
          <p>${inv.customer_email}</p>
          <p>${inv.customer_phone || ""}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Produs</th><th>Cantitate</th><th>Preț unitar</th><th>Total</th></tr></thead>
        <tbody>
          ${items.map((it: any, i: number) => `<tr><td>${i + 1}</td><td>${it.name || it.title || "Produs"}</td><td>${it.quantity || it.qty || 1}</td><td>${Number(it.price || 0).toFixed(2)} RON</td><td>${(Number(it.price || 0) * Number(it.quantity || it.qty || 1)).toFixed(2)} RON</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="totals">
        <div class="row"><span>Subtotal:</span><span>${Number(inv.subtotal || 0).toFixed(2)} RON</span></div>
        ${Number(inv.discount || 0) > 0 ? `<div class="row"><span>Reducere:</span><span>-${Number(inv.discount || inv.discount_amount || 0).toFixed(2)} RON</span></div>` : ""}
        <div class="row"><span>Livrare:</span><span>${Number(inv.shipping_cost || 0).toFixed(2)} RON</span></div>
        <div class="row total-final"><span>TOTAL:</span><span>${Number(inv.total).toFixed(2)} RON</span></div>
        <div class="row" style="font-size:11px;color:#888;margin-top:4px"><span>Operatorul nu este plătitor de TVA conform art. 310 din Codul fiscal.</span></div>
      </div>
      <div class="footer">
        <p>SC Vomix Genius SRL • CUI 43025661 • Banca: ING Bank • IBAN: RO49INGB0000999903456789</p>
        <p>Factură generată automat — nu necesită semnătură</p>
      </div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const exportCSV = () => {
    const headers = ["Nr. Factură", "Nr. Comandă", "Client", "Email", "Total", "Status", "Data"];
    const rows = filtered.map(i => [i.invoice_number, i.order_number, i.customer_name, i.customer_email, i.total, i.invoice_status, new Date(i.created_at).toLocaleDateString("ro-RO")]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `facturi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">📄 Facturi</h1>
          <p className="text-sm text-muted-foreground">Generare și management facturi comenzi</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Facturi</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Plătite</p>
          <p className="mt-1 text-2xl font-bold text-green-500">{stats.paid}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">În așteptare</p>
          <p className="mt-1 text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Valoare Totală</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.totalValue.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută factură, comandă, client..." className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm bg-background" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm bg-background">
          <option value="all">Toate</option>
          <option value="paid">Plătite</option>
          <option value="pending">În așteptare</option>
          <option value="cancelled">Anulate</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nr. Factură</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comandă</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Acțiuni</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0, 100).map(inv => {
              const cfg = statusCfg[inv.invoice_status] || statusCfg.pending;
              return (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition">
                  <td className="px-4 py-3 font-mono text-xs font-bold">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-xs">{inv.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">{inv.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(inv.total).toFixed(2)} RON</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
                      <cfg.icon className="h-3 w-3" />{cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("ro-RO")}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => printInvoice(inv)} className="rounded p-1.5 hover:bg-secondary transition" title="Printează">
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => downloadPDF(inv)}
                        disabled={downloadingId === inv.id}
                        className="rounded p-1.5 hover:bg-secondary transition disabled:opacity-50"
                        title="Descarcă PDF"
                      >
                        {downloadingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => emailInvoice(inv)}
                        disabled={emailingId === inv.id}
                        className="rounded p-1.5 hover:bg-secondary transition disabled:opacity-50"
                        title="Trimite pe email"
                      >
                        {emailingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm">Nicio factură găsită</div>}
      </div>
    </div>
  );
}
