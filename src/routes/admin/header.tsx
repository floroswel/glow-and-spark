import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsEditor, Section, Field, TextInput, Toggle } from "@/components/admin/AdminSettingsEditor";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/header")({
  component: AdminHeader,
});

const defaults = {
  show_topbar: true,
  topbar_text: "Bine ai venit pe Glow & Spark!",
  topbar_right: "RO / RON",
  show_search: true,
  search_placeholder: "Caută lumânări, odorizante, seturi cadou...",
  show_compare: true,
  show_favorites: true,
  show_cart: true,
  navbar_links: [
    { label: "Acasă", url: "/", active: true, highlight: false, color: "" },
    { label: "Reduceri 🔥", url: "/catalog?sort=discount", active: true, highlight: true, color: "#ef4444" },
    { label: "Noutăți", url: "/catalog?sort=newest", active: true, highlight: false, color: "" },
    { label: "🎁 Vouchere Cadou", url: "/catalog?tag=cadou", active: true, highlight: true, color: "#f59e0b" },
  ],
};

function AdminHeader() {
  return (
    <AdminSettingsEditor settingsKey="header" defaults={defaults} title="Editor Header">
      {(s, u) => (
        <>
          <Section title="Top Bar">
            <div className="space-y-4">
              <Toggle value={s.show_topbar} onChange={(v) => u("show_topbar", v)} label="Afișează top bar" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Text stânga"><TextInput value={s.topbar_text} onChange={(v) => u("topbar_text", v)} /></Field>
                <Field label="Text dreapta"><TextInput value={s.topbar_right} onChange={(v) => u("topbar_right", v)} /></Field>
              </div>
            </div>
          </Section>
          <Section title="Elemente Header">
            <div className="flex flex-wrap gap-6">
              <Toggle value={s.show_search} onChange={(v) => u("show_search", v)} label="Bară căutare" />
              <Toggle value={s.show_compare} onChange={(v) => u("show_compare", v)} label="Compară" />
              <Toggle value={s.show_favorites} onChange={(v) => u("show_favorites", v)} label="Favorite" />
              <Toggle value={s.show_cart} onChange={(v) => u("show_cart", v)} label="Coș" />
            </div>
            <div className="mt-4">
              <Field label="Placeholder căutare"><TextInput value={s.search_placeholder} onChange={(v) => u("search_placeholder", v)} /></Field>
            </div>
          </Section>
          <Section title="Linkuri Navigare">
            <div className="space-y-3">
              {(s.navbar_links || []).map((link: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const links = [...s.navbar_links];
                      links[i] = { ...links[i], label: e.target.value };
                      u("navbar_links", links);
                    }}
                    placeholder="Label"
                    className="w-32 rounded border border-border px-2 py-1 text-sm"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => {
                      const links = [...s.navbar_links];
                      links[i] = { ...links[i], url: e.target.value };
                      u("navbar_links", links);
                    }}
                    placeholder="URL"
                    className="flex-1 rounded border border-border px-2 py-1 text-sm"
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={link.active}
                      onChange={(e) => {
                        const links = [...s.navbar_links];
                        links[i] = { ...links[i], active: e.target.checked };
                        u("navbar_links", links);
                      }}
                    />
                    Activ
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={link.highlight}
                      onChange={(e) => {
                        const links = [...s.navbar_links];
                        links[i] = { ...links[i], highlight: e.target.checked };
                        u("navbar_links", links);
                      }}
                    />
                    Highlight
                  </label>
                  {link.highlight && (
                    <input
                      type="color"
                      value={link.color || "#ef4444"}
                      onChange={(e) => {
                        const links = [...s.navbar_links];
                        links[i] = { ...links[i], color: e.target.value };
                        u("navbar_links", links);
                      }}
                      className="h-7 w-7 rounded border"
                    />
                  )}
                  <button
                    onClick={() => {
                      const links = s.navbar_links.filter((_: any, j: number) => j !== i);
                      u("navbar_links", links);
                    }}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => u("navbar_links", [...(s.navbar_links || []), { label: "Nou", url: "/", active: true, highlight: false, color: "" }])}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent/80"
              >
                <Plus className="h-4 w-4" /> Adaugă link
              </button>
            </div>
          </Section>
        </>
      )}
    </AdminSettingsEditor>
  );
}
