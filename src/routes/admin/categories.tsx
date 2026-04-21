import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, GripVertical, Image } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyCategory = {
  id: "", name: "", slug: "", icon: "", description: "", image_url: "",
  sort_order: 0, visible: true, parent_id: null as string | null,
};

function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    const { id, created_at, ...data } = editing;
    if (!data.name.trim()) return;
    if (!data.slug.trim()) data.slug = slugify(data.name);
    if (isNew) {
      await supabase.from("categories").insert(data);
    } else {
      await supabase.from("categories").update(data).eq("id", id);
    }
    setEditing(null);
    setIsNew(false);
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Ești sigur că vrei să ștergi categoria "${name}"?\n\nProdusele din această categorie NU vor fi șterse.`)) return;
    await supabase.from("products").update({ category_id: null }).eq("category_id", id);
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  const toggleVisible = async (cat: any) => {
    await supabase.from("categories").update({ visible: !cat.visible }).eq("id", cat.id);
    load();
  };

  const openNew = () => {
    setIsNew(true);
    setEditing({ ...emptyCategory, sort_order: categories.length + 1 });
  };

  const updateField = (field: string, value: any) => {
    setEditing((prev: any) => {
      if (!prev) return null;
      const next = { ...prev, [field]: value };
      if (field === "name" && (isNew || !prev.slug)) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  const inputClass = "mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Categorii</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorii</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
          <Plus className="h-4 w-4" /> Categorie Nouă
        </button>
      </div>

      {/* Categories list */}
      <div className="mt-6 space-y-3">
        {categories.map((c) => (
          <div key={c.id} className={`flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition ${c.visible ? "border-border" : "border-border/50 opacity-60"}`}>
            <GripVertical className="h-5 w-5 text-muted-foreground/40 shrink-0 cursor-grab" />

            {/* Image */}
            {c.image_url ? (
              <img src={c.image_url} alt={c.name} className="h-14 w-14 rounded-lg object-cover border border-border shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Image className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {c.icon && <span className="text-lg">{c.icon}</span>}
                <p className="font-medium text-foreground">{c.name}</p>
                {!c.visible && <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Ascunsă</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">/{c.slug} {c.description ? `— ${c.description}` : ""}</p>
            </div>

            {/* Order */}
            <span className="text-xs text-muted-foreground bg-secondary rounded px-2 py-1 shrink-0">#{c.sort_order}</span>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggleVisible(c)} title={c.visible ? "Ascunde" : "Arată"} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition">
                {c.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => { setEditing(c); setIsNew(false); }} title="Editează" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-accent transition">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(c.id, c.name)} title="Șterge" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            Nicio categorie. Adaugă prima!
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-foreground">{isNew ? "Categorie Nouă" : "Editează Categoria"}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className={labelClass}>Nume categorie *</label>
                <input value={editing.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} placeholder="Lumânări Parfumate" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Slug (URL)</label>
                  <input value={editing.slug} onChange={(e) => updateField("slug", e.target.value)} className={inputClass} placeholder="lumanari-parfumate" />
                  <p className="mt-1 text-xs text-muted-foreground">/categorie/{editing.slug || "..."}</p>
                </div>
                <div>
                  <label className={labelClass}>Icon (emoji)</label>
                  <input value={editing.icon || ""} onChange={(e) => updateField("icon", e.target.value)} className={inputClass} placeholder="🕯️" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descriere</label>
                <textarea value={editing.description || ""} onChange={(e) => updateField("description", e.target.value)} rows={2} className={inputClass} placeholder="Descriere opțională a categoriei..." />
              </div>
              <div>
                <label className={labelClass}>Imagine categorie (URL)</label>
                <input value={editing.image_url || ""} onChange={(e) => updateField("image_url", e.target.value)} className={inputClass} placeholder="https://..." />
                {editing.image_url && (
                  <img src={editing.image_url} alt="Preview" className="mt-2 h-24 w-full rounded-lg object-cover border border-border" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Categorie părinte</label>
                  <select value={editing.parent_id || ""} onChange={(e) => updateField("parent_id", e.target.value || null)} className={inputClass}>
                    <option value="">Niciuna (categorie principală)</option>
                    {categories.filter((c) => c.id !== editing.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ordine afișare</label>
                  <input type="number" value={editing.sort_order || 0} onChange={(e) => updateField("sort_order", Number(e.target.value))} className={inputClass} />
                </div>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={editing.visible !== false} onChange={(e) => updateField("visible", e.target.checked)} className="rounded border-border" />
                  <span className="flex items-center gap-1">
                    {editing.visible !== false ? <Eye className="h-4 w-4 text-chart-2" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    Vizibilă pe site
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary transition">Anulează</button>
              <button onClick={handleSave} className="rounded-lg bg-foreground px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
                {isNew ? "Creează" : "Salvează"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
