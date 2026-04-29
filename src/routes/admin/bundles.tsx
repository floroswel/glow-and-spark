import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Plus, Trash2, Edit, Save, X, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bundles")({
  component: BundlesPage,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function BundlesPage() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const [b, p] = await Promise.all([
      supabase.from("product_bundles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, price, image_url").eq("is_active", true).order("name"),
    ]);
    setBundles(b.data ?? []);
    setProducts(p.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openEdit = async (bundle: any | null) => {
    setEditing(bundle ?? { name: "", slug: "", description: "", discount_percent: 10, is_active: true });
    if (bundle) {
      const { data } = await supabase.from("product_bundle_items").select("*").eq("bundle_id", bundle.id).order("sort_order");
      setItems(data ?? []);
    } else {
      setItems([]);
    }
  };

  const save = async () => {
    if (!editing.name.trim()) { toast.error("Nume obligatoriu"); return; }
    const payload = {
      name: editing.name.trim(),
      slug: editing.slug?.trim() || slugify(editing.name),
      description: editing.description ?? null,
      discount_percent: Number(editing.discount_percent) || 0,
      is_active: !!editing.is_active,
    };

    let bundleId = editing.id;
    if (editing.id) {
      const { error } = await supabase.from("product_bundles").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("product_bundles").insert(payload).select().single();
      if (error) { toast.error(error.message); return; }
      bundleId = data.id;
    }

    // Replace items
    await supabase.from("product_bundle_items").delete().eq("bundle_id", bundleId);
    if (items.length > 0) {
      await supabase.from("product_bundle_items").insert(
        items.map((it, idx) => ({ bundle_id: bundleId, product_id: it.product_id, quantity: it.quantity || 1, sort_order: idx }))
      );
    }

    toast.success("Salvat");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ștergi pachetul?")) return;
    await supabase.from("product_bundles").delete().eq("id", id);
    load();
  };

  const toggle = async (b: any) => {
    await supabase.from("product_bundles").update({ is_active: !b.is_active }).eq("id", b.id);
    load();
  };

  const totalPrice = items.reduce((sum, it) => {
    const p = products.find((x) => x.id === it.product_id);
    return sum + (p?.price ?? 0) * (it.quantity || 1);
  }, 0);
  const discounted = totalPrice * (1 - (Number(editing?.discount_percent) || 0) / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-accent" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Pachete Promoționale</h1>
            <p className="text-sm text-muted-foreground">Bundles cu reducere — cumpără mai multe, plătește mai puțin</p>
          </div>
        </div>
        <button onClick={() => openEdit(null)} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent">
          <Plus className="h-4 w-4" /> Pachet nou
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bundles.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground py-12">Niciun pachet creat încă.</p>}
        {bundles.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{b.name}</h3>
                <p className="text-xs text-muted-foreground">/{b.slug}</p>
              </div>
              <button onClick={() => toggle(b)} className="text-muted-foreground hover:text-foreground">
                {b.is_active ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            {b.description && <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>}
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-accent" />
              <span className="font-semibold text-accent">-{b.discount_percent}%</span>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={() => openEdit(b)} className="flex-1 flex items-center justify-center gap-1 rounded bg-secondary px-3 py-1.5 text-xs hover:bg-secondary/80">
                <Edit className="h-3 w-3" /> Editează
              </button>
              <button onClick={() => remove(b.id)} className="rounded bg-red-50 dark:bg-red-950/20 text-red-600 px-3 py-1.5 text-xs hover:bg-red-100">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">{editing.id ? "Editează pachet" : "Pachet nou"}</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium">Nume *</span>
                  <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium">Slug</span>
                  <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium">Descriere</span>
                <textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Reducere (%)</span>
                <input type="number" min={0} max={90} value={editing.discount_percent} onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value })}
                  className="mt-1 w-32 rounded border border-border bg-background px-3 py-2 text-sm" />
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Produse în pachet</span>
                  <select onChange={(e) => {
                    if (!e.target.value) return;
                    setItems([...items, { product_id: e.target.value, quantity: 1 }]);
                    e.target.value = "";
                  }} className="rounded border border-border bg-background px-3 py-1.5 text-xs">
                    <option value="">+ Adaugă produs</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => {
                    const p = products.find((x) => x.id === it.product_id);
                    return (
                      <div key={idx} className="flex items-center gap-2 rounded border border-border p-2">
                        {p?.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                        <span className="flex-1 text-sm">{p?.name ?? "?"}</span>
                        <input type="number" min={1} value={it.quantity} onChange={(e) => {
                          const next = [...items]; next[idx].quantity = Number(e.target.value) || 1; setItems(next);
                        }} className="w-16 rounded border border-border bg-background px-2 py-1 text-sm" />
                        <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {items.length > 0 && (
                <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                  <div className="flex justify-between"><span>Preț total normal:</span><span className="line-through">{totalPrice.toFixed(2)} RON</span></div>
                  <div className="flex justify-between font-semibold text-accent"><span>Preț pachet:</span><span>{discounted.toFixed(2)} RON</span></div>
                  <div className="flex justify-between text-xs text-emerald-600"><span>Economisești:</span><span>{(totalPrice - discounted).toFixed(2)} RON</span></div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Activ
              </label>
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded border border-border px-4 py-2 text-sm">Anulează</button>
              <button onClick={save} className="flex items-center gap-2 rounded bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent">
                <Save className="h-4 w-4" /> Salvează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
