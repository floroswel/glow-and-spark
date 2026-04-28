import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Fetch general settings (default threshold + admin email)
    const { data: generalRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "general")
      .single();
    const general = (generalRow?.value as Record<string, any>) || {};
    const defaultThreshold = Number(general.stock_alert_threshold ?? general.low_stock_threshold ?? 5) || 5;
    const adminEmail: string = general.contact_email || "";

    // 2) Fetch per-product thresholds
    const { data: alertsRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "stock_alerts")
      .maybeSingle();
    const customAlerts: Array<{ product_id: string; threshold: number }> = Array.isArray(alertsRow?.value)
      ? (alertsRow!.value as any)
      : [];
    const customMap = new Map(customAlerts.map((a) => [a.product_id, Number(a.threshold) || defaultThreshold]));

    // 3) Query active products and filter by their applicable threshold
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, sku, stock")
      .eq("is_active", true);
    if (prodErr) throw prodErr;

    const lowStock = (products || [])
      .map((p) => {
        const threshold = customMap.get(p.id) ?? defaultThreshold;
        return { ...p, threshold };
      })
      .filter((p) => (p.stock ?? 0) <= p.threshold);

    if (lowStock.length === 0) {
      return new Response(JSON.stringify({ ok: true, checked: products?.length || 0, alerted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Filter out products alerted in the last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from("stock_alert_log")
      .select("product_id")
      .gte("alerted_at", since);
    const recentSet = new Set((recentLogs || []).map((r) => r.product_id));
    const toAlert = lowStock.filter((p) => !recentSet.has(p.id));

    if (toAlert.length === 0) {
      return new Response(JSON.stringify({ ok: true, lowStock: lowStock.length, alerted: 0, skipped: "recent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5) Send email + 6) log
    let sent = 0;
    if (adminEmail) {
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "low_stock_alert",
            to: adminEmail,
            data: {
              products: toAlert.map((p) => ({
                name: p.name,
                sku: p.sku,
                stock: p.stock ?? 0,
                threshold: p.threshold,
              })),
            },
          },
        });
        sent = 1;
      } catch (e) {
        console.error("[stock-alerts] send-email failed:", e instanceof Error ? e.message : String(e));
      }
    } else {
      console.warn("[stock-alerts] No admin email configured; skipping send.");
    }

    const logRows = toAlert.map((p) => ({
      product_id: p.id,
      stock_at_alert: p.stock ?? 0,
      threshold: p.threshold,
    }));
    const { error: logErr } = await supabase.from("stock_alert_log").insert(logRows);
    if (logErr) console.error("[stock-alerts] log insert failed:", logErr.message);

    return new Response(
      JSON.stringify({ ok: true, lowStock: lowStock.length, alerted: toAlert.length, emailSent: sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stock-alerts] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
