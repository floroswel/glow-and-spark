import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { verifyCronOrAdmin } from "../_shared/auth-guard.ts";

const encoder = new TextEncoder();

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendWithRetry(
  url: string,
  body: string,
  headers: Record<string, string>,
  maxRetries = 3
): Promise<{ status: number; ok: boolean; body: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body,
      });
      const text = await res.text();
      if (res.ok || attempt === maxRetries - 1) {
        return { status: res.status, ok: res.ok, body: text };
      }
    } catch (err) {
      if (attempt === maxRetries - 1) {
        return { status: 0, ok: false, body: String(err) };
      }
    }
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  return { status: 0, ok: false, body: "max retries" };
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Auth check — cron secret, service role key, or admin JWT
  const authorized = await verifyCronOrAdmin(req);
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const { event_type, payload } = await req.json();
    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: webhooks, error } = await supabase
      .from("external_webhooks")
      .select("*")
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const wh of webhooks ?? []) {
      const body = JSON.stringify({
        event: event_type,
        timestamp: new Date().toISOString(),
        data: payload ?? {},
      });

      const headers: Record<string, string> = { ...(wh.headers || {}) };
      if (wh.secret) {
        headers["x-webhook-signature"] = await hmacSign(wh.secret, body);
      }

      const result = await sendWithRetry(wh.url, body, headers);
      results.push({ id: wh.id, name: wh.name, status: result.status, ok: result.ok });

      await supabase
        .from("external_webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: result.ok ? 0 : (wh.failure_count || 0) + 1,
        })
        .eq("id", wh.id);
    }

    return new Response(JSON.stringify({ ok: true, dispatched: results.length, results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
