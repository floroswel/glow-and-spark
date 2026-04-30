import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/admin/chatbot/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("chatbot_sessions").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setSessions(data ?? []));
  }, []);

  useEffect(() => {
    if (!selected) return;
    supabase.from("chatbot_messages").select("*").eq("session_id", selected.id).order("created_at")
      .then(({ data }) => setMessages(data ?? []));
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessagesSquare className="h-7 w-7 text-accent" />
        <div>
          <h1 className="font-heading text-2xl font-bold">Sesiuni Chatbot</h1>
          <p className="text-sm text-muted-foreground">{sessions.length} conversații</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 max-h-[70vh] overflow-y-auto space-y-1">
          {sessions.map(s => (
            <button key={s.id} onClick={() => setSelected(s)} className={`w-full text-left rounded-md p-2 text-xs hover:bg-secondary ${selected?.id === s.id ? "bg-secondary" : ""}`}>
              <div className="font-medium">{s.visitor_name || s.visitor_email || "Anonim"}</div>
              <div className="text-muted-foreground">{new Date(s.created_at).toLocaleString("ro-RO")}</div>
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{s.status}</span>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-4 max-h-[70vh] overflow-y-auto">
          {!selected ? (
            <p className="text-sm text-muted-foreground text-center py-12">Selectează o sesiune</p>
          ) : (
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`rounded-lg p-3 text-sm ${m.role === "user" ? "bg-secondary" : m.role === "assistant" ? "bg-accent/10" : "bg-muted/30 text-xs"}`}>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">{m.role}</div>
                  {m.content}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
