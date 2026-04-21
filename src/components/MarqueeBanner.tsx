import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function MarqueeBanner() {
  const { ticker } = useSiteSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Don't render on server or before client hydration to avoid mismatch
  if (!mounted || !ticker?.show) return null;

  const messages = ticker.messages || [];
  const text = messages.join("   \u00A0\u00A0\u00A0   ");
  const speed = ticker.speed || 25;

  return (
    <div
      className="overflow-hidden py-2"
      style={{
        backgroundColor: ticker.background_color || undefined,
        color: ticker.text_color || undefined,
      }}
    >
      <div
        className="whitespace-nowrap text-sm font-medium"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {text}
      </div>
    </div>
  );
}