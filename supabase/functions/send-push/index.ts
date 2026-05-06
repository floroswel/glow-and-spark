// Trimite push notification către un user sau toți users (admin only)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "https://esm.sh/web-push@3.6.7";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { verifyAdmin } from "../_shared/auth-guard.ts";

const VAPID_PUBLIC = "BEjnQEeqoxAEGvSgencv17mwt79jwxQdBHwlSXAX2F-Kc30_n62W5VVb3WvxyA5Xq6oBTBQWuOyXRJg3FIYE8Nk";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
if (!VAPID_PRIVATE) {
  console.error("VAPID_PRIVATE_KEY not configured — push will fail");
}

if (VAPID_PRIVATE) {
  webpush.setVapidDetails("mailto:contact@mamalucica.ro", VAPID_PUBLIC, VAPID_PRIVATE);
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  // Auth check — admin only
  const admin = await verifyAdmin(req);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: "VAPID_PRIVATE_KEY not configured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { title, body, url, target } = await req.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let q = sb.from("push_subscriptions").select("*");
  if (target?.user_id) q = q.eq("user_id", target.user_id);

  const { data: subs } = await q;
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...cors, "content-type": "application/json" } });

  let sent = 0; let failed = 0;
  await Promise.all(subs.map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, url })
      );
      sent++;
    } catch (e: any) {
      failed++;
      if (e?.statusCode === 410 || e?.statusCode === 404) {
        await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }));

  return new Response(JSON.stringify({ sent, failed }), { headers: { ...cors, "content-type": "application/json" } });
});
