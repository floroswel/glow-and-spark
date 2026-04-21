import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const checks: Record<string, string> = {};
  let overallStatus = "healthy";

  // DB check
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await supabase.from("site_settings").select("id").limit(1);
    checks.db = error ? "unhealthy" : "healthy";
    if (error) {
      overallStatus = "degraded";
      console.error("[health-check] DB error:", error.message);
    }
  } catch (e) {
    checks.db = "unhealthy";
    overallStatus = "degraded";
    console.error("[health-check] DB check failed:", e);
  }

  // Env vars check
  checks.env_supabase_url = Deno.env.get("SUPABASE_URL") ? "set" : "missing";
  checks.env_service_role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "set" : "missing";

  return new Response(
    JSON.stringify({
      status: overallStatus,
      db: checks.db,
      env: {
        supabase_url: checks.env_supabase_url,
        service_role: checks.env_service_role,
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: overallStatus === "healthy" ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
