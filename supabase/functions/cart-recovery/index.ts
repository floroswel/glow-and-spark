import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find abandoned carts older than 1 hour with email, not yet sent
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: carts, error: fetchErr } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("recovery_email_sent", false)
      .eq("recovered", false)
      .not("email", "is", null)
      .lt("last_activity_at", oneHourAgo)
      .limit(50);

    if (fetchErr) {
      console.error("[cart-recovery] Fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!carts || carts.length === 0) {
      console.log("[cart-recovery] No abandoned carts to recover.");
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[cart-recovery] Found ${carts.length} abandoned carts to process.`);
    let sent = 0;

    for (const cart of carts) {
      try {
        // Call send-email function
        const { error: invokeErr } = await supabase.functions.invoke("send-email", {
          body: {
            type: "cart_recovery",
            to: cart.email,
            data: {
              items: cart.items || [],
              total: cart.total || cart.subtotal || 0,
              customer_name: cart.customer_name || "",
            },
          },
        });

        if (invokeErr) {
          console.error(`[cart-recovery] Failed to send to ${cart.email}:`, invokeErr);
          continue;
        }

        // Mark as sent
        await supabase
          .from("abandoned_carts")
          .update({ recovery_email_sent: true })
          .eq("id", cart.id);

        sent++;
        console.log(`[cart-recovery] Sent recovery email to ${cart.email}`);
      } catch (err) {
        console.error(`[cart-recovery] Error processing cart ${cart.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ processed: carts.length, sent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[cart-recovery] Error:", error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
