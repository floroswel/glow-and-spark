import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  old_price: number | null;
  image_url: string;
  category_id: string | null;
  badge: string;
  badge_type: string;
  rating: number;
  reviews_count: number;
  stock: number;
  weight: string;
  is_active: boolean;
  is_featured: boolean;
}

const emptyProduct: Omit<Product, "id"> = {
  name: "", slug: "", description: "", short_description: "", price: 0, old_price: null,
  image_url: "", category_id: null, badge: "", badge_type: "new", rating: 0,
  reviews_count: 0, stock: 0, weight: "", is_active: true, is_featured: false,
};

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from("products").select("*").order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setProducts((pRes.data as any) || []);
    setCategories(cRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    const { id, ...data } = editing as any;
    if (isNew) {
      await supabase.from("products").insert(data);
    } else {
      await supabase.from("products").update(data).eq("id", id);
    }
    setEditing(null);
    setIsNew(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  const openNew = () => {
    setIsNew(true);
    setEditing({ id: "", ...emptyProduct } as Product);
  };

  const updateField = (field: string, value: any) => {
    setEditing((prev) => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) return <div className="text-muted-foreground">Se încarcă...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Produse</h1>
        <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
          <Plus className="h-4 w-4" /> Adaugă Produs
        </button>
      </div>

      {/* Product list */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produs</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preț</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stoc</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.short_description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {p.old_price && <span className="mr-1 text-muted-foreground line-through">{p.old_price}</span>}
                  {p.price} RON
                </td>
                <td className="px-4 py-3 text-foreground">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground"}`}>
                    {p.is_active ? "Activ" : "Inactiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(p); setIsNew(false); }} className="mr-2 text-muted-foreground hover:text-accent"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Niciun produs încă. Adaugă primul!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-foreground">{isNew ? "Produs Nou" : "Editează Produs"}</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Nume</label>
                <input value={editing.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Slug</label>
                <input value={editing.slug} onChange={(e) => updateField("slug", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Categorie</label>
                <select value={editing.category_id || ""} onChange={(e) => updateField("category_id", e.target.value || null)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
                  <option value="">Fără categorie</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Preț (RON)</label>
                <input type="number" value={editing.price} onChange={(e) => updateField("price", Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Preț vechi (RON)</label>
                <input type="number" value={editing.old_price || ""} onChange={(e) => updateField("old_price", e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Stoc</label>
                <input type="number" value={editing.stock} onChange={(e) => updateField("stock", Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Greutate</label>
                <input value={editing.weight} onChange={(e) => updateField("weight", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">URL Imagine</label>
                <input value={editing.image_url} onChange={(e) => updateField("image_url", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Badge</label>
                <input value={editing.badge} onChange={(e) => updateField("badge", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" placeholder="-20%, BESTSELLER, NOU..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tip Badge</label>
                <select value={editing.badge_type} onChange={(e) => updateField("badge_type", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none">
                  <option value="sale">Reducere</option>
                  <option value="bestseller">Bestseller</option>
                  <option value="limited">Stoc limitat</option>
                  <option value="new">Nou</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Descriere scurtă</label>
                <input value={editing.short_description} onChange={(e) => updateField("short_description", e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Descriere completă</label>
                <textarea value={editing.description} onChange={(e) => updateField("description", e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_active} onChange={(e) => updateField("is_active", e.target.checked)} className="rounded" />
                  Activ
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_featured} onChange={(e) => updateField("is_featured", e.target.checked)} className="rounded" />
                  Recomandat
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">Anulează</button>
              <button onClick={handleSave} className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">Salvează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
