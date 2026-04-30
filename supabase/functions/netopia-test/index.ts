// Netopia Test — Admin-only diagnostic endpoint.
// Creates a synthetic 1 RON sandbox transaction to verify NETOPIA_API_KEY +
// NETOPIA_POS_SIGNATURE + NETOPIA_ENV are valid without going through the
// full storefront checkout. Returns full diagnostic payload to the caller.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // --- Auth: must be admin ---
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "Missing Authorization bearer token" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return json(401, { error: "Invalid auth token", details: userErr?.message });
    }
    const userId = userRes.user.id;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) return json(403, { error: "Admin role required" });

    // --- Read + sanitize Netopia secrets ---
    const NETOPIA_API_KEY = (Deno.env.get("NETOPIA_API_KEY") || "").trim();
    const NETOPIA_POS_SIGNATURE = (Deno.env.get("NETOPIA_POS_SIGNATURE") || "").trim();
    const NETOPIA_ENV_RAW = (Deno.env.get("NETOPIA_ENV") || "sandbox").trim().toLowerCase();
    const NETOPIA_ENV = NETOPIA_ENV_RAW === "live" ? "live" : "sandbox";
    const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://mamalucica.ro";

    const config = {
      env: NETOPIA_ENV,
      envRaw: NETOPIA_ENV_RAW,
      hasApiKey: !!NETOPIA_API_KEY,
      apiKeyLen: NETOPIA_API_KEY.length,
      apiKeyPreview: NETOPIA_API_KEY ? `${NETOPIA_API_KEY.slice(0, 6)}...${NETOPIA_API_KEY.slice(-4)}` : "MISSING",
      hasPosSignature: !!NETOPIA_POS_SIGNATURE,
      posSignatureLen: NETOPIA_POS_SIGNATURE.length,
      posSignaturePreview: NETOPIA_POS_SIGNATURE ? `${NETOPIA_POS_SIGNATURE.slice(0, 8)}...` : "MISSING",
    };

    if (!NETOPIA_API_KEY || !NETOPIA_POS_SIGNATURE) {
      return json(400, {
        ok: false,
        stage: "config",
        error: "Lipsesc NETOPIA_API_KEY sau NETOPIA_POS_SIGNATURE din secrets",
        config,
      });
    }

    const endpoint = NETOPIA_ENV === "live" ? NETOPIA_ENDPOINTS.live : NETOPIA_ENDPOINTS.sandbox;

    // --- Build minimal valid test payload (1 RON) ---
    const testOrderId = `TEST-${Date.now()}`;
    const paymentPayload = {
      config: {
        emailTemplate: "",
        notifyUrl: `${SUPABASE_URL}/functions/v1/netopia-ipn`,
        redirectUrl: `${PUBLIC_SITE_URL}/admin/payments?test=success`,
        cancelUrl: `${PUBLIC_SITE_URL}/admin/payments?test=cancel`,
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
          IP_ADDRESS: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
        },
      },
      order: {
        ntpID: "",
        posSignature: NETOPIA_POS_SIGNATURE,
        dateTime: new Date().toISOString(),
        description: `Test diagnostic Netopia - ${testOrderId}`,
        orderID: testOrderId,
        amount: 1.00,
        currency: "RON",
        billing: {
          email: "test@mamalucica.ro",
          phone: "0700000000",
          firstName: "Test",
          lastName: "Admin",
          city: "Bucuresti",
          country: 642,
          countryName: "Romania",
          state: "Bucuresti",
          postalCode: "010101",
          details: "Strada Test 1",
        },
        shipping: {
          email: "test@mamalucica.ro",
          phone: "0700000000",
          firstName: "Test",
          lastName: "Admin",
          city: "Bucuresti",
          country: 642,
          countryName: "Romania",
          state: "Bucuresti",
          postalCode: "010101",
          details: "Strada Test 1",
        },
        products: [],
        installments: { selected: 0, available: [0] },
        data: {},
      },
    };

    const callNetopia = (authHeader: string) =>
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify(paymentPayload),
      });

    const t0 = Date.now();
    let netopiaRes = await callNetopia(NETOPIA_API_KEY);
    let usedAuthScheme = "raw";
    if (netopiaRes.status === 401) {
      netopiaRes = await callNetopia(`Bearer ${NETOPIA_API_KEY}`);
      usedAuthScheme = "bearer";
    }
    const elapsedMs = Date.now() - t0;

    const rawText = await netopiaRes.text();
    let parsed: any = null;
    try { parsed = JSON.parse(rawText); } catch { /* keep rawText */ }

    const ntpID = parsed?.payment?.ntpID || parsed?.ntpID || null;
    const paymentUrl =
      parsed?.payment?.paymentURL ||
      parsed?.paymentURL ||
      parsed?.payment?.redirect?.url ||
      null;

    const ok = netopiaRes.ok && !!ntpID && !!paymentUrl;

    return json(200, {
      ok,
      stage: ok ? "success" : "netopia-error",
      message: ok
        ? "Tranzacție test inițializată cu succes! Folosește link-ul de mai jos pentru a testa cu un card sandbox."
        : `Netopia a răspuns cu status ${netopiaRes.status}`,
      endpoint,
      elapsedMs,
      usedAuthScheme,
      netopiaStatus: netopiaRes.status,
      ntpID,
      paymentUrl,
      config,
      testOrderId,
      rawResponse: parsed || rawText.slice(0, 1500),
    });
  } catch (error) {
    return json(500, {
      ok: false,
      stage: "exception",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5) : undefined,
    });
  }
});
