import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

type Popup = {
  id: string;
  name: string;
  trigger: string | null;
  trigger_value: number | null;
  type: string | null;
  content: any;
  is_active: boolean;
};

const SHOWN_KEY = "ml_shown_popups";

function getShown(): string[] {
  try { return JSON.parse(sessionStorage.getItem(SHOWN_KEY) || "[]"); } catch { return []; }
}

function markShown(id: string) {
  const next = [...getShown(), id];
  try { sessionStorage.setItem(SHOWN_KEY, JSON.stringify(next)); } catch {}
}

export function LivePopups() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [active, setActive] = useState<Popup | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    supabase
      .from("popups")
      .select("id,name,trigger,trigger_value,type,content,is_active")
      .eq("is_active", true)
      .then(({ data }) => setPopups((data ?? []) as Popup[]));
  }, []);

  useEffect(() => {
    if (popups.length === 0) return;
    const shown = getShown();
    const eligible = popups.filter(p => !shown.includes(p.id));
    if (eligible.length === 0) return;

    const trigger = (p: Popup) => {
      if (active) return;
      setActive(p);
      markShown(p.id);
      // Track view
      supabase.rpc as any; // noop typing
      supabase.from("popups").select("views").eq("id", p.id).maybeSingle().then(({ data }) => {
        const views = (data as any)?.views || 0;
        supabase.from("popups").update({ views: views + 1 }).eq("id", p.id);
      });
    };

    eligible.forEach(p => {
      if (p.trigger === "time") {
        const t = window.setTimeout(() => trigger(p), (p.trigger_value || 5) * 1000);
        timersRef.current.push(t);
      } else if (p.trigger === "exit_intent") {
        const onLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) { trigger(p); document.removeEventListener("mouseleave", onLeave); }
        };
        document.addEventListener("mouseleave", onLeave);
      } else if (p.trigger === "scroll") {
        const target = p.trigger_value || 50;
        const onScroll = () => {
          const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (pct >= target) { trigger(p); window.removeEventListener("scroll", onScroll); }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    });

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
  }, [popups, active]);

  if (!active) return null;
  const c = active.content || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in" onClick={() => setActive(null)}>
      <div onClick={e => e.stopPropagation()} className="relative max-w-md w-full rounded-2xl bg-card border border-border p-8 shadow-2xl">
        <button onClick={() => setActive(null)} className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        {c.image && <img src={c.image} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />}
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">{c.title || active.name}</h2>
        {c.body && <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{c.body}</p>}
        {c.discount_code && (
          <div className="rounded-lg border-2 border-dashed border-accent bg-accent/10 p-3 text-center mb-4">
            <p className="text-xs text-muted-foreground">Cod reducere</p>
            <p className="text-xl font-bold tracking-widest text-accent">{c.discount_code}</p>
          </div>
        )}
        {c.cta_url && (
          <a href={c.cta_url} className="block w-full text-center rounded-lg bg-foreground py-3 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
            {c.cta_label || "Vezi oferta"}
          </a>
        )}
      </div>
    </div>
  );
}
