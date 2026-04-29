// Netopia Payments v2 — Start Payment
// Docs: https://doc.netopia-payments.com/docs/payment-api/v2.x/introduction
//
// Required env vars:
//   NETOPIA_API_KEY        — Bearer API key from Netopia admin panel
//   NETOPIA_POS_SIGNATURE  — POS signature (format: XXXX-XXXX-XXXX-XXXX-XXXX)
//   NETOPIA_ENV            — "sandbox" | "live" (default: "sandbox")
//   PUBLIC_SITE_URL        — e.g. https://mamalucica.ro (used for return/cancel URLs)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIp, tooManyRequests } from "../_shared/rate-limit.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

const NETOPIA_ENDPOINTS = {
  sandbox: "https://secure.sandbox.netopia-payments.com/payment/card/start",
  live: "https://secure.mobilpay.ro/payment/card/start",
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Rate limit: 5 payment attempts / minute / IP
  const rl = await checkRateLimit({
    endpoint: "netopia-payment",
    identifier: getClientIp(req),
    limit: 5,
    windowSeconds: 60,
  });
  if (!rl.allowed) return tooManyRequests(rl, corsHeaders);

  try {
    const NETOPIA_API_KEY = Deno.env.get("NETOPIA_API_KEY");
    const NETOPIA_POS_SIGNATURE = Deno.env.get("NETOPIA_POS_SIGNATURE");
    const NETOPIA_ENV = (Deno.env.get("NETOPIA_ENV") || "sandbox").toLowerCase();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://mamalucica.ro";

    if (!NETOPIA_API_KEY || !NETOPIA_POS_SIGNATURE) {
      console.error("[netopia-payment] Missing NETOPIA_API_KEY or NETOPIA_POS_SIGNATURE");
      return new Response(
        JSON.stringify({ error: "Payment provider not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const endpoint = NETOPIA_ENV === "live" ? NETOPIA_ENDPOINTS.live : NETOPIA_ENDPOINTS.sandbox;

    const { orderId, amount, currency, returnUrl, cancelUrl, customerData } = await req.json();
    console.log(`[netopia-payment] env=${NETOPIA_ENV} order=${orderId} amount=${amount} ${currency || "RON"}`);

    if (!orderId || !amount) {
      return new Response(JSON.stringify({ error: "Missing orderId or amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side authoritative amount + ownership check
    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, total, currency, customer_email, customer_name, customer_phone, shipping_address, city, county, postal_code, payment_status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("[netopia-payment] Order not found:", orderErr?.message);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Order already paid" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ALWAYS use server-side amount (never trust client)
    const authoritativeAmount = Number(order.total);
    const authoritativeCurrency = order.currency || currency || "RON";

    const billing = {
      email: order.customer_email || customerData?.email || "",
      phone: order.customer_phone || customerData?.phone || "",
      firstName: (order.customer_name || customerData?.firstName || "").split(" ")[0] || "",
      lastName: (order.customer_name || customerData?.lastName || "").split(" ").slice(1).join(" ") || "-",
      city: order.city || customerData?.city || "",
      country: 642,
      countryName: "Romania",
      state: order.county || customerData?.county || "",
      postalCode: order.postal_code || customerData?.postalCode || "",
      details: order.shipping_address || customerData?.address || "",
    };

    const paymentPayload = {
      config: {
        emailTemplate: "",
        notifyUrl: `${SUPABASE_URL}/functions/v1/netopia-ipn`,
        redirectUrl: returnUrl || `${PUBLIC_SITE_URL}/checkout/success?order=${order.order_number}`,
        cancelUrl: cancelUrl || `${PUBLIC_SITE_URL}/checkout/cancel?order=${order.order_number}`,
        language: "ro",
      },
      payment: {
        options: { installments: 0, bonus: 0 },
        instrument: { type: "card", account: "", expMonth: 0, expYear: 0, secretCode: "", token: "" },
        data: {
          BROWSER_USER_AGENT: req.headers.get("user-agent") || "",
          OS: "",
          BROWSER_COLOR_DEPTH: "24",
          BROWSER_SCREEN_WIDTH: "1920",
          BROWSER_SCREEN_HEIGHT: "1080",
          BROWSER_LANGUAGE: "ro-RO",
          BROWSER_TZ_OFFSET: "-180",
          MOBILE: "false",
          IP_ADDRESS: getClientIp(req) || "",
        },
      },
      order: {
        ntpID: "",
        posSignature: NETOPIA_POS_SIGNATURE,
        dateTime: new Date().toISOString(),
        description: `Comanda ${order.order_number} - Mama Lucica`,
        orderID: order.id,
        amount: authoritativeAmount,
        currency: authoritativeCurrency,
        billing,
        shipping: billing,
        products: [],
        installments: { selected: 0, available: [0] },
        data: {},
      },
    };

    const netopiaRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: NETOPIA_API_KEY,
      },
      body: JSON.stringify(paymentPayload),
    });

    const netopiaResult = await netopiaRes.json();
    console.log(`[netopia-payment] Netopia response status: ${netopiaRes.status}`);

    if (!netopiaRes.ok || netopiaResult.error) {
      console.error("[netopia-payment] Netopia error:", JSON.stringify(netopiaResult));
      return new Response(
        JSON.stringify({ error: "Payment initiation failed", details: netopiaResult?.error || netopiaResult }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ntpID = netopiaResult.payment?.ntpID || netopiaResult.ntpID || "";
    const paymentUrl =
      netopiaResult.payment?.paymentURL ||
      netopiaResult.paymentURL ||
      netopiaResult.payment?.redirect?.url ||
      "";

    if (!ntpID || !paymentUrl) {
      console.error("[netopia-payment] Missing ntpID/paymentURL:", JSON.stringify(netopiaResult));
      return new Response(
        JSON.stringify({ error: "Invalid Netopia response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("orders")
      .update({
        payment_reference: ntpID,
        payment_method: "netopia_card",
        payment_status: order.payment_status === "paid" ? "paid" : "pending",
      })
      .eq("id", order.id);

    console.log(`[netopia-payment] OK order=${order.order_number} ntpID=${ntpID}`);

    return new Response(
      JSON.stringify({ paymentUrl, ntpID }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[netopia-payment] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
