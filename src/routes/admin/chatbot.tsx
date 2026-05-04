import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Save, Plus, Trash2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/chatbot")({
  component: ChatbotPage,
});

function ChatbotPage() {
  const location = useLocation();
  const [settings, setSettings] = useState<any>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: f }] = await Promise.all([
        supabase.from("chatbot_settings").select("*").limit(1).maybeSingle(),
        supabase.from("chatbot_faq").select("*").order("sort_order"),
      ]);
      setSettings(s ?? { is_enabled: true, bot_name: "Asistent Mama Lucica", welcome_message: "Bună! Cu ce te pot ajuta?", ai_model: "google/gemini-2.5-flash", system_prompt: "", fallback_email: "", config: {} });
      setFaqs(f ?? []);
      setLoading(false);
    })();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const payload = { ...settings };
    delete payload.created_at;
    delete payload.updated_at;
    const { error } = settings.id
      ? await supabase.from("chatbot_settings").update(payload).eq("id", settings.id)
      : await supabase.from("chatbot_settings").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Setări salvate");
  };

  const addFaq = async () => {
    const { data, error } = await supabase.from("chatbot_faq").insert({ question: "Întrebare nouă", answer: "Răspuns", sort_order: faqs.length }).select().single();
    if (error) return toast.error(error.message);
    setFaqs([...faqs, data]);
  };

  const updateFaq = async (id: string, patch: any) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, ...patch } : f));
    await supabase.from("chatbot_faq").update(patch).eq("id", id);
  };

  const deleteFaq = async (id: string) => {
    await supabase.from("chatbot_faq").delete().eq("id", id);
    setFaqs(faqs.filter(f => f.id !== id));
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-7 w-7 text-accent" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Chatbot</h1>
            <p className="text-sm text-muted-foreground">Configurează asistentul AI și răspunsurile predefinite</p>
          </div>
        </div>
        <Link to="/admin/chatbot/sessions" className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm hover:bg-secondary/80">
          <MessagesSquare className="h-4 w-4" /> Sesiuni & conversații
        </Link>
      </div>

      {/* Enable/Disable toggle */}
      <div className={`rounded-xl border p-4 flex items-center justify-between ${settings.is_enabled ? "border-accent/40 bg-accent/5" : "border-destructive/30 bg-destructive/5"}`}>
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${settings.is_enabled ? "bg-green-500" : "bg-red-400"}`} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Asistentul {settings.bot_name || "Mama Lucica"} este {settings.is_enabled ? "activ" : "dezactivat"}
            </p>
            <p className="text-xs text-muted-foreground">
              {settings.is_enabled ? "Vizitatorii pot folosi chatbot-ul pe site." : "Chatbot-ul nu este vizibil pe site."}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            const next = !settings.is_enabled;
            setSettings({ ...settings, is_enabled: next });
            if (settings.id) {
              await supabase.from("chatbot_settings").update({ is_enabled: next }).eq("id", settings.id);
              toast.success(next ? "Asistentul a fost activat" : "Asistentul a fost dezactivat");
            }
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            settings.is_enabled
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-accent text-accent-foreground hover:bg-accent/90"
          }`}
        >
          {settings.is_enabled ? "Dezactivează" : "Activează"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Setări generale</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted-foreground">Nume bot</span>
            <input value={settings.bot_name || ""} onChange={e => setSettings({ ...settings, bot_name: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Email fallback</span>
            <input value={settings.fallback_email || ""} onChange={e => setSettings({ ...settings, fallback_email: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="text-muted-foreground">Mesaj de întâmpinare</span>
            <input value={settings.welcome_message || ""} onChange={e => setSettings({ ...settings, welcome_message: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Model AI</span>
            <select value={settings.ai_model || "google/gemini-2.5-flash"} onChange={e => setSettings({ ...settings, ai_model: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2">
              <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (rapid)</option>
              <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (complex)</option>
              <option value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (ieftin)</option>
              <option value="openai/gpt-5-mini">GPT-5 Mini</option>
            </select>
          </label>
          {/* Toggle moved to prominent card above */}
          <label className="block text-sm md:col-span-2">
            <span className="text-muted-foreground">Prompt sistem (instrucțiuni AI)</span>
            <textarea rows={5} value={settings.system_prompt || ""} onChange={e => setSettings({ ...settings, system_prompt: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
          </label>
        </div>
        <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Se salvează..." : "Salvează setări"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Întrebări frecvente (FAQ)</h2>
          <button onClick={addFaq} className="flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-xs text-accent-foreground">
            <Plus className="h-3.5 w-3.5" /> Adaugă FAQ
          </button>
        </div>
        <div className="space-y-3">
          {faqs.length === 0 && <p className="text-sm text-muted-foreground">Nicio întrebare. Adaugă prima.</p>}
          {faqs.map(f => (
            <div key={f.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex gap-2">
                <input value={f.question} onChange={e => updateFaq(f.id, { question: e.target.value })} placeholder="Întrebare" className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                <input value={f.category || ""} onChange={e => updateFaq(f.id, { category: e.target.value })} placeholder="Categorie" className="w-32 rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={f.is_active} onChange={e => updateFaq(f.id, { is_active: e.target.checked })} />Activ</label>
                <button onClick={() => deleteFaq(f.id)} className="rounded-md bg-destructive/10 p-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea rows={2} value={f.answer} onChange={e => updateFaq(f.id, { answer: e.target.value })} placeholder="Răspuns" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
