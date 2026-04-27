import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface SiteConfig {
  SITE_NAME: string;
  SITE_URL: string;
  FROM_EMAIL: string;
  CONTACT_EMAIL: string;
  ORDER_EMAIL_NOTIFICATIONS: boolean;
}

async function fetchSiteConfig(): Promise<SiteConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  const { data: settingsRow } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "general")
    .single();

  const v = settingsRow?.value as Record<string, any> | null;

  return {
    SITE_NAME: v?.site_name || "Glow & Spark",
    SITE_URL: v?.site_url || "https://glow-and-spark.lovable.app",
    FROM_EMAIL: v?.smtp_from_email || "comenzi@glowandspark.ro",
    CONTACT_EMAIL: v?.contact_email || "",
    ORDER_EMAIL_NOTIFICATIONS: v?.order_email_notifications === true,
  };
}

function orderConfirmationTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  const items = (data.items || [])
    .map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(i.price * i.qty).toFixed(2)} RON</td></tr>`)
    .join("");

  return {
    subject: `Comanda #${data.orderNumber} confirmată!`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${cfg.SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Comanda #${data.orderNumber} a fost confirmată!</h2>
          <p style="color:#555">Mulțumim pentru comanda ta. Mai jos găsești detaliile:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Produs</th><th style="padding:8px;text-align:center">Cant.</th><th style="padding:8px;text-align:right">Preț</th></tr></thead>
            <tbody>${items}</tbody>
          </table>
          <div style="text-align:right;margin:16px 0">
            ${data.shipping_cost != null ? `<p style="color:#555;margin:4px 0">Livrare: ${data.shipping_cost === 0 ? "GRATUITĂ" : data.shipping_cost + " RON"}</p>` : ""}
            ${data.discount_amount > 0 ? `<p style="color:#27ae60;margin:4px 0">Reducere: -${data.discount_amount.toFixed(2)} RON</p>` : ""}
            <p style="font-size:18px;font-weight:bold;color:#1a1a1a;margin:8px 0">Total: ${data.total.toFixed(2)} RON</p>
          </div>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
            <h3 style="margin:0 0 8px;color:#1a1a1a">Adresă livrare</h3>
            <p style="margin:0;color:#555">${data.customer_name}<br>${data.shipping_address}<br>${data.city}, ${data.county} ${data.postal_code || ""}</p>
            <p style="margin:8px 0 0;color:#555">📞 ${data.customer_phone || "—"}<br>📧 ${data.customer_email}</p>
          </div>
          <p style="color:#555;font-size:14px">Poți urmări comanda accesând <a href="${cfg.SITE_URL}/track-order" style="color:#c9a84c">pagina de urmărire</a>.</p>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${cfg.SITE_NAME}. Toate drepturile rezervate.
        </div>
      </div>
    </body></html>`,
  };
}

function welcomeTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  return {
    subject: `Bun venit la ${cfg.SITE_NAME}! 🕯️`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${cfg.SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Bun venit${data.name ? `, ${data.name}` : ""}! 🎉</h2>
          <p style="color:#555">Ne bucurăm că te-ai alăturat comunității ${cfg.SITE_NAME}.</p>
          ${data.discountCode ? `<div style="background:#fef9e7;border:2px dashed #c9a84c;border-radius:8px;padding:16px;text-align:center;margin:16px 0"><p style="margin:0 0 4px;color:#555">Cod reducere pentru prima comandă:</p><p style="margin:0;font-size:24px;font-weight:bold;color:#c9a84c;letter-spacing:2px">${data.discountCode}</p></div>` : ""}
          <a href="${cfg.SITE_URL}" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:16px 0">Vizitează magazinul</a>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${cfg.SITE_NAME}
        </div>
      </div>
    </body></html>`,
  };
}

function passwordResetTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  return {
    subject: `Resetare parolă — ${cfg.SITE_NAME}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${cfg.SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Resetare parolă</h2>
          <p style="color:#555">Ai solicitat resetarea parolei. Apasă butonul de mai jos:</p>
          <a href="${data.resetLink || "#"}" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:16px 0">Resetează parola</a>
          <p style="color:#999;font-size:13px">Dacă nu ai solicitat acest lucru, ignoră acest email.</p>
        </div>
      </div>
    </body></html>`,
  };
}

function orderStatusUpdateTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  const statusMap: Record<string, string> = {
    processing: "În procesare",
    shipped: "Expediată",
    delivered: "Livrată",
    cancelled: "Anulată",
  };
  return {
    subject: `Comanda #${data.orderNumber} — ${statusMap[data.status] || data.status}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${cfg.SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Actualizare comandă #${data.orderNumber}</h2>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:center;margin:16px 0">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#1a1a1a">${statusMap[data.status] || data.status}</p>
          </div>
          ${data.trackingNumber ? `<p style="color:#555">Număr AWB: <strong>${data.trackingNumber}</strong></p>` : ""}
          <a href="${cfg.SITE_URL}/track-order" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:16px 0">Urmărește comanda</a>
        </div>
      </div>
    </body></html>`,
  };
}

function orderShippedTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  return {
    subject: `Comanda #${data.orderNumber} a fost expediată! 📦`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${cfg.SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">📦 Comanda ta a fost expediată!</h2>
          <p style="color:#555">Dragă ${data.customer_name || "client"},</p>
          <p style="color:#555">Comanda <strong>#${data.orderNumber}</strong> a fost expediată și este în drum spre tine.</p>
          ${data.tracking_number ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;text-align:center"><p style="margin:0 0 4px;color:#555;font-size:13px">Număr AWB:</p><p style="margin:0;font-size:20px;font-weight:bold;color:#0369a1;letter-spacing:1px">${data.tracking_number}</p></div>` : ""}
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
            <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:15px">⏱️ Livrare estimată</h3>
            <p style="margin:0;color:#555">Coletul va ajunge în <strong>24-48 ore lucrătoare</strong> de la expediere.</p>
            <p style="margin:8px 0 0;color:#555;font-size:13px">Curierul te va contacta telefonic înainte de livrare.</p>
          </div>
          <p style="color:#555;font-size:14px;margin-top:16px"><strong>Total comandă:</strong> ${Number(data.total || 0).toFixed(2)} RON</p>
          <a href="${cfg.SITE_URL}/track-order" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:16px 0">Urmărește comanda</a>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${cfg.SITE_NAME}. Toate drepturile rezervate.
        </div>
      </div>
    </body></html>`,
  };
}

function orderCompletedTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  return {
    subject: `Comanda #${data.orderNumber} a fost finalizată! ✨`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${cfg.SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">✨ Mulțumim pentru comanda ta!</h2>
          <p style="color:#555">Dragă ${data.customer_name || "client"},</p>
          <p style="color:#555">Comanda <strong>#${data.orderNumber}</strong> a fost finalizată cu succes. Sperăm că ești mulțumit(ă) de produsele noastre!</p>
          <p style="color:#555;font-size:14px"><strong>Total comandă:</strong> ${Number(data.total || 0).toFixed(2)} RON</p>
          <div style="background:#fef9e7;border:2px dashed #c9a84c;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
            <p style="margin:0 0 8px;color:#1a1a1a;font-size:16px;font-weight:bold">⭐ Lasă o recenzie!</p>
            <p style="margin:0 0 12px;color:#555;font-size:14px">Părerea ta ne ajută să ne îmbunătățim și ajută alți clienți să aleagă.</p>
            <a href="${cfg.SITE_URL}" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:10px 28px;border-radius:8px;font-weight:bold;font-size:14px">Scrie o recenzie</a>
          </div>
          <p style="color:#555;font-size:14px">Dacă ai nevoie de ajutor sau ai întrebări, nu ezita să ne contactezi.</p>
          <a href="${cfg.SITE_URL}/contact" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 28px;border-radius:8px;font-weight:bold;font-size:14px;margin:8px 0">Contactează-ne</a>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${cfg.SITE_NAME}. Toate drepturile rezervate.
        </div>
      </div>
    </body></html>`,
  };
}

function returnRequestTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  const itemsList = (data.items || [])
    .map((i: any) => `<li style="padding:4px 0;color:#555">${i.name} × ${i.quantity || i.qty || 1}</li>`)
    .join("");

  return {
    subject: `⚠️ Cerere retur — Comanda #${data.orderNumber}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#dc2626;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">↩️ Cerere de Retur</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Comanda #${data.orderNumber}</h2>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:12px 0">
            <p style="margin:0 0 4px;color:#555"><strong>Client:</strong> ${data.customer_name}</p>
            <p style="margin:0;color:#555"><strong>Email:</strong> ${data.customer_email}</p>
          </div>
          <p style="color:#1a1a1a;font-weight:bold;margin:16px 0 8px">Motiv: ${data.reason}</p>
          ${data.details ? `<p style="color:#555;margin:0 0 16px;background:#fef2f2;border-radius:8px;padding:12px">${data.details}</p>` : ""}
          <p style="color:#1a1a1a;font-weight:bold;margin:16px 0 4px">Produse solicitate:</p>
          <ul style="margin:0;padding-left:20px">${itemsList}</ul>
          <a href="${cfg.SITE_URL}/admin/returns" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:20px 0 0">Gestionează returul</a>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${cfg.SITE_NAME}
        </div>
      </div>
    </body></html>`,
  };
}

function cartRecoveryTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  const itemsList = (data.items || [])
    .map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity || 1}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(i.price * (i.quantity || 1)).toFixed(2)} RON</td></tr>`)
    .join("");

  return {
    subject: `Ai uitat ceva în coș! 🛒 — ${cfg.SITE_NAME}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${cfg.SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Ai uitat ceva în coș! 🛒</h2>
          <p style="color:#555">Produsele tale te așteaptă. Finalizează comanda înainte ca stocul să se epuizeze!</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Produs</th><th style="padding:8px;text-align:center">Cant.</th><th style="padding:8px;text-align:right">Preț</th></tr></thead>
            <tbody>${itemsList}</tbody>
          </table>
          <div style="text-align:right;margin:16px 0">
            <p style="font-size:18px;font-weight:bold;color:#1a1a1a">Total: ${Number(data.total || 0).toFixed(2)} RON</p>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${cfg.SITE_URL}/cart" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:bold;font-size:16px">Finalizează comanda</a>
          </div>
          <p style="color:#999;font-size:13px;text-align:center">Dacă ai finalizat deja comanda, ignoră acest email.</p>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${cfg.SITE_NAME}. Toate drepturile rezervate.
        </div>
      </div>
    </body></html>`,
  };
}

function accountDeletionRequestTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  return {
    subject: `⚠️ Cerere ștergere cont — ${data.email}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#dc2626;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">⚠️ Cerere Ștergere Cont</h1>
        </div>
        <div style="padding:24px">
          <p style="color:#555"><strong>Email:</strong> ${data.email}</p>
          <p style="color:#555"><strong>User ID:</strong> ${data.userId}</p>
          <p style="color:#555"><strong>Data cererii:</strong> ${new Date().toLocaleString("ro-RO")}</p>
          <p style="color:#dc2626;font-weight:bold;margin-top:16px">Contul trebuie șters în maximum 30 de zile conform GDPR.</p>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${cfg.SITE_NAME}
        </div>
      </div>
    </body></html>`,
  };
}

function lowStockAlertTemplate(data: any, cfg: SiteConfig): { subject: string; html: string } {
  const rows = (data.products || [])
    .map(
      (p: any) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${p.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${p.sku || "—"}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#c0392b;font-weight:bold">${p.stock}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${p.threshold}</td></tr>`,
    )
    .join("");
  const single = data.product;
  const body = single
    ? `<p style="color:#555">Produsul <strong>${single.name}</strong> (SKU: ${single.sku || "—"}) are stoc scăzut.</p>
       <p style="color:#555">Stoc curent: <strong style="color:#c0392b">${single.stock}</strong> / Prag alertă: <strong>${single.threshold}</strong></p>`
    : `<p style="color:#555">Următoarele produse au stoc sub pragul de alertă:</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Produs</th><th style="padding:8px;text-align:left">SKU</th><th style="padding:8px;text-align:center">Stoc</th><th style="padding:8px;text-align:center">Prag</th></tr></thead>
         <tbody>${rows}</tbody>
       </table>`;
  return {
    subject: `⚠️ Alertă stoc scăzut — ${cfg.SITE_NAME}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#c0392b;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">⚠️ Alertă Stoc Scăzut</h1>
        </div>
        <div style="padding:24px">
          ${body}
          <div style="text-align:center;margin-top:24px">
            <a href="${cfg.SITE_URL}/admin/stock" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Gestionează stoc</a>
          </div>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:12px">${cfg.SITE_NAME}</div>
      </div></body></html>`,
  };
}

const templateMap: Record<string, (data: any, cfg: SiteConfig) => { subject: string; html: string }> = {
  order_confirmation: orderConfirmationTemplate,
  welcome: welcomeTemplate,
  password_reset: passwordResetTemplate,
  order_status_update: orderStatusUpdateTemplate,
  order_shipped: orderShippedTemplate,
  order_completed: orderCompletedTemplate,
  return_request: returnRequestTemplate,
  cart_recovery: cartRecoveryTemplate,
  account_deletion_request: accountDeletionRequestTemplate,
  low_stock_alert: lowStockAlertTemplate,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const rl = rateLimitMap.get(ip);
  if (rl && now < rl.resetAt) {
    if (rl.count >= 10) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    rl.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Fetch site configuration from database
    const cfg = await fetchSiteConfig();

    const body = await req.json();
    const { type, to, data } = body;
    console.log(`[send-email] type=${type}, to=${to}`);

    // Special-case: contact form — sends two emails (admin + customer confirmation)
    if (type === "contact_form") {
      const customerName = String(body.customer_name || "").slice(0, 200);
      const customerEmail = String(body.customer_email || "").slice(0, 255);
      const subj = String(body.subject || "Mesaj de contact").slice(0, 300);
      const message = String(body.message || "").slice(0, 5000);
      const phone = body.phone ? String(body.phone).slice(0, 30) : "";

      if (!customerEmail || !message) {
        return new Response(JSON.stringify({ error: "Missing customer_email or message" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
      const adminTo = cfg.CONTACT_EMAIL;
      const adminSubject = `Mesaj nou de la ${customerName || customerEmail}: ${subj}`;
      const adminHtml = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#1a1a1a;color:#fff;padding:20px"><h2 style="margin:0">📨 Mesaj nou de contact</h2></div>
          <div style="padding:24px;color:#333">
            <p><strong>Nume:</strong> ${esc(customerName) || "—"}</p>
            <p><strong>Email:</strong> <a href="mailto:${esc(customerEmail)}">${esc(customerEmail)}</a></p>
            <p><strong>Telefon:</strong> ${esc(phone) || "—"}</p>
            <p><strong>Subiect:</strong> ${esc(subj)}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
            <p><strong>Mesaj:</strong></p>
            <div style="background:#f9f9f9;border-radius:8px;padding:14px;white-space:pre-wrap;color:#333">${esc(message)}</div>
          </div>
        </div></body></html>`;

      const customerSubject = `Am primit mesajul tău — ${cfg.SITE_NAME}`;
      const customerHtml = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center"><h1 style="margin:0;font-size:22px">🕯️ ${esc(cfg.SITE_NAME)}</h1></div>
          <div style="padding:24px;color:#333">
            <h2 style="margin-top:0;color:#1a1a1a">Mulțumim${customerName ? `, ${esc(customerName)}` : ""}!</h2>
            <p style="color:#555">Am primit mesajul tău și îți vom răspunde în maxim 1 zi lucrătoare.</p>
            <div style="background:#f9f9f9;border-radius:8px;padding:14px;margin:16px 0">
              <p style="margin:0 0 6px;color:#999;font-size:13px">Mesajul tău:</p>
              <p style="margin:0;color:#333;white-space:pre-wrap">${esc(message)}</p>
            </div>
            <p style="color:#555;font-size:14px">Cu drag,<br>Echipa ${esc(cfg.SITE_NAME)}</p>
          </div>
        </div></body></html>`;

      const sendOne = async (toAddr: string, s: string, h: string) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({ from: `${cfg.SITE_NAME} <${cfg.FROM_EMAIL}>`, to: [toAddr], subject: s, html: h }),
        });

      const results: any = {};
      if (adminTo) {
        try {
          const r = await sendOne(adminTo, adminSubject, adminHtml);
          results.admin = await r.json();
        } catch (e) { console.error("[send-email] contact admin send failed:", e); }
      }
      try {
        const r = await sendOne(customerEmail, customerSubject, customerHtml);
        results.customer = await r.json();
      } catch (e) { console.error("[send-email] contact customer send failed:", e); }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "Missing type or to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try custom template from site_settings first
    let subject: string | undefined;
    let html: string | undefined;

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      const { data: tplRow } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "email_templates")
        .single();

      if (tplRow?.value && Array.isArray(tplRow.value)) {
        const customTpl = (tplRow.value as any[]).find(
          (t: any) => t.id === type && t.active !== false
        );
        if (customTpl && customTpl.subject && customTpl.body) {
          const d = data || {};
          const replacements: Record<string, string> = {
            "{customer_name}": String(d.customer_name ?? ""),
            "{order_number}": String(d.orderNumber ?? d.order_number ?? ""),
            "{total}": d.total != null ? Number(d.total).toFixed(2) : "",
            "{site_name}": cfg.SITE_NAME,
            "{site_url}": cfg.SITE_URL,
          };
          const applyVars = (str: string) =>
            Object.entries(replacements).reduce(
              (acc, [k, v]) => acc.split(k).join(v),
              str
            );
          subject = applyVars(String(customTpl.subject));
          html = applyVars(String(customTpl.body));
          console.log(`[send-email] Using custom template for type=${type}`);
        }
      }
    } catch (err) {
      console.error("[send-email] Failed to load custom templates:", err);
    }

    if (!subject || !html) {
      const templateFn = templateMap[type];
      if (!templateFn) {
        return new Response(JSON.stringify({ error: `Unknown template: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const built = templateFn(data || {}, cfg);
      subject = built.subject;
      html = built.html;
    }

    // Send the primary email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${cfg.SITE_NAME} <${cfg.FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();
    console.log(`[send-email] Resend response:`, JSON.stringify(result));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Email send failed", details: result }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For order confirmations, send a notification copy to the admin contact email
    if (type === "order_confirmation" && cfg.ORDER_EMAIL_NOTIFICATIONS && cfg.CONTACT_EMAIL) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${cfg.SITE_NAME} <${cfg.FROM_EMAIL}>`,
            to: [cfg.CONTACT_EMAIL],
            subject: `[Admin] ${subject}`,
            html,
          }),
        });
        console.log(`[send-email] Admin notification sent to ${cfg.CONTACT_EMAIL}`);
      } catch (err) {
        console.error(`[send-email] Failed to send admin copy:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-email] Error:", error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
