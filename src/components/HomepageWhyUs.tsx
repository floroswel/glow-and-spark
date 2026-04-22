import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultItems = [
  { icon: "🕯️", title: "100% Handmade", desc: "Fiecare lumânare este turnată manual cu grijă" },
  { icon: "🌿", title: "Ceară Naturală", desc: "Doar ceară de soia, fără parafină" },
  { icon: "🚚", title: "Livrare Rapidă", desc: "Comandă azi, primești în 24-48h" },
  { icon: "🛡️", title: "Garanție Calitate", desc: "Returnare gratuită în 30 de zile" },
];

export function HomepageWhyUs() {
  const { homepage } = useSiteSettings();
  if (homepage?.show_why_us === false) return null;

  const title = homepage?.why_us_title || "De ce să alegi Lumini.ro?";
  const items = homepage?.why_us_items?.length > 0
    ? homepage.why_us_items
    : defaultItems;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10 text-foreground font-heading">{title}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item: any, i: number) => (
          <div key={i} className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{item.icon || "✅"}</span>
            </div>
            <h3 className="font-bold text-sm mb-1 text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
