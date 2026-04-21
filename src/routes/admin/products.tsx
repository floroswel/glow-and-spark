import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Search, Eye, EyeOff, Star, Copy, Download, Upload, ChevronLeft, ChevronRight, CheckSquare, Square, AlertTriangle, Loader2, ArrowUpDown } from "lucide-react";

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
  gallery: string[];
  category_id: string | null;
  badge: string;
  badge_type: string;
  rating: number;
  reviews_count: number;
  stock: number;
  weight: string;
  sku: string;
  meta_title: string;
  meta_description: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

const emptyProduct: Omit<Product, "id" | "created_at"> = {
  name: "", slug: "", description: "", short_description: "", price: 0, old_price: null,
  image_url: "", gallery: [], category_id: null, badge: "", badge_type: "new", rating: 0,
  reviews_count: 0, stock: 0, weight: "", sku: "", meta_title: "", meta_description: "",
  is_active: true, is_featured: false, sort_order: 0,
};

const PAGE_SIZE = 20;

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [galleryInput, setGalleryInput] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("sort_order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

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

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat && p.category_id !== filterCat) return false;
      if (filterStatus === "active" && !p.is_active) return false;
      if (filterStatus === "inactive" && p.is_active) return false;
      if (filterStatus === "featured" && !p.is_featured) return false;
      if (filterStock === "in_stock" && p.stock <= 0) return false;
      if (filterStock === "low" && (p.stock <= 0 || p.stock > 10)) return false;
      if (filterStock === "out" && p.stock > 0) return false;
      return true;
    });
    list.sort((a: any, b: any) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [products, search, filterCat, filterStatus, filterStock, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filterCat, filterStatus, filterStock]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // Validation
  const validate = () => {
    if (!editing?.name?.trim()) return "Numele produsului este obligatoriu.";
    if (!editing?.price || editing.price <= 0) return "Prețul trebuie să fie mai mare ca 0.";
    if (editing.stock < 0) return "Stocul nu poate fi negativ.";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { showToast("⚠️ " + err); return; }
    setSaving(true);
    const { id, created_at, updated_at, categories: _cat, ...data } = editing;
    if (typeof data.gallery === "string") {
      try { data.gallery = JSON.parse(data.gallery); } catch { data.gallery = []; }
    }
    if (!data.slug) data.slug = slugify(data.name);
    if (isNew) {
      await supabase.from("products").insert(data);
      showToast("✅ Produs creat cu succes!");
    } else {
      await supabase.from("products").update(data).eq("id", id);
      showToast("✅ Produs actualizat!");
    }
    setSaving(false);
    setEditing(null);
    setIsNew(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest produs?")) return;
    await supabase.from("products").delete().eq("id", id);
    showToast("Produs șters.");
    load();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Ștergi ${selectedIds.size} produse selectate?`)) return;
    for (const id of selectedIds) {
      await supabase.from("products").delete().eq("id", id);
    }
    setSelectedIds(new Set());
    showToast(`${selectedIds.size} produse șterse.`);
    load();
  };

  const handleBulkToggle = async (field: "is_active" | "is_featured", value: boolean) => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await supabase.from("products").update({ [field]: value }).eq("id", id);
    }
    setSelectedIds(new Set());
    showToast(`${selectedIds.size} produse actualizate.`);
    load();
  };

  const handleExportCSV = () => {
    const headers = "Nume,SKU,Categorie,Preț,Preț vechi,Stoc,Activ,Recomandat,Slug\n";
    const rows = filtered.map(p => `"${p.name}","${p.sku || ""}","${catName(p.category_id)}",${p.price},${p.old_price || ""},${p.stock},${p.is_active ? "Da" : "Nu"},${p.is_featured ? "Da" : "Nu"},"${p.slug}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "produse.csv"; a.click();
    showToast("CSV exportat!");
  };

  const handleDuplicate = (p: Product) => {
    setIsNew(true);
    setEditing({ ...p, id: "", name: p.name + " (copie)", slug: p.slug + "-copie", created_at: undefined });
    setActiveTab("info");
  };

  const openNew = () => { setIsNew(true); setEditing({ id: "", ...emptyProduct }); setActiveTab("info"); };
  const openEdit = (p: Product) => { setEditing({ ...p, gallery: Array.isArray(p.gallery) ? p.gallery : [] }); setIsNew(false); setActiveTab("info"); };

  const updateField = (field: string, value: any) => {
    setEditing((prev: any) => {
      if (!prev) return null;
      const next = { ...prev, [field]: value };
      if (field === "name" && (isNew || !prev.slug)) next.slug = slugify(value);
      return next;
    });
  };

  const addGalleryImage = () => {
    if (!galleryInput.trim()) return;
    setEditing((prev: any) => ({ ...prev, gallery: [...(prev.gallery || []), galleryInput.trim()] }));
    setGalleryInput("");
  };

  const removeGalleryImage = (idx: number) => {
    setEditing((prev: any) => ({ ...prev, gallery: prev.gallery.filter((_: any, i: number) => i !== idx) }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(p => p.id)));
  };

  const catName = (catId: string | null) => categories.find((c) => c.id === catId)?.name || "—";

  // Stats
  const statsData = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.is_active).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
  }), [products]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;

  const inputClass = "mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider";
  const thBtn = "flex items-center gap-1 cursor-pointer hover:text-foreground transition";

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Produse</h1>
          <p className="text-sm text-muted-foreground">{products.length} produse total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
            <Plus className="h-4 w-4" /> Produs Nou
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: statsData.total, color: "text-foreground" },
          { label: "Active", value: statsData.active, color: "text-chart-2" },
          { label: "Stoc scăzut", value: statsData.lowStock, color: "text-accent" },
          { label: "Epuizate", value: statsData.outOfStock, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută după nume sau SKU..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-sm focus:border-accent focus:outline-none" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">Toate categoriile</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">Toate statusurile</option>
          <option value="active">Activ</option>
          <option value="inactive">Inactiv</option>
          <option value="featured">Recomandat</option>
        </select>
        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="">Tot stocul</option>
          <option value="in_stock">În stoc</option>
          <option value="low">Stoc scăzut (≤10)</option>
          <option value="out">Epuizat</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selectate</span>
          <button onClick={() => handleBulkToggle("is_active", true)} className="rounded px-3 py-1 text-xs font-medium bg-chart-2/15 text-chart-2 hover:bg-chart-2/25 transition">Activează</button>
          <button onClick={() => handleBulkToggle("is_active", false)} className="rounded px-3 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-secondary transition">Dezactivează</button>
          <button onClick={() => handleBulkToggle("is_featured", true)} className="rounded px-3 py-1 text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 transition">★ Recomandat</button>
          <button onClick={handleBulkDelete} className="rounded px-3 py-1 text-xs font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition">Șterge</button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Deselectează</button>
        </div>
      )}

      {/* Product table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-3 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                  {selectedIds.size === paginated.length && paginated.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("name")} className={thBtn}><span className="font-medium text-muted-foreground">Produs</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categorie</th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("price")} className={thBtn}><span className="font-medium text-muted-foreground">Preț</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("stock")} className={thBtn}><span className="font-medium text-muted-foreground">Stoc</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition ${selectedIds.has(p.id) ? "bg-accent/5" : ""}`}>
                <td className="px-3 py-3">
                  <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-foreground">
                    {selectedIds.has(p.id) ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.short_description || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{catName(p.category_id)}</td>
                <td className="px-4 py-3">
                  <div>
                    {p.old_price && <span className="text-xs text-muted-foreground line-through mr-1">{p.old_price}</span>}
                    <span className="font-medium text-foreground">{p.price} RON</span>
                    {p.old_price && p.price < p.old_price && (
                      <span className="ml-1 text-xs text-chart-2">-{Math.round((1 - p.price / p.old_price) * 100)}%</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {p.stock <= 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    <span className={`text-xs font-medium ${p.stock > 10 ? "text-chart-2" : p.stock > 0 ? "text-accent" : "text-destructive"}`}>
                      {p.stock > 0 ? p.stock : "Epuizat"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "Activ" : "Inactiv"}
                    </span>
                    {p.is_featured && <Star className="h-3.5 w-3.5 text-accent fill-accent" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleDuplicate(p)} title="Duplică" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"><Copy className="h-4 w-4" /></button>
                    <button onClick={() => openEdit(p)} title="Editează" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-accent transition"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p.id)} title="Șterge" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                {products.length === 0 ? "Niciun produs încă. Adaugă primul!" : "Niciun produs nu corespunde filtrelor."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Afișând {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pNum: number;
              if (totalPages <= 7) pNum = i + 1;
              else if (page <= 4) pNum = i + 1;
              else if (page >= totalPages - 3) pNum = totalPages - 6 + i;
              else pNum = page - 3 + i;
              return (
                <button key={pNum} onClick={() => setPage(pNum)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${page === pNum ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                  {pNum}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-xl">
              <h2 className="font-heading text-xl font-bold text-foreground">{isNew ? "Produs Nou" : "Editează Produs"}</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="border-b border-border px-6">
              <div className="flex gap-1">
                {[
                  { key: "info", label: "Informații" },
                  { key: "price", label: "Preț & Stoc" },
                  { key: "media", label: "Media" },
                  { key: "seo", label: "SEO & Badge-uri" },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition ${activeTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === "info" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelClass}>Nume produs *</label>
                    <input value={editing.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} placeholder="Lumânare Vanilla & Santal" />
                    {!editing.name?.trim() && <p className="mt-1 text-xs text-destructive">Câmp obligatoriu</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Slug (URL)</label>
                    <input value={editing.slug} onChange={(e) => updateField("slug", e.target.value)} className={inputClass} placeholder="lumanare-vanilla-santal" />
                    <p className="mt-1 text-xs text-muted-foreground">/produs/{editing.slug || "..."}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Categorie</label>
                    <select value={editing.category_id || ""} onChange={(e) => updateField("category_id", e.target.value || null)} className={inputClass}>
                      <option value="">Fără categorie</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Descriere scurtă</label>
                    <input value={editing.short_description || ""} onChange={(e) => updateField("short_description", e.target.value)} className={inputClass} placeholder="Notă caldă de vanilie și lemn de santal" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Descriere completă</label>
                    <textarea value={editing.description || ""} onChange={(e) => updateField("description", e.target.value)} rows={5} className={inputClass} placeholder="Descriere detaliată a produsului..." />
                  </div>
                </div>
              )}

              {activeTab === "price" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Preț (RON) *</label>
                    <input type="number" step="0.01" value={editing.price} onChange={(e) => updateField("price", Number(e.target.value))} className={inputClass} />
                    {editing.price <= 0 && <p className="mt-1 text-xs text-destructive">Prețul trebuie să fie pozitiv</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Preț vechi (RON)</label>
                    <input type="number" step="0.01" value={editing.old_price || ""} onChange={(e) => updateField("old_price", e.target.value ? Number(e.target.value) : null)} className={inputClass} placeholder="Pentru reducere" />
                    {editing.old_price && editing.price < editing.old_price && (
                      <p className="mt-1 text-xs text-chart-2">-{Math.round((1 - editing.price / editing.old_price) * 100)}% reducere</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Stoc *</label>
                    <input type="number" value={editing.stock} onChange={(e) => updateField("stock", Number(e.target.value))} className={inputClass} />
                    <p className={`mt-1 text-xs ${editing.stock > 10 ? "text-chart-2" : editing.stock > 0 ? "text-accent" : "text-destructive"}`}>
                      {editing.stock > 10 ? "În stoc" : editing.stock > 0 ? "Stoc limitat" : "Epuizat"}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>SKU</label>
                    <input value={editing.sku || ""} onChange={(e) => updateField("sku", e.target.value)} className={inputClass} placeholder="GS-VAN-001" />
                  </div>
                  <div>
                    <label className={labelClass}>Greutate</label>
                    <input value={editing.weight || ""} onChange={(e) => updateField("weight", e.target.value)} className={inputClass} placeholder="250g" />
                  </div>
                  <div>
                    <label className={labelClass}>Ordine afișare</label>
                    <input type="number" value={editing.sort_order || 0} onChange={(e) => updateField("sort_order", Number(e.target.value))} className={inputClass} />
                  </div>
                  <div className="col-span-2 flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={editing.is_active} onChange={(e) => updateField("is_active", e.target.checked)} className="rounded border-border" />
                      <span className="flex items-center gap-1">{editing.is_active ? <Eye className="h-4 w-4 text-chart-2" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />} Activ (vizibil pe site)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={editing.is_featured} onChange={(e) => updateField("is_featured", e.target.checked)} className="rounded border-border" />
                      <span className="flex items-center gap-1"><Star className={`h-4 w-4 ${editing.is_featured ? "text-accent fill-accent" : "text-muted-foreground"}`} /> Recomandat</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Imagine principală (URL)</label>
                    <input value={editing.image_url || ""} onChange={(e) => updateField("image_url", e.target.value)} className={inputClass} placeholder="https://..." />
                    {editing.image_url && <img src={editing.image_url} alt="Preview" className="mt-3 h-40 w-40 rounded-xl object-cover border border-border" />}
                  </div>
                  <div>
                    <label className={labelClass}>Galerie imagini</label>
                    <div className="mt-2 flex gap-2">
                      <input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} className={`${inputClass} mt-0`} placeholder="URL imagine galerie" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())} />
                      <button onClick={addGalleryImage} className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {(editing.gallery || []).length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {(editing.gallery as string[]).map((img: string, i: number) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`Gallery ${i}`} className="h-20 w-20 rounded-lg object-cover border border-border" />
                            <button onClick={() => removeGalleryImage(i)} className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white opacity-0 group-hover:opacity-100 transition">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Meta Title</label>
                    <input value={editing.meta_title || ""} onChange={(e) => updateField("meta_title", e.target.value)} className={inputClass} placeholder={editing.name || "Titlu pagină"} />
                    <p className={`mt-1 text-xs ${(editing.meta_title || editing.name || "").length > 60 ? "text-destructive" : "text-muted-foreground"}`}>{(editing.meta_title || editing.name || "").length}/60 caractere</p>
                  </div>
                  <div>
                    <label className={labelClass}>Meta Description</label>
                    <textarea value={editing.meta_description || ""} onChange={(e) => updateField("meta_description", e.target.value)} rows={2} className={inputClass} placeholder={editing.short_description || "Descriere pentru motoare de căutare"} />
                    <p className={`mt-1 text-xs ${(editing.meta_description || "").length > 160 ? "text-destructive" : "text-muted-foreground"}`}>{(editing.meta_description || "").length}/160 caractere</p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <label className={labelClass}>Badge</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Text badge</label>
                        <input value={editing.badge || ""} onChange={(e) => updateField("badge", e.target.value)} className={inputClass} placeholder="-20%, NOU, BESTSELLER..." />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Tip badge</label>
                        <select value={editing.badge_type || "new"} onChange={(e) => updateField("badge_type", e.target.value)} className={inputClass}>
                          <option value="new">🟢 Nou</option>
                          <option value="sale">🟠 Reducere</option>
                          <option value="bestseller">⭐ Bestseller</option>
                          <option value="limited">🔴 Stoc limitat</option>
                        </select>
                      </div>
                    </div>
                    {editing.badge && (
                      <div className="mt-3">
                        <span className="text-xs text-muted-foreground">Preview:</span>
                        <span className={`ml-2 inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                          editing.badge_type === "sale" ? "bg-accent text-accent-foreground" :
                          editing.badge_type === "bestseller" ? "bg-accent text-accent-foreground" :
                          editing.badge_type === "limited" ? "bg-destructive text-white" :
                          "bg-chart-2 text-white"
                        }`}>
                          {editing.badge}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border pt-4">
                    <label className={labelClass}>Rating & Reviews</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Rating (0-5)</label>
                        <input type="number" step="0.1" min="0" max="5" value={editing.rating || 0} onChange={(e) => updateField("rating", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Număr review-uri</label>
                        <input type="number" value={editing.reviews_count || 0} onChange={(e) => updateField("reviews_count", Number(e.target.value))} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-6 py-4 rounded-b-xl">
              <div className="text-xs text-muted-foreground">
                {!isNew && editing.created_at && `Creat: ${new Date(editing.created_at).toLocaleDateString("ro-RO")}`}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">Anulează</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isNew ? "Creează Produs" : "Salvează Modificările"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
