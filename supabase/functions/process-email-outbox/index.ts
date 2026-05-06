// Procesează coada email_outbox: ia max 20 emailuri pending și le trimite via send-email
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyCronOrAdmin } from "../_shared/auth-guard.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  const authorized = await verifyCronOrAdmin(req);
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // Lock & fetch
  const { data: pending, error } = await sb
    .from("email_outbox")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .lt("attempts", 5)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { "content-type": "application/json" } });
  }

  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    // Mark sending
    await sb.from("email_outbox").update({ status: "sending", attempts: row.attempts + 1 }).eq("id", row.id);

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          to: row.to_email,
          type: row.template,
          data: row.payload,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        await sb.from("email_outbox").update({
          status: row.attempts + 1 >= 5 ? "failed" : "pending",
          last_error: err.slice(0, 500),
          scheduled_for: new Date(Date.now() + 60_000 * (row.attempts + 1)).toISOString(),
        }).eq("id", row.id);
        failed++;
      } else {
        await sb.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
        sent++;
      }
    } catch (e) {
      await sb.from("email_outbox").update({
        status: row.attempts + 1 >= 5 ? "failed" : "pending",
        last_error: String(e).slice(0, 500),
        scheduled_for: new Date(Date.now() + 60_000 * (row.attempts + 1)).toISOString(),
      }).eq("id", row.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ processed: pending.length, sent, failed }), {
    headers: { "content-type": "application/json" },
  });
});
