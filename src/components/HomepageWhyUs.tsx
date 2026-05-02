import { useSiteSettings } from "@/hooks/useSiteSettings";
import { WITHDRAWAL_PERIOD_DAYS } from "@/lib/compliance";

const defaultItems = [
  { icon: "🕯️", title: "100% Handmade", desc: "Fiecare lumânare este turnată manual cu grijă" },
  { icon: "🌿", title: "Ceară Naturală", desc: "Doar ceară de soia, fără parafină" },
  { icon: "🚚", title: "Livrare Rapidă", desc: "Comandă azi, primești în 24-48h" },
  { icon: "🛡️", title: "Drept de Retragere", desc: `Returnare fără justificare în ${WITHDRAWAL_PERIOD_DAYS} zile calendaristice` },
];

export function HomepageWhyUs() {
  const { homepage } = useSiteSettings();
  if (homepage?.show_why_us === false) return null;

  const title = homepage?.why_us_title || "De ce să alegi Mama Lucica?";

  // Read individual fields from admin settings, fallback to defaults
  const items = [1, 2, 3, 4].map((i) => ({
    icon: homepage?.[`why_us_${i}_icon`] || defaultItems[i - 1].icon,
    title: homepage?.[`why_us_${i}_title`] || defaultItems[i - 1].title,
    desc: homepage?.[`why_us_${i}_desc`] || defaultItems[i - 1].desc,
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10 text-foreground font-heading">{title}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{item.icon}</span>
            </div>
            <h3 className="font-bold text-sm mb-1 text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
