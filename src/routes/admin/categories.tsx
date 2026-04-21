import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    const { id, ...data } = editing;
    if (isNew) {
      await supabase.from("categories").insert(data);
    } else {
      await supabase.from("categories").update(data).eq("id", id);
    }
    setEditing(null);
    setIsNew(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur?")) return;
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Categorii</h1>
        <button onClick={() => { setIsNew(true); setEditing({ id: "", name: "", slug: "", icon: "", sort_order: 0 }); }} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
          <Plus className="h-4 w-4" /> Adaugă Categorie
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="font-medium text-foreground">{c.icon} {c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(c); setIsNew(false); }} className="text-muted-foreground hover:text-accent"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Nicio categorie. Adaugă prima!</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold">{isNew ? "Categorie Nouă" : "Editează"}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nume</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Slug</label>
                <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Icon (emoji)</label>
                <input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" placeholder="🕯️" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ordine</label>
                <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">Anulează</button>
              <button onClick={handleSave} className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground">Salvează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
