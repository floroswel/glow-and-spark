import { ShieldCheck, RotateCcw, Truck, Award } from "lucide-react";

const badges = [
  { icon: ShieldCheck, title: "Plată securizată SSL", desc: "Protecție 100%" },
  { icon: RotateCcw, title: "Retur 30 de zile", desc: "Fără întrebări" },
  { icon: Truck, title: "Livrare 24-48h", desc: "Prin Fan Courier" },
  { icon: Award, title: "Produs artizanal", desc: "Fabricat în România" },
];

export function TrustBadges({ variant = "full" }: { variant?: "compact" | "full" }) {
  const compact = variant === "compact";
  const iconSize = compact ? 16 : 20;

  // Always 2 columns — 4 columns produced ugly per-letter wrapping in narrow
  // containers (e.g. checkout sidebar). 2 cols stays readable everywhere and
  // the layout is identical across desktop/mobile.
  return (
    <div className="grid grid-cols-2 gap-3">
      {badges.map((b) => (
        <div
          key={b.title}
          className={`flex items-start gap-2.5 rounded-lg border border-border bg-secondary/50 ${compact ? "px-3 py-2" : "px-3 py-3"}`}
        >
          <b.icon className="shrink-0 text-accent mt-0.5" size={iconSize} />
          <div className="min-w-0 flex-1">
            <p className={`font-medium text-foreground leading-tight break-words hyphens-auto ${compact ? "text-xs" : "text-xs sm:text-sm"}`}>
              {b.title}
            </p>
            <p className={`text-muted-foreground leading-tight break-words hyphens-auto ${compact ? "text-[10px]" : "text-[10px] sm:text-xs"}`}>
              {b.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
