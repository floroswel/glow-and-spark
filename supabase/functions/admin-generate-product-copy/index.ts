/**
 * Edge Function: admin-generate-product-copy
 *
 * IMPORTANT — Textele generate sunt draft. Revizuire umană obligatorie înainte de publish.
 * Conformitatea cu legislația ANPC/reclamații rămâne responsabilitatea operatorului.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth: verify JWT & admin role ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Autentificare necesară" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user JWT to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Token invalid" }, 401);

    // Check admin role via service client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Acces interzis — doar admin" }, 403);

    // --- Rate limit: 30 req/hour per admin ---
    const { data: rlData } = await adminClient.rpc("check_rate_limit", {
      p_key: `ai_copy_${user.id}`,
      p_limit: 30,
      p_window_seconds: 3600,
    });
    if (rlData && rlData.length > 0 && !rlData[0].allowed) {
      return json({
        error: `Limită depășită (${rlData[0].current_count}/30 cereri/oră). Reîncearcă după ${new Date(rlData[0].reset_at).toLocaleTimeString("ro-RO")}.`,
      }, 429);
    }

    // --- Parse input ---
    const { productId, mode } = await req.json();
    // mode: "descriptions" | "seo" | "all" (default "all")
    const generateMode = mode || "all";

    let productData: Record<string, any>;

    if (productId) {
      const { data: prod, error: prodErr } = await adminClient
        .from("products")
        .select("name, brand, short_description, description, category_id, price, weight, sku")
        .eq("id", productId)
        .single();
      if (prodErr || !prod) return json({ error: "Produs negăsit" }, 404);

      // Get category name
      let categoryName = "";
      if (prod.category_id) {
        const { data: cat } = await adminClient
          .from("categories")
          .select("name")
          .eq("id", prod.category_id)
          .single();
        categoryName = cat?.name || "";
      }
      productData = { ...prod, category: categoryName };
    } else {
      return json({ error: "productId este obligatoriu" }, 400);
    }

    // --- Build prompt ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Cheia AI nu este configurată" }, 500);

    /**
     * IMPORTANT — System prompt constraints (compliance):
     * - Limba română, ton premium și clar
     * - FĂRĂ afirmații medicale sau terapeutice (vindecă, tratează)
     * - FĂRĂ inventat ingrediente sau certificări
     * - meta_title max 60 caractere, meta_description max 155
     * - Descriere scurtă: 1–2 propoziții
     * - Descriere lungă: structurată cu subtitluri scurte opționale
     * - Textele sunt DRAFT — revizuire umană obligatorie
     */
    const systemPrompt = `Ești copywriter expert e-commerce pentru magazinul "Mama Lucica". Scrii DOAR în limba română.

REGULI STRICTE:
- Ton premium, clar, profesional.
- NU inventezi ingrediente, certificări, premii, statistici, procente.
- NU faci afirmații medicale (ex: „vindecă", „tratează", „previne boli", „efect terapeutic").
- NU folosești superlative nefondate (cel mai bun, nr. 1) sau comparații cu mărci reale.
- Folosești DOAR informațiile furnizate despre produs.
- meta_title: max 60 caractere, include numele produsului.
- meta_description: max 155 caractere, include un CTA subtil.
- short_description: 1–2 propoziții concise, max 160 caractere.
- description (long): 100–250 cuvinte, HTML cu <p> și opțional <h3> subtitluri scurte, <ul><li> pentru caracteristici. Fără clase CSS.
- Textele generate sunt DRAFT — necesită revizuire umană înainte de publicare.`;

    let userPrompt: string;
    const pInfo = `Produs: ${productData.name}
${productData.brand ? `Brand: ${productData.brand}` : ""}
${productData.category ? `Categorie: ${productData.category}` : ""}
${productData.price ? `Preț: ${productData.price} RON` : ""}
${productData.weight ? `Greutate: ${productData.weight}` : ""}
${productData.sku ? `SKU: ${productData.sku}` : ""}`;

    const fieldsToGenerate: Record<string, any> = {};

    if (generateMode === "descriptions" || generateMode === "all") {
      fieldsToGenerate.short_description = {
        type: "string",
        description: "Descriere scurtă 1-2 propoziții, max 160 caractere, fără HTML",
      };
      fieldsToGenerate.long_description = {
        type: "string",
        description: "Descriere completă HTML cu <p>, opțional <h3> subtitluri, <ul><li> bullets. 100-250 cuvinte.",
      };
    }
    if (generateMode === "seo" || generateMode === "all") {
      fieldsToGenerate.meta_title = {
        type: "string",
        description: "Titlu SEO, max 60 caractere, include numele produsului",
      };
      fieldsToGenerate.meta_description = {
        type: "string",
        description: "Descriere SEO, max 155 caractere, include un CTA subtil",
      };
    }

    if (generateMode === "descriptions") {
      userPrompt = `Generează descrierea scurtă și descrierea lungă pentru acest produs:\n\n${pInfo}`;
    } else if (generateMode === "seo") {
      userPrompt = `Generează meta_title și meta_description SEO pentru acest produs:\n\n${pInfo}`;
    } else {
      userPrompt = `Generează toate textele de prezentare pentru acest produs:\n\n${pInfo}`;
    }

    // --- Call Lovable AI Gateway ---
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_product_copy",
              description: "Returnează textele generate pentru produs",
              parameters: {
                type: "object",
                properties: fieldsToGenerate,
                required: Object.keys(fieldsToGenerate),
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_product_copy" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "Limita AI depășită. Reîncearcă mai târziu." }, 429);
      if (response.status === 402) return json({ error: "Credit AI insuficient." }, 402);
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return json({ error: "Eroare la generarea textelor" }, 500);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No structured response:", JSON.stringify(data).slice(0, 500));
      return json({ error: "Răspuns invalid de la AI" }, 500);
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Map long_description → description for frontend consistency
    const output: Record<string, string> = {};
    if (result.short_description) output.short_description = result.short_description;
    if (result.long_description) output.description = result.long_description;
    if (result.meta_title) output.meta_title = result.meta_title;
    if (result.meta_description) output.meta_description = result.meta_description;

    return json({ ...output, _draft: true, _notice: "Text generat automat — necesită revizuire umană înainte de publicare." });
  } catch (e) {
    console.error("admin-generate-product-copy error:", e);
    return json({ error: e instanceof Error ? e.message : "Eroare necunoscută" }, 500);
  }
});
