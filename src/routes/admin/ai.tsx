import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Sparkles, FileText, Image, Languages, Zap, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/ai")({
  component: AdminAI,
});

interface AITool {
  id: string; title: string; description: string; icon: any; category: string;
  prompt_template: string;
}

const aiTools: AITool[] = [
  { id: "desc", title: "Descriere Produs", description: "Generează descrieri atractive din titlu + atribute", icon: FileText, category: "Produse", prompt_template: "Generează o descriere SEO-optimizată pentru produsul: {input}" },
  { id: "seo_title", title: "Meta Title SEO", description: "Generează titluri SEO optimizate pentru produse", icon: Sparkles, category: "SEO", prompt_template: "Generează un meta title SEO sub 60 caractere pentru: {input}" },
  { id: "seo_desc", title: "Meta Description", description: "Generează meta descriptions sub 160 caractere", icon: Sparkles, category: "SEO", prompt_template: "Generează o meta description SEO sub 160 caractere pentru: {input}" },
  { id: "blog", title: "Articol Blog", description: "Generează articole pentru blog cu imagini sugerate", icon: FileText, category: "Conținut", prompt_template: "Scrie un articol de blog despre: {input}" },
  { id: "email", title: "Email Marketing", description: "Generează subiecte și conținut email campanii", icon: Zap, category: "Marketing", prompt_template: "Scrie un email de marketing pentru: {input}" },
  { id: "translate", title: "Traducere", description: "Traduce conținut din română în engleză/franceză/germană", icon: Languages, category: "Conținut", prompt_template: "Traduce în {lang}: {input}" },
  { id: "social", title: "Post Social Media", description: "Generează postări pentru Facebook/Instagram", icon: Sparkles, category: "Marketing", prompt_template: "Scrie un post de social media pentru: {input}" },
  { id: "faq", title: "FAQ Generator", description: "Generează întrebări frecvente din informații produs", icon: FileText, category: "Conținut", prompt_template: "Generează 5 întrebări frecvente despre: {input}" },
];

function AdminAI() {
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(aiTools.map(t => t.category)))];
  const filtered = activeCategory === "all" ? aiTools : aiTools.filter(t => t.category === activeCategory);

  async function generate() {
    if (!selectedTool || !input.trim()) return;
    setGenerating(true);
    setOutput("");
    // Simulate AI generation (in production would call edge function with Lovable AI)
    await new Promise(r => setTimeout(r, 2000));
    setOutput(`[AI Generated Content]\n\n${selectedTool.prompt_template.replace("{input}", input)}\n\nAcesta este un exemplu de conținut generat. Conectați la Lovable AI Gateway pentru conținut real.`);
    setGenerating(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-accent" /> AI Generator Hub
        </h1>
        <p className="text-sm text-muted-foreground">Generare conținut cu inteligență artificială</p>
      </div>

      {!selectedTool ? (
        <>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === cat ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {cat === "all" ? "Toate" : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tool => (
              <button key={tool.id} onClick={() => { setSelectedTool(tool); setInput(""); setOutput(""); }}
                className="rounded-xl border bg-card p-5 text-left hover:border-accent/40 hover:shadow-md transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-accent/10 p-2"><tool.icon className="h-5 w-5 text-accent" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">{tool.title}</h3>
                    <span className="text-[10px] text-muted-foreground">{tool.category}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition">
                  Folosește <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-2xl space-y-4">
          <button onClick={() => setSelectedTool(null)} className="text-sm text-accent hover:underline">← Înapoi la instrumente</button>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2"><selectedTool.icon className="h-5 w-5 text-accent" /></div>
              <div>
                <h2 className="font-heading text-lg font-bold">{selectedTool.title}</h2>
                <p className="text-xs text-muted-foreground">{selectedTool.description}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Input</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder="Introdu textul sau subiectul aici..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm mt-1" />
            </div>

            <button onClick={generate} disabled={generating || !input.trim()}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generare...</> : <><Sparkles className="h-4 w-4" /> Generează</>}
            </button>

            {output && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Rezultat</label>
                <div className="mt-1 rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">{output}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(output)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary">Copiază</button>
                  <button onClick={() => { setOutput(""); setInput(""); }} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary">Generează altul</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
