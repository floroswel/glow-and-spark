import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");

    const listId = Number(Deno.env.get("BREVO_LIST_ID") || 1);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscribers, error: dbErr } = await supabase
      .from("newsletter_subscribers")
      .select("email, name, created_at")
      .eq("is_active", true);

    if (dbErr) throw dbErr;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ synced: 0, error: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jsonBody = subscribers.map((s: any) => ({
      email: s.email,
      attributes: { FIRSTNAME: s.name || "", SIGNUP_DATE: s.created_at },
    }));

    const res = await fetch("https://api.brevo.com/v3/contacts/import", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ updateEnabled: true, listIds: [listId], jsonBody }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Brevo API ${res.status}: ${text}`);
    }

    return new Response(JSON.stringify({ synced: subscribers.length, error: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("sync-brevo error:", e);
    return new Response(
      JSON.stringify({ synced: 0, error: e.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
