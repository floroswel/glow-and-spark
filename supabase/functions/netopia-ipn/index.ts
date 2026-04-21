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
    const body = await req.json();
    console.log("[netopia-ipn] Received IPN:", JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ntpID = body.payment?.ntpID || body.ntpID;
    const status = body.payment?.status;
    const orderID = body.order?.orderID;

    if (!ntpID && !orderID) {
      console.error("[netopia-ipn] Missing ntpID and orderID");
      return new Response(JSON.stringify({ errorCode: 0x01 }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the order
    let query = supabase.from("orders").select("*");
    if (orderID) {
      query = query.eq("id", orderID);
    } else {
      query = query.eq("payment_reference", ntpID);
    }
    const { data: order, error: findError } = await query.single();

    if (findError || !order) {
      console.error("[netopia-ipn] Order not found:", findError?.message);
      return new Response(JSON.stringify({ errorCode: 0x02 }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[netopia-ipn] Order found: ${order.order_number}, payment status: ${status}`);

    // Map Netopia status
    // 3 = paid/confirmed, 5 = confirmed, 12 = pending
    const isPaid = status === 3 || status === 5;
    const isCancelled = status === 1;

    if (isPaid) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          payment_reference: ntpID || order.payment_reference,
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("[netopia-ipn] Update error:", updateError.message);
      } else {
        console.log(`[netopia-ipn] Order ${order.order_number} marked as paid`);
      }

      // Send confirmation email
      try {
        const emailRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
          {
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
          }
        );
        console.log(`[netopia-ipn] Email send status: ${emailRes.status}`);
      } catch (emailErr) {
        console.error("[netopia-ipn] Email send error:", emailErr);
      }
    } else if (isCancelled) {
      await supabase
        .from("orders")
        .update({ payment_status: "cancelled" })
        .eq("id", order.id);
      console.log(`[netopia-ipn] Order ${order.order_number} payment cancelled`);
    }

    // Netopia expects errorCode: 0 for success
    return new Response(JSON.stringify({ errorCode: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[netopia-ipn] Error:", error);
    return new Response(JSON.stringify({ errorCode: 0x03, errorMessage: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
