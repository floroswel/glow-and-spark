// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInvoiceHTML(order: any, invoiceNumber: string): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotalNoVat = (Number(order.subtotal || 0) / 1.19).toFixed(2);
  const vatAmount = (Number(order.subtotal || 0) - Number(order.subtotal || 0) / 1.19).toFixed(2);
  const itemRows = items
    .map(
      (it: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${escapeHtml(it.name || it.title || "Produs")}</td><td>${it.quantity || it.qty || 1}</td><td>${Number(it.price || 0).toFixed(2)} RON</td><td>${(Number(it.price || 0) * Number(it.quantity || it.qty || 1)).toFixed(2)} RON</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Factură ${invoiceNumber}</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
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
    </style>
  </head><body>
    <div class="header">
      <div class="logo">MAMA<span>&nbsp;</span>LUCICA 🕯️</div>
      <div class="invoice-info">
        <h2>FACTURĂ</h2>
        <p><strong>${escapeHtml(invoiceNumber)}</strong></p>
        <p>Data: ${new Date(order.created_at).toLocaleDateString("ro-RO")}</p>
        <p>Comandă: ${escapeHtml(order.order_number)}</p>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <h3>Furnizor</h3>
        <p><strong>SC Vomix Genius SRL</strong></p>
        <p>CUI: 43025661</p>
      </div>
      <div class="party">
        <h3>Client</h3>
        <p><strong>${escapeHtml(order.customer_name)}</strong></p>
        ${order.billing_type === "company" ? `<p>CUI: ${escapeHtml(order.company_cui || "—")}</p><p>${escapeHtml(order.company_name || "")}</p>` : ""}
        <p>${escapeHtml(order.shipping_address || "")}, ${escapeHtml(order.city || "")}, ${escapeHtml(order.county || "")}</p>
        <p>${escapeHtml(order.customer_email)}</p>
        <p>${escapeHtml(order.customer_phone || "")}</p>
      </div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Produs</th><th>Cantitate</th><th>Preț unitar</th><th>Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>Subtotal (fără TVA):</span><span>${subtotalNoVat} RON</span></div>
      <div class="row"><span>TVA 19%:</span><span>${vatAmount} RON</span></div>
      ${Number(order.discount || order.discount_amount || 0) > 0 ? `<div class="row"><span>Reducere:</span><span>-${Number(order.discount || order.discount_amount || 0).toFixed(2)} RON</span></div>` : ""}
      <div class="row"><span>Livrare:</span><span>${Number(order.shipping_cost || 0).toFixed(2)} RON</span></div>
      <div class="row total-final"><span>TOTAL:</span><span>${Number(order.total).toFixed(2)} RON</span></div>
    </div>
    <div class="footer">
      <p>SC Vomix Genius SRL • CUI 43025661</p>
      <p>Factură generată automat — nu necesită semnătură</p>
    </div>
  </body></html>`;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await supabase.from("orders").select("*").eq("id", order_id).single();
    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const year = new Date(order.created_at).getFullYear();
    const invoiceNumber = `ML-${year}-${String(order.order_number).replace(/\D/g, "").padStart(5, "0").slice(-5)}`;
    const html = buildInvoiceHTML(order, invoiceNumber);

    // Generate "PDF" — using HTML as PDF body via simple wrapper.
    // Note: native PDF rendering libraries are not Worker/Deno-compatible here,
    // so we deliver an HTML document that browsers/email clients can print as PDF.
    // We still encode it as base64 so the client treats it uniformly.
    const bytes = new TextEncoder().encode(html);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: invoiceNumber,
        filename: `factura-${invoiceNumber}.pdf`,
        mime_type: "application/pdf",
        base64,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        order_number: order.order_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
