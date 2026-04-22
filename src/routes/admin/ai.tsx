import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Sparkles, FileText, Languages, Zap, ArrowRight, Loader2, Copy, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ai")({
  component: AdminAI,
});

interface AITool {
  id: string; title: string; description: string; icon: any; category: string;
  hasOptions?: boolean; toneOptions?: string[];
}

const aiTools: AITool[] = [
  { id: "desc", title: "Descriere Produs", description: "Generează descrieri senzoriale, poetice, SEO-optimizate pentru lumânări", icon: FileText, category: "Produse", hasOptions: true, toneOptions: ["romantic", "minimalist", "luxury", "eco-friendly"] },
  { id: "seo_title", title: "Meta Title SEO", description: "Generează titluri SEO sub 60 caractere", icon: Sparkles, category: "SEO" },
  { id: "seo_desc", title: "Meta Description", description: "Generează meta descriptions sub 155 caractere", icon: Sparkles, category: "SEO" },
  { id: "blog", title: "Articol Blog", description: "Generează articole complete pe teme lumânări & lifestyle", icon: FileText, category: "Conținut" },
  { id: "email", title: "Email Marketing", description: "Generează campanii email cu subiect, corp și CTA", icon: Zap, category: "Marketing" },
  { id: "social", title: "Post Social Media", description: "Postări Instagram/Facebook cu hashtag-uri", icon: Sparkles, category: "Marketing" },
  { id: "faq", title: "FAQ Generator", description: "Generează Q&A din specificații produs", icon: FileText, category: "Conținut" },
  { id: "translate", title: "Traducere AI", description: "Traduce descrieri în EN/HU/DE/FR", icon: Languages, category: "Conținut" },
  { id: "tags", title: "Auto-Tag Produs", description: "Extrage automat tag-uri din titlu și descriere", icon: Sparkles, category: "Produse" },
  { id: "score", title: "Scoring Fișă Produs", description: "Evaluare calitate 0-100 cu recomandări", icon: Brain, category: "Produse" },
];

function AdminAI() {
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [tone, setTone] = useState("romantic");
  const [lang, setLang] = useState("en");
  const [copied, setCopied] = useState(false);

  const categories = ["all", ...Array.from(new Set(aiTools.map(t => t.category)))];
  const filtered = activeCategory === "all" ? aiTools : aiTools.filter(t => t.category === activeCategory);

  async function generate() {
    if (!selectedTool || !input.trim()) return;
    setGenerating(true);
    setOutput("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: {
          tool: selectedTool.id,
          input: input.trim(),
          options: {
            tone: selectedTool.hasOptions ? tone : undefined,
            lang: selectedTool.id === "translate" ? lang : undefined,
          },
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setGenerating(false);
        return;
      }

      setOutput(data?.result || "Nu s-a putut genera conținut.");
      toast.success("Conținut generat cu succes!");
    } catch (e: any) {
      toast.error(e.message || "Eroare la generare");
    }
    setGenerating(false);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copiat în clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-accent" /> AI Generator Hub
        </h1>
        <p className="text-sm text-muted-foreground">Generare conținut cu inteligență artificială — optimizat pentru lumânări</p>
      </div>

      {!selectedTool ? (
        <>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === cat ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {cat === "all" ? "Toate" : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(tool => (
              <button key={tool.id} onClick={() => { setSelectedTool(tool); setInput(""); setOutput(""); }}
                className="rounded-xl border border-border bg-card p-5 text-left hover:border-accent/40 hover:shadow-md transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-accent/10 p-2"><tool.icon className="h-5 w-5 text-accent" /></div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{tool.title}</h3>
                    <span className="text-[10px] text-muted-foreground">{tool.category}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition">
                  Folosește <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>

          {/* Quick suggestions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-medium text-sm text-foreground mb-3">💡 Idei populare pentru lumânări</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Lumânare din ceară de soia cu lavandă și eucalipt",
                "Set 3 lumânări parfumate pentru relaxare",
                "Lumânare decorativă în borcan de sticlă cu fitil de lemn",
                "Ghid: Cum alegi lumânarea perfectă",
                "Beneficiile aromaterapiei cu lumânări naturale",
              ].map(idea => (
                <button key={idea} onClick={() => { setSelectedTool(aiTools[0]); setInput(idea); setOutput(""); }}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-accent/50 hover:text-foreground transition">
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-2xl space-y-4">
          <button onClick={() => setSelectedTool(null)} className="text-sm text-accent hover:underline">← Înapoi la instrumente</button>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2"><selectedTool.icon className="h-5 w-5 text-accent" /></div>
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">{selectedTool.title}</h2>
                <p className="text-xs text-muted-foreground">{selectedTool.description}</p>
              </div>
            </div>

            {/* Tone selector for product descriptions */}
            {selectedTool.hasOptions && selectedTool.toneOptions && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ton</label>
                <div className="flex gap-2 mt-1">
                  {selectedTool.toneOptions.map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${tone === t ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language selector for translate */}
            {selectedTool.id === "translate" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Limba țintă</label>
                <div className="flex gap-2 mt-1">
                  {[{ v: "en", l: "🇬🇧 Engleză" }, { v: "hu", l: "🇭🇺 Maghiară" }, { v: "de", l: "🇩🇪 Germană" }, { v: "fr", l: "🇫🇷 Franceză" }].map(o => (
                    <button key={o.v} onClick={() => setLang(o.v)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${lang === o.v ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">Input</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={4}
                placeholder={selectedTool.id === "score" ? "Lipește titlul + descrierea produsului de evaluat..." : selectedTool.id === "tags" ? "Lipește titlul și descrierea produsului..." : "Introdu textul sau subiectul aici..."}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" />
            </div>

            <button onClick={generate} disabled={generating || !input.trim()}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50 transition hover:opacity-90">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generare...</> : <><Sparkles className="h-4 w-4" /> Generează cu AI</>}
            </button>

            {output && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Rezultat</label>
                  <button onClick={handleCopy} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition">
                    {copied ? <Check className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiat!" : "Copiază"}
                  </button>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                  {output}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setOutput(""); generate(); }} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary transition">
                    🔄 Regenerează
                  </button>
                  <button onClick={() => { setOutput(""); setInput(""); }} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary transition">
                    ✨ Generează altul
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
