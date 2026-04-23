import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const SITE_NAME = "Lumini.ro";
const SITE_URL = "https://glow-and-spark.lovable.app";

function orderConfirmationTemplate(data: any): { subject: string; html: string } {
  const items = (data.items || [])
    .map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(i.price * i.qty).toFixed(2)} RON</td></tr>`)
    .join("");

  return {
    subject: `Comanda #${data.orderNumber} confirmată!`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${SITE_NAME}</h1>
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
          <p style="color:#555;font-size:14px">Poți urmări comanda accesând <a href="${SITE_URL}/track-order" style="color:#c9a84c">pagina de urmărire</a>.</p>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${SITE_NAME}. Toate drepturile rezervate.
        </div>
      </div>
    </body></html>`,
  };
}

function welcomeTemplate(data: any): { subject: string; html: string } {
  return {
    subject: `Bun venit la ${SITE_NAME}! 🕯️`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Bun venit${data.name ? `, ${data.name}` : ""}! 🎉</h2>
          <p style="color:#555">Ne bucurăm că te-ai alăturat comunității ${SITE_NAME}.</p>
          ${data.discountCode ? `<div style="background:#fef9e7;border:2px dashed #c9a84c;border-radius:8px;padding:16px;text-align:center;margin:16px 0"><p style="margin:0 0 4px;color:#555">Cod reducere pentru prima comandă:</p><p style="margin:0;font-size:24px;font-weight:bold;color:#c9a84c;letter-spacing:2px">${data.discountCode}</p></div>` : ""}
          <a href="${SITE_URL}" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:16px 0">Vizitează magazinul</a>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${SITE_NAME}
        </div>
      </div>
    </body></html>`,
  };
}

function passwordResetTemplate(data: any): { subject: string; html: string } {
  return {
    subject: `Resetare parolă — ${SITE_NAME}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${SITE_NAME}</h1>
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

function orderStatusUpdateTemplate(data: any): { subject: string; html: string } {
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
          <h1 style="margin:0;font-size:22px">🕯️ ${SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">Actualizare comandă #${data.orderNumber}</h2>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:center;margin:16px 0">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#1a1a1a">${statusMap[data.status] || data.status}</p>
          </div>
          ${data.trackingNumber ? `<p style="color:#555">Număr AWB: <strong>${data.trackingNumber}</strong></p>` : ""}
          <a href="${SITE_URL}/track-order" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:16px 0">Urmărește comanda</a>
        </div>
      </div>
    </body></html>`,
  };
}

function orderShippedTemplate(data: any): { subject: string; html: string } {
  return {
    subject: `Comanda #${data.orderNumber} a fost expediată! 📦`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${SITE_NAME}</h1>
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
          <a href="${SITE_URL}/track-order" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;margin:16px 0">Urmărește comanda</a>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${SITE_NAME}. Toate drepturile rezervate.
        </div>
      </div>
    </body></html>`,
  };
}

function orderCompletedTemplate(data: any): { subject: string; html: string } {
  return {
    subject: `Comanda #${data.orderNumber} a fost finalizată! ✨`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1a1a1a;color:#fff;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px">🕯️ ${SITE_NAME}</h1>
        </div>
        <div style="padding:24px">
          <h2 style="color:#1a1a1a;margin-top:0">✨ Mulțumim pentru comanda ta!</h2>
          <p style="color:#555">Dragă ${data.customer_name || "client"},</p>
          <p style="color:#555">Comanda <strong>#${data.orderNumber}</strong> a fost finalizată cu succes. Sperăm că ești mulțumit(ă) de produsele noastre!</p>
          <p style="color:#555;font-size:14px"><strong>Total comandă:</strong> ${Number(data.total || 0).toFixed(2)} RON</p>
          <div style="background:#fef9e7;border:2px dashed #c9a84c;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
            <p style="margin:0 0 8px;color:#1a1a1a;font-size:16px;font-weight:bold">⭐ Lasă o recenzie!</p>
            <p style="margin:0 0 12px;color:#555;font-size:14px">Părerea ta ne ajută să ne îmbunătățim și ajută alți clienți să aleagă.</p>
            <a href="${SITE_URL}" style="display:inline-block;background:#c9a84c;color:#fff;text-decoration:none;padding:10px 28px;border-radius:8px;font-weight:bold;font-size:14px">Scrie o recenzie</a>
          </div>
          <p style="color:#555;font-size:14px">Dacă ai nevoie de ajutor sau ai întrebări, nu ezita să ne contactezi.</p>
          <a href="${SITE_URL}/contact" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 28px;border-radius:8px;font-weight:bold;font-size:14px;margin:8px 0">Contactează-ne</a>
        </div>
        <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
          © ${new Date().getFullYear()} ${SITE_NAME}. Toate drepturile rezervate.
        </div>
      </div>
    </body></html>`,
  };
}

const templates: Record<string, (data: any) => { subject: string; html: string }> = {
  order_confirmation: orderConfirmationTemplate,
  welcome: welcomeTemplate,
  password_reset: passwordResetTemplate,
  order_status_update: orderStatusUpdateTemplate,
  order_shipped: orderShippedTemplate,
  order_completed: orderCompletedTemplate,
  return_request: returnRequestTemplate,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { type, to, data } = await req.json();
    console.log(`[send-email] type=${type}, to=${to}`);

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "Missing type or to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateFn = templates[type];
    if (!templateFn) {
      return new Response(JSON.stringify({ error: `Unknown template: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = templateFn(data || {});

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@onboarding.resend.dev>`,
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

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-email] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
