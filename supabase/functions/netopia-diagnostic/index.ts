// Netopia Diagnostic — Admin-only health check for Netopia secrets & connectivity.
// Two modes:
//   POST {"mode":"secrets"} → only verifies the shape of the secrets (no external call)
//   POST {"mode":"probe"}   → also does a probe call to Netopia and reports HTTP status
//
// Returns warnings for common misconfigurations (PEM put in API_KEY, missing POS sig,
// wrong env value, missing public key, etc).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

const NETOPIA_ENDPOINTS = {
  sandbox: "https://secure.sandbox.netopia-payments.com/payment/card/start",
  live: "https://secure.mobilpay.ro/pay/payment/card/start",
};

function looksLikeCertificate(key: string): boolean {
  return /-----BEGIN (CERTIFICATE|PUBLIC KEY|RSA PUBLIC KEY)-----/.test(key);
}

function looksLikeJwt(key: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key);
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body, null, 2), {
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

    // --- Parse mode ---
    let mode: "secrets" | "probe" = "secrets";
    try {
      const body = await req.json();
      if (body?.mode === "probe") mode = "probe";
    } catch { /* default to secrets */ }

    // --- Read secrets ---
    const NETOPIA_API_KEY = (Deno.env.get("NETOPIA_API_KEY") || "").trim();
    const NETOPIA_POS_SIGNATURE = (Deno.env.get("NETOPIA_POS_SIGNATURE") || "").trim();
    const NETOPIA_ENV_RAW = (Deno.env.get("NETOPIA_ENV") || "sandbox").trim();
    const NETOPIA_ENV = NETOPIA_ENV_RAW.toLowerCase() === "live" ? "live" : "sandbox";
    const NETOPIA_PUBLIC_KEY = (Deno.env.get("NETOPIA_PUBLIC_KEY") || "").trim();
    const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://mamalucica.ro";
    const endpoint = NETOPIA_ENDPOINTS[NETOPIA_ENV];

    const apiKeyLooksLikeCertificate = looksLikeCertificate(NETOPIA_API_KEY);
    const apiKeyLooksLikeJwt = looksLikeJwt(NETOPIA_API_KEY);
    const publicKeyLooksValid = NETOPIA_PUBLIC_KEY.length > 200 && /-----BEGIN (CERTIFICATE|PUBLIC KEY)-----/.test(NETOPIA_PUBLIC_KEY);

    const warnings: string[] = [];
    if (!NETOPIA_API_KEY) warnings.push("NETOPIA_API_KEY lipsește complet din secrets.");
    if (!NETOPIA_POS_SIGNATURE) warnings.push("NETOPIA_POS_SIGNATURE lipsește complet din secrets.");
    if (apiKeyLooksLikeCertificate) {
      warnings.push(`NETOPIA_API_KEY pare să fie un CERTIFICAT PEM (lungime=${NETOPIA_API_KEY.length}, începe cu '-----BEGIN'). Trebuie pus aici API Key-ul (string scurt 50-300 car.), iar certificatul în NETOPIA_PUBLIC_KEY.`);
    }
    if (NETOPIA_API_KEY && NETOPIA_API_KEY.length > 0 && NETOPIA_API_KEY.length < 30) {
      warnings.push(`NETOPIA_API_KEY este foarte scurt (${NETOPIA_API_KEY.length} car.). Verifică că ai copiat toată cheia.`);
    }
    if (NETOPIA_API_KEY && NETOPIA_API_KEY.length > 500 && !apiKeyLooksLikeCertificate) {
      warnings.push(`NETOPIA_API_KEY este suspect de lung (${NETOPIA_API_KEY.length} car.). Cheile API tipice au 50-300 caractere.`);
    }
    if (NETOPIA_POS_SIGNATURE && !/^[A-Z0-9-]+$/i.test(NETOPIA_POS_SIGNATURE)) {
      warnings.push(`NETOPIA_POS_SIGNATURE conține caractere neașteptate. Format tipic: XXXX-XXXX-XXXX-XXXX-XXXX.`);
    }
    if (NETOPIA_ENV_RAW.toLowerCase() !== NETOPIA_ENV_RAW) {
      warnings.push(`NETOPIA_ENV are litere mari ('${NETOPIA_ENV_RAW}'). Recomandat: 'sandbox' sau 'live' (lowercase).`);
    }
    if (NETOPIA_ENV_RAW && !["sandbox", "live"].includes(NETOPIA_ENV_RAW.toLowerCase())) {
      warnings.push(`NETOPIA_ENV='${NETOPIA_ENV_RAW}' este neașteptat. Folosesc fallback la 'sandbox'.`);
    }
    if (!NETOPIA_PUBLIC_KEY) {
      warnings.push("NETOPIA_PUBLIC_KEY lipsește. IPN-ul nu va putea verifica semnătura JWT și toate notificările vor fi respinse.");
    } else if (!publicKeyLooksValid) {
      warnings.push("NETOPIA_PUBLIC_KEY nu pare să fie PEM valid (lipsește -----BEGIN CERTIFICATE----- sau -----BEGIN PUBLIC KEY-----).");
    }

    const result: any = {
      ok: warnings.length === 0,
      mode,
      netopiaEnv: NETOPIA_ENV,
      netopiaEnvRaw: NETOPIA_ENV_RAW,
      endpoint,
      publicSiteUrl: PUBLIC_SITE_URL,
      ipnNotifyUrl: `${SUPABASE_URL}/functions/v1/netopia-ipn`,
      apiKeyLength: NETOPIA_API_KEY.length,
      apiKeyPreview: NETOPIA_API_KEY ? `${NETOPIA_API_KEY.slice(0, 6)}...${NETOPIA_API_KEY.slice(-4)}` : "MISSING",
      apiKeyLooksLikeCertificate,
      apiKeyLooksLikeJwt,
      posSignatureLength: NETOPIA_POS_SIGNATURE.length,
      posSignaturePreview: NETOPIA_POS_SIGNATURE ? `${NETOPIA_POS_SIGNATURE.slice(0, 8)}...` : "MISSING",
      publicKeyLength: NETOPIA_PUBLIC_KEY.length,
      publicKeyLooksValid,
      warnings,
    };

    if (mode === "secrets") {
      return json(200, result);
    }

    // --- Probe mode: actually call Netopia ---
    if (!NETOPIA_API_KEY || !NETOPIA_POS_SIGNATURE) {
      result.probe = { skipped: true, reason: "Lipsesc secretele esențiale, nu pot face probe." };
      return json(200, result);
    }

    const probePayload = {
      config: {
        emailTemplate: "",
        notifyUrl: `${SUPABASE_URL}/functions/v1/netopia-ipn`,
        redirectUrl: `${PUBLIC_SITE_URL}/admin/payments?probe=success`,
        cancelUrl: `${PUBLIC_SITE_URL}/admin/payments?probe=cancel`,
        language: "ro",
      },
      payment: {
        options: { installments: 0, bonus: 0 },
        instrument: { type: "card", account: "", expMonth: 0, expYear: 0, secretCode: "", token: "" },
        data: {
          BROWSER_USER_AGENT: "netopia-diagnostic/1.0",
          OS: "",
          BROWSER_COLOR_DEPTH: "24",
          BROWSER_SCREEN_WIDTH: "1920",
          BROWSER_SCREEN_HEIGHT: "1080",
          BROWSER_LANGUAGE: "ro-RO",
          BROWSER_TZ_OFFSET: "-180",
          MOBILE: "false",
          IP_ADDRESS: "127.0.0.1",
        },
      },
      order: {
        ntpID: "",
        posSignature: NETOPIA_POS_SIGNATURE,
        dateTime: new Date().toISOString(),
        description: `Probe diagnostic ${Date.now()}`,
        orderID: `PROBE-${Date.now()}`,
        amount: 1.00,
        currency: "RON",
        billing: {
          email: "probe@mamalucica.ro", phone: "0700000000",
          firstName: "Probe", lastName: "Admin",
          city: "Bucuresti", country: 642, countryName: "Romania",
          state: "Bucuresti", postalCode: "010101", details: "Strada Test 1",
        },
        shipping: {
          email: "probe@mamalucica.ro", phone: "0700000000",
          firstName: "Probe", lastName: "Admin",
          city: "Bucuresti", country: 642, countryName: "Romania",
          state: "Bucuresti", postalCode: "010101", details: "Strada Test 1",
        },
        products: [],
        installments: { selected: 0, available: [0] },
        data: {},
      },
    };

    const callNetopia = (auth: string) =>
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify(probePayload),
      });

    const t0 = Date.now();
    let res = await callNetopia(NETOPIA_API_KEY);
    let usedAuthScheme: "raw" | "bearer" = "raw";
    if (res.status === 401) {
      res = await callNetopia(`Bearer ${NETOPIA_API_KEY}`);
      usedAuthScheme = "bearer";
    }
    const elapsedMs = Date.now() - t0;
    const rawText = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(rawText); } catch { /* keep raw */ }

    let interpretation = "";
    if (res.status === 200 || res.status === 201) {
      interpretation = "✓ Netopia a acceptat cererea. Integrarea e funcțională.";
    } else if (res.status === 401) {
      interpretation = apiKeyLooksLikeCertificate
        ? "✗ 401 Unauthorized — NETOPIA_API_KEY este un certificat, nu un API Key. Generează API Key din panoul Netopia (Profil → Securitate → API Key) și înlocuiește secretul."
        : "✗ 401 Unauthorized — API Key invalid sau nu corespunde POS Signature / mediu (sandbox vs live).";
    } else if (res.status === 403) {
      interpretation = "✗ 403 Forbidden — contul/POS-ul nu are voie să folosească acest endpoint.";
    } else if (res.status >= 500) {
      interpretation = "✗ Netopia are o eroare internă. Reîncearcă mai târziu.";
    } else {
      interpretation = `Status neașteptat ${res.status}. Vezi bodyPreview pentru detalii.`;
    }

    result.probe = {
      httpStatus: res.status,
      elapsedMs,
      usedAuthScheme,
      bodyPreview: typeof parsed === "object" && parsed !== null ? parsed : rawText.slice(0, 1500),
      interpretation,
    };
    result.ok = result.ok && (res.status === 200 || res.status === 201);

    return json(200, result);
  } catch (error) {
    return json(500, {
      ok: false,
      stage: "exception",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5) : undefined,
    });
  }
});
