import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  position: string | null;
  is_active: boolean;
};

const DISMISS_KEY = "ml_dismissed_banners";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]"); } catch { return []; }
}

export function SiteBanners({ position }: { position: "top" | "hero" | "middle" | "footer" }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
    supabase
      .from("site_banners")
      .select("id,title,subtitle,image_url,link_url,position,is_active")
      .eq("is_active", true)
      .eq("position", position)
      .order("sort_order")
      .then(({ data }) => setBanners((data ?? []) as Banner[]));
  }, [position]);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)); } catch {}
  };

  const visible = banners.filter(b => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map(b => {
        const Wrapper: any = b.link_url ? "a" : "div";
        const props = b.link_url ? { href: b.link_url } : {};
        return (
          <div key={b.id} className="relative w-full bg-accent/10 border-b border-accent/20">
            <Wrapper {...props} className="block max-w-7xl mx-auto px-4 py-2 text-sm text-center">
              {b.title && <span className="font-semibold text-foreground">{b.title}</span>}
              {b.subtitle && <span className="ml-2 text-muted-foreground">{b.subtitle}</span>}
            </Wrapper>
            <button onClick={() => dismiss(b.id)} aria-label="Închide" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </>
  );
}
