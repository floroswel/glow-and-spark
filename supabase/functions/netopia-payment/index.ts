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
    const NETOPIA_API_KEY = Deno.env.get("NETOPIA_API_KEY");
    const NETOPIA_MERCHANT_ID = Deno.env.get("NETOPIA_MERCHANT_ID");
    const NETOPIA_PUBLIC_KEY = Deno.env.get("NETOPIA_PUBLIC_KEY");

    if (!NETOPIA_API_KEY || !NETOPIA_MERCHANT_ID) {
      throw new Error("Netopia credentials not configured");
    }

    const { orderId, amount, currency, returnUrl, cancelUrl, customerData } = await req.json();
    console.log(`[netopia-payment] Initiating payment for order ${orderId}, amount: ${amount} ${currency || "RON"}`);

    if (!orderId || !amount) {
      return new Response(JSON.stringify({ error: "Missing orderId or amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Netopia v2 Start Payment API
    const paymentPayload = {
      config: {
        emailTemplate: "",
        notifyUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/netopia-ipn`,
        redirectUrl: returnUrl || "",
        cancelUrl: cancelUrl || "",
        language: "ro",
      },
      payment: {
        options: {
          installments: 0,
          bonus: 0,
        },
        instrument: {
          type: "card",
          account: "",
          expMonth: 0,
          expYear: 0,
          secretCode: "",
          token: "",
        },
        data: {
          BROWSER: req.headers.get("user-agent") || "",
          OS: "",
          IP: "",
          MOBILE: "0",
        },
      },
      order: {
        ntpID: "",
        posSignature: NETOPIA_MERCHANT_ID,
        dateTime: new Date().toISOString(),
        description: `Comandă ${orderId}`,
        orderID: orderId,
        amount: parseFloat(amount),
        currency: currency || "RON",
        billing: {
          email: customerData?.email || "",
          phone: customerData?.phone || "",
          firstName: customerData?.firstName || "",
          lastName: customerData?.lastName || "",
          city: customerData?.city || "",
          country: 642,
          countryName: "Romania",
          state: customerData?.county || "",
          postalCode: customerData?.postalCode || "",
          details: customerData?.address || "",
        },
        shipping: {
          email: customerData?.email || "",
          phone: customerData?.phone || "",
          firstName: customerData?.firstName || "",
          lastName: customerData?.lastName || "",
          city: customerData?.city || "",
          country: 642,
          countryName: "Romania",
          state: customerData?.county || "",
          postalCode: customerData?.postalCode || "",
          details: customerData?.address || "",
        },
        products: [],
      },
    };

    const netopiaRes = await fetch("https://secure.mobilpay.ro/pay/payment/card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: NETOPIA_API_KEY,
      },
      body: JSON.stringify(paymentPayload),
    });

    const netopiaResult = await netopiaRes.json();
    console.log(`[netopia-payment] Netopia response status: ${netopiaRes.status}`);

    if (!netopiaRes.ok || netopiaResult.error) {
      console.error("[netopia-payment] Netopia error:", JSON.stringify(netopiaResult));
      return new Response(
        JSON.stringify({ error: "Payment initiation failed", details: netopiaResult }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ntpID = netopiaResult.payment?.ntpID || netopiaResult.ntpID || "";
    const paymentUrl = netopiaResult.payment?.paymentURL || netopiaResult.paymentURL || "";

    // Save payment reference to order
    if (ntpID) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("orders").update({ payment_reference: ntpID }).eq("id", orderId);
      console.log(`[netopia-payment] Saved ntpID ${ntpID} for order ${orderId}`);
    }

    return new Response(
      JSON.stringify({ paymentUrl, ntpID }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[netopia-payment] Error:", error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
