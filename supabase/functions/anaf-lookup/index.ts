import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { cui } = await req.json();
    console.log(`[anaf-lookup] Looking up CUI: ${cui}`);

    if (!cui) {
      return new Response(JSON.stringify({ valid: false, error: "CUI is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCui = String(cui).replace(/\D/g, "");
    if (!cleanCui || cleanCui.length < 2 || cleanCui.length > 10) {
      return new Response(JSON.stringify({ valid: false, error: "CUI invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const res = await fetch(
      "https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ cui: parseInt(cleanCui), data: today }]),
      }
    );

    if (!res.ok) {
      console.error(`[anaf-lookup] ANAF API error: ${res.status}`);
      return new Response(JSON.stringify({ valid: false, error: "ANAF API error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await res.json();
    console.log(`[anaf-lookup] ANAF response:`, JSON.stringify(result));

    const found = result?.found?.[0];
    if (!found) {
      return new Response(JSON.stringify({ valid: false, error: "CUI not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adresaParts = (found.date_generale?.adresa || "").split(",").map((s: string) => s.trim());
    const judetMatch = (found.date_generale?.adresa || "").match(/Jud\.\s*([A-ZĂÂÎȘȚ\s]+)/i);

    return new Response(
      JSON.stringify({
        valid: true,
        denumire: found.date_generale?.denumire || "",
        adresa: found.date_generale?.adresa || "",
        cod_postal: found.date_generale?.codPostal || "",
        judet: judetMatch ? judetMatch[1].trim() : "",
        platitor_tva: found.inregistrare_scop_Tva?.scpTVA || false,
        numar_reg: found.date_generale?.nrRegCom || "",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[anaf-lookup] Error:", error);
    return new Response(JSON.stringify({ valid: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
