import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Check } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

const defaultSettings = {
  marquee_text: "🔥 COD REDUCERE: VARA10 - 10% EXTRA LA TOATE LUMÂNĂRILE! 🚚 LIVRARE GRATUITĂ PESTE 150 RON.",
  hero_title: "Ritmul lent al\nmomentelor calme",
  hero_subtitle: "Ceară artizanală din soia pură • Esențe sintetice rare",
  hero_cta: "Descoperă Colecția",
  hero_image_url: "",
  collection_title: 'Colecția "Nuit Étoilé"',
  collection_label: "COLECȚIA DE VARĂ",
  clearance_title: "Stocuri limitate",
  clearance_price: "De la 19 RON",
  story_title: "Ceea ce facem diferit este\nmetoda și atenția cu care creăm",
  story_text: "Folosim doar ceară pură, uleiuri esențiale premium și fitile din lemn natural. Fiecare produs este o operă de artă manuală, realizată cu respect pentru mediul tău.",
  story_image_url: "",
  phone: "0800 123 456",
  email: "suport@lumini.ro",
  whatsapp_number: "40800123456",
  free_shipping_min: "150",
  footer_cui: "RO12345678",
  newsletter_discount: "10",
  newsletter_popup_delay: "5000",
};

function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("key", "general").single().then(({ data }) => {
      if (data?.value) setSettings({ ...defaultSettings, ...(data.value as any) });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await supabase.from("site_settings").upsert({ key: "general", value: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div className="text-muted-foreground">Se încarcă...</div>;

  const sections = [
    {
      title: "Banner Marquee",
      fields: [{ key: "marquee_text", label: "Text banner", type: "textarea" }],
    },
    {
      title: "Secțiunea Hero",
      fields: [
        { key: "hero_subtitle", label: "Subtitlu" },
        { key: "hero_title", label: "Titlu", type: "textarea" },
        { key: "hero_cta", label: "Text buton" },
        { key: "hero_image_url", label: "URL imagine hero" },
      ],
    },
    {
      title: "Bannere Colecție",
      fields: [
        { key: "collection_label", label: "Label colecție" },
        { key: "collection_title", label: "Titlu colecție" },
        { key: "clearance_title", label: "Titlu lichidare" },
        { key: "clearance_price", label: "Text preț lichidare" },
      ],
    },
    {
      title: "Povestea noastră",
      fields: [
        { key: "story_title", label: "Titlu", type: "textarea" },
        { key: "story_text", label: "Text", type: "textarea" },
        { key: "story_image_url", label: "URL imagine" },
      ],
    },
    {
      title: "Contact & Livrare",
      fields: [
        { key: "phone", label: "Telefon" },
        { key: "email", label: "Email" },
        { key: "whatsapp_number", label: "Număr WhatsApp" },
        { key: "free_shipping_min", label: "Livrare gratuită de la (RON)" },
        { key: "footer_cui", label: "CUI" },
      ],
    },
    {
      title: "Newsletter Popup",
      fields: [
        { key: "newsletter_discount", label: "Discount (%)" },
        { key: "newsletter_popup_delay", label: "Delay popup (ms)" },
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Setări Magazin</h1>
        <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Salvat!" : "Salvează"}
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">{section.title}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {section.fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea value={(settings as any)[f.key]} onChange={(e) => update(f.key, e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                  ) : (
                    <input value={(settings as any)[f.key]} onChange={(e) => update(f.key, e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
