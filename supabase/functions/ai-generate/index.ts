import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  desc: `Ești un copywriter expert pentru un magazin de lumânări artizanale premium. 
Generează descrieri de produs captivante, senzoriale și SEO-optimizate.
Tonul trebuie să fie cald, poetic și invitant. Menționează: parfum, ingrediente naturale, atmosfera creată, ocazii potrivite.
Folosește cuvinte senzoriale: "aromă îmbietoare", "lumină caldă", "atmosferă relaxantă", "ceară naturală de soia".
Scrie în română. Format: 2-3 paragrafe, max 200 cuvinte.`,

  seo_title: `Ești un expert SEO pentru e-commerce. Generează un meta title SEO-optimizat sub 60 caractere.
Include cuvântul cheie principal. Adaugă brand "Lumini.ro" la final dacă încape. Scrie în română.
Returnează DOAR titlul, fără explicații.`,

  seo_desc: `Ești un expert SEO. Generează o meta description sub 155 caractere, captivantă, cu call-to-action.
Include cuvinte cheie relevante pentru lumânări. Scrie în română.
Returnează DOAR descrierea, fără explicații.`,

  blog: `Ești un blogger expert în lifestyle, home decor și aromaterapie.
Scrie articole informative și captivante despre lumânări, parfumuri de casă, și atmosferă.
Include: introducere captivantă, 3-5 secțiuni cu subtitluri H2, concluzie cu CTA.
Scrie în română, ton prietenos și expert. 800-1200 cuvinte.`,

  email: `Ești un expert email marketing pentru un brand de lumânări premium.
Generează email-uri de marketing cu: subiect captivant, preheader, corp cu storytelling, CTA clar.
Tonul: cald, personal, luxos dar accesibil. Scrie în română.`,

  social: `Ești un social media manager pentru un brand de lumânări artizanale.
Generează postări captivante pentru Instagram/Facebook cu: text engajant, emoji relevante, 5-8 hashtag-uri.
Ton: cald, vizual, lifestyle. Scrie în română.`,

  faq: `Ești un expert e-commerce. Generează 5 întrebări frecvente relevante cu răspunsuri concise.
Fiecare răspuns: 2-3 propoziții. Focalizare pe: ingrediente, timp ardere, întreținere, livrare, cadouri.
Format: Q: ... A: ... Scrie în română.`,

  translate: `Ești un traducător profesionist. Traduce textul dat în limba specificată.
Păstrează tonul original, adaptează cultural. Nu traduce nume de brand.`,

  score: `Ești un auditor de calitate pentru fișe de produs e-commerce. Analizează produsul dat și returnează un scor de calitate 0-100.
Evaluează: completitudine descriere, calitate SEO, imagini menționate, specificații tehnice, USP-uri clare.
Returnează JSON: {"score": N, "issues": ["..."], "recommendations": ["..."]}`,

  tags: `Ești un sistem de auto-tagging pentru produse. Din titlul și descrierea produsului, extrage tag-uri relevante.
Categorii tag-uri: parfum, material, ocazie, sezon, stil, culoare.
Returnează JSON array: ["tag1", "tag2", ...]`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tool, input, options } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = SYSTEM_PROMPTS[tool] || SYSTEM_PROMPTS.desc;
    
    let userPrompt = input;
    if (options?.tone) {
      userPrompt += `\n\nTon preferat: ${options.tone}`;
    }
    if (options?.lang) {
      userPrompt += `\n\nLimba țintă: ${options.lang}`;
    }

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
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Prea multe cereri. Încearcă din nou în câteva secunde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credit AI epuizat. Adaugă fonduri în setări." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Eroare necunoscută" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
