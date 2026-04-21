import { useSiteSettings } from "@/hooks/useSiteSettings";

export function MarqueeBanner() {
  const { ticker } = useSiteSettings();
  if (!ticker?.show) return null;

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
