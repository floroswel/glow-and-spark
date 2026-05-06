// Chatbot widget — buton plutitor + panel + mesaje persistate prin chatbot-ai edge function
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SESSION_KEY = "ml_chat_session";

export function ChatWidget() {
  const { general } = useSiteSettings();
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("chatbot_settings_public")
      .select("is_enabled")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEnabled(!!data.is_enabled);
      });
  }, []);

  useEffect(() => {
    if (!open || sessionId) return;
    let id = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
      supabase.from("chatbot_sessions").insert({
        id,
        started_at: new Date().toISOString(),
      } as any).then(() => {});
    }
    setSessionId(id);
    setMessages([{ role: "assistant", content: "Bună! Cu ce te pot ajuta? 👋" }]);
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !sessionId) return;
    setInput("");
    const newMsgs = [...messages, { role: "user" as const, content: text }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      await supabase.from("chatbot_messages").insert({
        session_id: sessionId,
        role: "user",
        content: text,
      } as any);

      const { data, error } = await supabase.functions.invoke("chatbot-ai", {
        body: { sessionId, message: text, history: newMsgs.slice(-10) },
      });

      if (error) throw error;
      const reply = data?.reply || "Îmi pare rău, momentan nu pot răspunde.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      await supabase.from("chatbot_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: reply,
      } as any);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "A apărut o eroare. Te rog încearcă din nou." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!enabled) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 bg-accent text-accent-foreground rounded-full p-4 shadow-xl hover:scale-105 transition"
          aria-label="Deschide chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-accent/10">
            <div>
              <h3 className="font-heading font-bold text-foreground">Asistent {general?.site_name || ""}</h3>
              <p className="text-xs text-muted-foreground">Răspuns rapid · 24/7</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-accent text-accent-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Scrie un mesaj…"
              className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()} className="bg-accent text-accent-foreground rounded-full p-2 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
