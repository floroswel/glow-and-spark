import * as Icons from "lucide-react";
import { ShieldCheck, RotateCcw, Truck, Award } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const FALLBACK = [
  { id: "b1", icon: "ShieldCheck", title: "Plată securizată SSL", desc: "Datele tale sunt protejate 100%", color: "#C9A24A", active: true },
  { id: "b2", icon: "RotateCcw", title: "Drept de retragere 14 zile", desc: "Returnare fără justificare", color: "#C9A24A", active: true },
  { id: "b3", icon: "Truck", title: "Livrare rapidă 24-48h", desc: "Prin curier, în toată România", color: "#C9A24A", active: true },
  { id: "b4", icon: "Award", title: "100% Handmade", desc: "Fabricat artizanal în România", color: "#C9A24A", active: true },
];

const ICON_MAP: Record<string, any> = { ShieldCheck, RotateCcw, Truck, Award };

function resolveIcon(name: string) {
  if (ICON_MAP[name]) return ICON_MAP[name];
  const dyn = (Icons as any)[name];
  return dyn || ShieldCheck;
}

export function TrustBadges({ variant = "full" }: { variant?: "compact" | "full" }) {
  const { trust_badges } = useSiteSettings();
  const compact = variant === "compact";
  const iconSize = compact ? 16 : 20;

  if (trust_badges?.enabled === false) return null;

  const list = (Array.isArray(trust_badges?.badges) && trust_badges.badges.length
    ? trust_badges.badges
    : FALLBACK
  ).filter((b: any) => b.active !== false);

  if (!list.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {list.map((b: any) => {
        const Icon = resolveIcon(b.icon);
        return (
          <div
            key={b.id || b.title}
            className={`flex items-start gap-2.5 rounded-lg border border-border bg-secondary/50 ${compact ? "px-3 py-2" : "px-3 py-3"}`}
          >
            <Icon
              className="shrink-0 mt-0.5"
              size={iconSize}
              style={{ color: b.color || undefined }}
            />
            <div className="min-w-0 flex-1">
              <p className={`font-medium text-foreground leading-tight break-words hyphens-auto ${compact ? "text-xs" : "text-xs sm:text-sm"}`}>
                {b.title}
              </p>
              <p className={`text-muted-foreground leading-tight break-words hyphens-auto ${compact ? "text-[10px]" : "text-[10px] sm:text-xs"}`}>
                {b.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
