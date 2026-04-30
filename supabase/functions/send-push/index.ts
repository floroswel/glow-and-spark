// Trimite push notification către un user sau toți users (admin)
// Folosește VAPID keys hardcodate (publice ok, private în env)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC = "BEjnQEeqoxAEGvSgencv17mwt79jwxQdBHwlSXAX2F-Kc30_n62W5VVb3WvxyA5Xq6oBTBQWuOyXRJg3FIYE8Nk";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "oV9QPwxXVgJ9bwRk49gJXFhizRoD7Sopr2ANt2U2-yc";

webpush.setVapidDetails("mailto:contact@mamalucica.ro", VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  const { title, body, url, target } = await req.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let q = sb.from("push_subscriptions").select("*");
  if (target?.user_id) q = q.eq("user_id", target.user_id);

  const { data: subs } = await q;
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { "content-type": "application/json" } });

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
      // 410 Gone → cleanup
      if (e?.statusCode === 410 || e?.statusCode === 404) {
        await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }));

  return new Response(JSON.stringify({ sent, failed }), { headers: { "content-type": "application/json" } });
});
