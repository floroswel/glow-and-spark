// Netopia Payments v2 — IPN (Instant Payment Notification)
// Verifies the JWT-signed Verification-Token header using Netopia's RSA public key,
// then updates the order. CRITICAL: never trust the body without signature verification.
//
// Required env vars:
//   NETOPIA_PUBLIC_KEY    — RSA public key in PEM format (used to verify IPN JWT)
//   NETOPIA_ENV           — "sandbox" | "live"
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, Verification-Token, verification-token",
};

// ---- JWT (RS256/RS512) verification using Netopia public key ----------------

function base64UrlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemToBytes(pem: string): Uint8Array {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(cleaned);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Minimal DER walker: extract the SubjectPublicKeyInfo (SPKI) bytes from an X.509 certificate.
// X.509 Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
// tbsCertificate ::= SEQUENCE { version[0]?, serial, sigAlg, issuer, validity, subject, SPKI, ... }
function extractSpkiFromCertificate(certDer: Uint8Array): Uint8Array {
  let i = 0;
  function readLen(): number {
    let len = certDer[i++];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let k = 0; k < n; k++) len = (len << 8) | certDer[i++];
    }
    return len;
  }
  function expectSeq() {
    if (certDer[i++] !== 0x30) throw new Error("Expected SEQUENCE");
    return readLen();
  }
  function skipElement() {
    i++; // tag
    const len = readLen();
    i += len;
  }
  expectSeq();          // outer Certificate SEQUENCE
  expectSeq();          // tbsCertificate SEQUENCE
  // optional [0] version
  if (certDer[i] === 0xa0) skipElement();
  skipElement();        // serialNumber INTEGER
  skipElement();        // signature AlgorithmIdentifier
  skipElement();        // issuer Name
  skipElement();        // validity SEQUENCE
  skipElement();        // subject Name
  // Now at SubjectPublicKeyInfo SEQUENCE
  const spkiStart = i;
  if (certDer[i++] !== 0x30) throw new Error("Expected SPKI SEQUENCE");
  const spkiLen = readLen();
  const spkiEnd = i + spkiLen;
  return certDer.slice(spkiStart, spkiEnd);
}

async function importRsaPublicKey(pem: string, hash: "SHA-256" | "SHA-512"): Promise<CryptoKey> {
  const der = pemToBytes(pem);
  // If PEM is a CERTIFICATE, extract the SPKI; if it's already a PUBLIC KEY, use as-is.
  const isCert = /-----BEGIN CERTIFICATE-----/.test(pem);
  const spkiBytes = isCert ? extractSpkiFromCertificate(der) : der;
  return await crypto.subtle.importKey(
    "spki",
    spkiBytes.buffer.slice(spkiBytes.byteOffset, spkiBytes.byteOffset + spkiBytes.byteLength),
    { name: "RSASSA-PKCS1-v1_5", hash },
    false,
    ["verify"]
  );
}

interface VerifiedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

async function verifyJwt(token: string, publicKeyPem: string): Promise<VerifiedJwt | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(headerB64)));
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payloadB64)));

    const alg = (header.alg || "").toUpperCase();
    let hash: "SHA-256" | "SHA-512";
    if (alg === "RS256") hash = "SHA-256";
    else if (alg === "RS512") hash = "SHA-512";
    else {
      console.error("[netopia-ipn] Unsupported JWT alg:", alg);
      return null;
    }

    const key = await importRsaPublicKey(publicKeyPem, hash);
    const signature = base64UrlToUint8Array(sigB64);
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const ok = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      signature,
      signedData
    );
    if (!ok) return null;
    return { header, payload };
  } catch (e) {
    console.error("[netopia-ipn] JWT verify exception:", e);
    return null;
  }
}

// ---- Netopia status mapping (v2) -------------------------------------------
// Source: Netopia v2 status codes
//  3, 5  = paid / confirmed
//  1     = cancelled
//  12    = invalid (declined)
//  13    = unauthenticated
//  15    = 3DS required
//  17    = card with risk (fraud)
//  19    = expired
function mapStatus(code: number): "paid" | "cancelled" | "pending" | "failed" {
  if (code === 3 || code === 5) return "paid";
  if (code === 1) return "cancelled";
  if (code === 15 || code === 0) return "pending";
  return "failed";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ errorCode: 0x10, errorMessage: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const NETOPIA_PUBLIC_KEY = Deno.env.get("NETOPIA_PUBLIC_KEY");
  if (!NETOPIA_PUBLIC_KEY) {
    console.error("[netopia-ipn] Missing NETOPIA_PUBLIC_KEY");
    return new Response(JSON.stringify({ errorCode: 0x99, errorMessage: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Read raw body once for both verification and parsing
  const rawBody = await req.text();

  // ---- Signature verification (Verification-Token JWT) ---------------------
  const verificationToken =
    req.headers.get("Verification-Token") || req.headers.get("verification-token");

  if (!verificationToken) {
    console.error("[netopia-ipn] Missing Verification-Token header");
    return new Response(JSON.stringify({ errorCode: 0x11, errorMessage: "Missing signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const verified = await verifyJwt(verificationToken, NETOPIA_PUBLIC_KEY);
  if (!verified) {
    console.error("[netopia-ipn] Invalid JWT signature");
    return new Response(JSON.stringify({ errorCode: 0x12, errorMessage: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Optional: validate iat/exp to reject replay > 5 minutes old
  const now = Math.floor(Date.now() / 1000);
  const iat = Number(verified.payload.iat || 0);
  if (iat && Math.abs(now - iat) > 300) {
    console.error("[netopia-ipn] JWT too old or in the future. iat:", iat, "now:", now);
    return new Response(JSON.stringify({ errorCode: 0x13, errorMessage: "Stale token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ errorCode: 0x14, errorMessage: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("[netopia-ipn] Verified IPN:", JSON.stringify(body).slice(0, 500));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ntpID: string | undefined = body.payment?.ntpID || body.ntpID;
  const status: number = Number(body.payment?.status ?? body.status ?? -1);
  const orderID: string | undefined = body.order?.orderID || body.orderID;
  const reportedAmount: number = Number(body.payment?.amount ?? body.order?.amount ?? 0);
  const reportedCurrency: string = body.payment?.currency ?? body.order?.currency ?? "RON";

  if (!ntpID && !orderID) {
    return new Response(JSON.stringify({ errorCode: 0x01, errorMessage: "Missing identifiers" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find order by orderID (preferred) or by ntpID (payment_reference)
  let query = supabase.from("orders").select("*");
  if (orderID) query = query.eq("id", orderID);
  else query = query.eq("payment_reference", ntpID!);
  const { data: order, error: findError } = await query.single();

  if (findError || !order) {
    console.error("[netopia-ipn] Order not found:", findError?.message);
    return new Response(JSON.stringify({ errorCode: 0x02, errorMessage: "Order not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const mapped = mapStatus(status);
  console.log(`[netopia-ipn] order=${order.order_number} status=${status} mapped=${mapped} amount=${reportedAmount}`);

  // Idempotency: if already paid, just acknowledge
  if (order.payment_status === "paid" && mapped === "paid") {
    return new Response(JSON.stringify({ errorCode: 0, errorMessage: "Already processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // CRITICAL: amount validation — reject if reported amount differs from order total
  if (mapped === "paid") {
    const expected = Number(order.total);
    const tolerance = 0.01;
    if (Math.abs(expected - reportedAmount) > tolerance) {
      console.error(`[netopia-ipn] AMOUNT MISMATCH order=${order.order_number} expected=${expected} reported=${reportedAmount}`);
      // Mark as suspicious but DO NOT confirm
      await supabase
        .from("orders")
        .update({ payment_status: "review", admin_notes: `Netopia amount mismatch: expected ${expected} ${order.currency || "RON"}, got ${reportedAmount} ${reportedCurrency}` })
        .eq("id", order.id);
      return new Response(JSON.stringify({ errorCode: 0x20, errorMessage: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (mapped === "paid") {
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        payment_reference: ntpID || order.payment_reference,
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) console.error("[netopia-ipn] Update error:", updateError.message);

    // Send confirmation email (best-effort)
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          type: "order_confirmation",
          to: order.customer_email,
          data: {
            orderNumber: order.order_number,
            items: order.items,
            total: order.total,
            shipping_cost: order.shipping_cost,
            discount_amount: order.discount_amount,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            shipping_address: order.shipping_address,
            city: order.city,
            county: order.county,
            postal_code: order.postal_code,
          },
        }),
      });
    } catch (emailErr) {
      console.error("[netopia-ipn] Email send error:", emailErr);
    }
  } else if (mapped === "cancelled") {
    await supabase.from("orders").update({ payment_status: "cancelled" }).eq("id", order.id);
  } else if (mapped === "failed") {
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
  } // "pending" → no change, await next IPN

  // Netopia expects errorCode: 0 for ack
  return new Response(JSON.stringify({ errorCode: 0, errorMessage: "OK" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
