import { Link } from "@tanstack/react-router";
import { Truck, RotateCcw, ShieldCheck, CreditCard } from "lucide-react";

const items = [
  {
    icon: Truck,
    title: "Transport & Livrare",
    subtitle: "Rapid in toata Romania",
    to: "/transport-si-livrare",
  },
  {
    icon: RotateCcw,
    title: "Retur in 14 zile",
    subtitle: "Conform OUG 34/2014",
    to: "/politica-returnare",
  },
  {
    icon: ShieldCheck,
    title: "Garantie produse",
    subtitle: "Calitate verificata",
    to: "/termeni-si-conditii",
  },
  {
    icon: CreditCard,
    title: "Plata securizata",
    subtitle: "Card, ramburs, transfer",
    to: "/contact",
  },
];

export function TrustStrip() {
  return (
    <div className="w-full bg-muted/50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-3 py-3 overflow-x-auto scrollbar-hide md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 min-w-[220px] md:min-w-0 px-4 py-2.5 rounded-lg bg-background border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                <item.icon className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight text-foreground truncate">
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                  {item.subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
