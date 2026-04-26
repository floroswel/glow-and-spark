import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, X, Search, Eye, EyeOff, Star, Copy, Download, Upload,
  ChevronLeft, ChevronRight, CheckSquare, Square, AlertTriangle, Loader2,
  ArrowUpDown, ExternalLink, GripVertical, Image as ImageIcon, Package,
  TrendingUp, DollarSign, BarChart3, Filter, RotateCcw, Percent, FolderOpen,
  Save, Check, ChevronDown, FileSpreadsheet, RefreshCw, Tag, Link2, Ruler,
  FileDown, Layers, BoxIcon
} from "lucide-react";

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
  updated_at: string;
  barcode: string | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  is_digital: boolean;
  digital_file_url: string | null;
  digital_max_downloads: number | null;
  brand: string | null;
  cost_price: number;
  min_stock_alert: number;
  allow_backorder: boolean;
  internal_notes: string | null;
  promo_start: string | null;
  promo_end: string | null;
}

interface ProductVariant {
  id?: string;
  product_id?: string;
  name: string;
  sku: string | null;
  price: number | null;
  old_price: number | null;
  stock: number;
  options: Record<string, string>;
  sort_order: number;
  image_url: string | null;
  is_active: boolean;
}

interface ProductTag {
  id: string;
  name: string;
  slug: string;
}

interface RelatedProduct {
  id?: string;
  source_product_id?: string;
  target_product_id: string;
  relation_type: string;
  sort_order: number;
}

const emptyProduct: Omit<Product, "id" | "created_at" | "updated_at"> = {
  name: "", slug: "", description: "", short_description: "", price: 0, old_price: null,
  image_url: "", gallery: [], category_id: null, badge: "", badge_type: "new", rating: 0,
  reviews_count: 0, stock: 0, weight: "", sku: "", meta_title: "", meta_description: "",
  is_active: true, is_featured: false, sort_order: 0,
  barcode: null, length_cm: null, width_cm: null, height_cm: null,
  is_digital: false, digital_file_url: null, digital_max_downloads: 5,
  brand: null, cost_price: 0, min_stock_alert: 5, allow_backorder: false,
  internal_notes: null, promo_start: null, promo_end: null,
};

const PAGE_SIZE = 25;

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
  const [filterBadge, setFilterBadge] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [galleryInput, setGalleryInput] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("sort_order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [toast, setToast] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: string; value: string } | null>(null);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkPricePercent, setBulkPricePercent] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  // New enterprise state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [allTags, setAllTags] = useState<ProductTag[]>([]);
  const [productTagIds, setProductTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [relatedSearchTerm, setRelatedSearchTerm] = useState("");
  const [relatedSearchResults, setRelatedSearchResults] = useState<Product[]>([]);
  const [newVariant, setNewVariant] = useState<ProductVariant>({ name: "", sku: null, price: null, old_price: null, stock: 0, options: {}, sort_order: 0, image_url: null, is_active: true });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterCat, filterStatus, filterStock, filterBadge, priceMin, priceMax, sortField, sortDir]);

  const loadAux = useCallback(async () => {
    const [cRes, tRes] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("product_tags").select("*").order("name"),
    ]);
    setCategories(cRes.data || []);
    setAllTags((tRes.data as any) || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("products").select("*", { count: "exact" });
    if (debouncedSearch) {
      const s = debouncedSearch.replace(/[%,()]/g, "");
      if (s) q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%,short_description.ilike.%${s}%`);
    }
    if (filterCat) q = q.eq("category_id", filterCat);
    if (filterStatus === "active") q = q.eq("is_active", true);
    else if (filterStatus === "inactive") q = q.eq("is_active", false);
    else if (filterStatus === "featured") q = q.eq("is_featured", true);
    if (filterStock === "in_stock") q = q.gt("stock", 0);
    else if (filterStock === "low") q = q.gt("stock", 0).lte("stock", 10);
    else if (filterStock === "out") q = q.lte("stock", 0);
    if (filterBadge) q = q.eq("badge_type", filterBadge);
    if (priceMin) q = q.gte("price", Number(priceMin));
    if (priceMax) q = q.lte("price", Number(priceMax));
    q = q.order(sortField, { ascending: sortDir === "asc" });
    q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count } = await q;
    setProducts((data as any) || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, debouncedSearch, filterCat, filterStatus, filterStock, filterBadge, priceMin, priceMax, sortField, sortDir]);

  useEffect(() => { loadAux(); }, [loadAux]);
  useEffect(() => { load(); }, [load]);

  // On the server-paginated page, "filtered" is the current page result
  const filtered = products;
  const paginated = products;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasActiveFilters = filterCat || filterStatus || filterStock || filterBadge || priceMin || priceMax;


  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const clearFilters = () => {
    setFilterCat(""); setFilterStatus(""); setFilterStock(""); setFilterBadge(""); setPriceMin(""); setPriceMax("");
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
    data.updated_at = new Date().toISOString();
    let productId = id;
    if (isNew) {
      const { data: inserted, error } = await supabase.from("products").insert(data).select("id").single();
      if (error) { showToast("❌ Eroare: " + error.message); setSaving(false); return; }
      productId = inserted.id;
      showToast("✅ Produs creat cu succes!");
    } else {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) { showToast("❌ Eroare: " + error.message); setSaving(false); return; }
      showToast("✅ Produs actualizat!");
    }

    // Save variants
    if (productId) {
      if (!isNew) await supabase.from("product_variants").delete().eq("product_id", productId);
      if (variants.length > 0) {
        const varData = variants.map((v, i) => ({ ...v, product_id: productId, sort_order: i, id: undefined }));
        await supabase.from("product_variants").insert(varData as any);
      }

      // Save tags
      if (!isNew) await supabase.from("product_tag_links").delete().eq("product_id", productId);
      if (productTagIds.length > 0) {
        const tagLinks = productTagIds.map(tag_id => ({ product_id: productId, tag_id }));
        await supabase.from("product_tag_links").insert(tagLinks as any);
      }

      // Save related products
      if (!isNew) await supabase.from("related_products").delete().eq("source_product_id", productId);
      if (relatedProducts.length > 0) {
        const relData = relatedProducts.map((r, i) => ({ source_product_id: productId, target_product_id: r.target_product_id, relation_type: r.relation_type, sort_order: i, id: undefined }));
        await supabase.from("related_products").insert(relData as any);
      }
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

  // Inline quick edit
  const handleInlineEditSave = async () => {
    if (!inlineEdit) return;
    const value = inlineEdit.field === "stock" ? parseInt(inlineEdit.value) : parseFloat(inlineEdit.value);
    if (isNaN(value) || value < 0) { showToast("⚠️ Valoare invalidă"); setInlineEdit(null); return; }
    const updateData: Record<string, any> = { [inlineEdit.field]: value, updated_at: new Date().toISOString() };
    await supabase.from("products").update(updateData as any).eq("id", inlineEdit.id);
    setInlineEdit(null);
    showToast("✅ Actualizat rapid!");
    load();
  };

  // Quick toggle active from table
  const handleQuickToggleActive = async (id: string, current: boolean) => {
    await supabase.from("products").update({ is_active: !current, updated_at: new Date().toISOString() }).eq("id", id);
    showToast(!current ? "✅ Produs activat" : "Produs dezactivat");
    load();
  };

  // Quick toggle featured from table
  const handleQuickToggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("products").update({ is_featured: !current, updated_at: new Date().toISOString() }).eq("id", id);
    showToast(!current ? "★ Marcat recomandat" : "Recomandat scos");
    load();
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkAction) return;
    const ids = Array.from(selectedIds);

    if (bulkAction === "delete") {
      if (!confirm(`Ștergi ${ids.length} produse selectate?`)) return;
      for (const id of ids) await supabase.from("products").delete().eq("id", id);
      showToast(`${ids.length} produse șterse.`);
    } else if (bulkAction === "activate") {
      for (const id of ids) await supabase.from("products").update({ is_active: true }).eq("id", id);
      showToast(`${ids.length} produse activate.`);
    } else if (bulkAction === "deactivate") {
      for (const id of ids) await supabase.from("products").update({ is_active: false }).eq("id", id);
      showToast(`${ids.length} produse dezactivate.`);
    } else if (bulkAction === "featured") {
      for (const id of ids) await supabase.from("products").update({ is_featured: true }).eq("id", id);
      showToast(`${ids.length} produse marcate recomandat.`);
    } else if (bulkAction === "unfeatured") {
      for (const id of ids) await supabase.from("products").update({ is_featured: false }).eq("id", id);
      showToast(`${ids.length} produse scoase din recomandat.`);
    } else if (bulkAction === "category" && bulkCategoryId) {
      for (const id of ids) await supabase.from("products").update({ category_id: bulkCategoryId }).eq("id", id);
      showToast(`Categorie schimbată pentru ${ids.length} produse.`);
    } else if (bulkAction === "price_increase" && bulkPricePercent) {
      const pct = parseFloat(bulkPricePercent);
      if (isNaN(pct)) return;
      for (const id of ids) {
        const p = products.find(x => x.id === id);
        if (p) await supabase.from("products").update({ price: Math.round(p.price * (1 + pct / 100) * 100) / 100 }).eq("id", id);
      }
      showToast(`Preț majorat cu ${pct}% pentru ${ids.length} produse.`);
    } else if (bulkAction === "price_decrease" && bulkPricePercent) {
      const pct = parseFloat(bulkPricePercent);
      if (isNaN(pct)) return;
      for (const id of ids) {
        const p = products.find(x => x.id === id);
        if (p) await supabase.from("products").update({ price: Math.round(p.price * (1 - pct / 100) * 100) / 100 }).eq("id", id);
      }
      showToast(`Preț redus cu ${pct}% pentru ${ids.length} produse.`);
    }

    setSelectedIds(new Set());
    setBulkAction("");
    setBulkCategoryId("");
    setBulkPricePercent("");
    load();
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = "Nume,SKU,Categorie,Preț,Preț vechi,Stoc,Greutate,Activ,Recomandat,Badge,Slug,Descriere scurtă,Meta Title,Meta Description\n";
    const rows = filtered.map(p =>
      `"${p.name}","${p.sku || ""}","${catName(p.category_id)}",${p.price},${p.old_price || ""},${p.stock},"${p.weight || ""}",${p.is_active ? "Da" : "Nu"},${p.is_featured ? "Da" : "Nu"},"${p.badge || ""}","${p.slug}","${(p.short_description || "").replace(/"/g, '""')}","${(p.meta_title || "").replace(/"/g, '""')}","${(p.meta_description || "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `produse_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    showToast("📥 CSV exportat cu succes!");
  };

  // CSV Import
  const handleImportCSV = async () => {
    if (!importData.trim()) return;
    setImportLoading(true);
    try {
      const lines = importData.trim().split("\n");
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes("nume") || header.includes("name") || header.includes("sku");
      const dataLines = hasHeader ? lines.slice(1) : lines;
      let imported = 0;

      for (const line of dataLines) {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        if (cols.length < 3) continue;
        const [name, sku, category, priceStr, oldPriceStr, stockStr] = cols;
        if (!name) continue;
        const cat = categories.find(c => c.name.toLowerCase() === (category || "").toLowerCase());
        const productData: any = {
          name,
          slug: slugify(name),
          sku: sku || null,
          category_id: cat?.id || null,
          price: parseFloat(priceStr) || 0,
          old_price: oldPriceStr ? parseFloat(oldPriceStr) : null,
          stock: parseInt(stockStr) || 0,
          is_active: true,
        };
        await supabase.from("products").insert(productData);
        imported++;
      }
      showToast(`✅ ${imported} produse importate!`);
      setShowImport(false);
      setImportData("");
      load();
    } catch {
      showToast("❌ Eroare la import");
    }
    setImportLoading(false);
  };

  const handleCSVFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportData(ev.target?.result as string || "");
      setShowImport(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Image resize settings
  const [maxImageWidth, setMaxImageWidth] = useState(1200);
  const [maxImageHeight, setMaxImageHeight] = useState(1200);
  const [imageQuality, setImageQuality] = useState(85);
  const [resizeEnabled, setResizeEnabled] = useState(true);

  const resizeImage = useCallback((file: File, maxW: number, maxH: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width <= maxW && height <= maxH) {
          resolve(file);
          return;
        }
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
          mime,
          quality / 100
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
      img.src = url;
    });
  }, []);

  // Image upload with optional resize
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "main" | "gallery") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setter = type === "main" ? setUploading : setUploadingGallery;
    setter(true);
    try {
      let uploadBlob: Blob = file;
      let ext = file.name.split(".").pop() || "jpg";
      if (resizeEnabled && file.type.startsWith("image/")) {
        uploadBlob = await resizeImage(file, maxImageWidth, maxImageHeight, imageQuality);
        if (uploadBlob !== file) {
          ext = file.type === "image/png" ? "png" : "jpg";
        }
      }
      const origSize = (file.size / 1024).toFixed(0);
      const newSize = (uploadBlob.size / 1024).toFixed(0);
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, uploadBlob);
      if (error) {
        showToast("❌ Eroare upload: " + error.message);
        setter(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
      if (type === "main") {
        setEditing((prev: any) => ({ ...prev, image_url: publicUrl }));
      } else {
        setEditing((prev: any) => ({ ...prev, gallery: [...(prev.gallery || []), publicUrl] }));
      }
      const saved = uploadBlob !== file ? ` (${origSize}KB → ${newSize}KB)` : "";
      showToast(`✅ Imagine încărcată!${saved}`);
    } catch (err: any) {
      showToast("❌ Eroare: " + err.message);
    }
    setter(false);
    e.target.value = "";
  };

  const handleDuplicate = (p: Product) => {
    setIsNew(true);
    setEditing({ ...p, id: "", name: p.name + " (copie)", slug: p.slug + "-copie", sku: p.sku ? p.sku + "-COPY" : "", created_at: undefined });
    setActiveTab("info");
  };

  const openNew = () => { setIsNew(true); setEditing({ id: "", ...emptyProduct }); setActiveTab("info"); setVariants([]); setProductTagIds([]); setRelatedProducts([]); };
  const openEdit = async (p: Product) => {
    setEditing({ ...p, gallery: Array.isArray(p.gallery) ? p.gallery : [] });
    setIsNew(false);
    setActiveTab("info");
    // Load variants, tags, related
    const [vRes, tlRes, rRes] = await Promise.all([
      supabase.from("product_variants").select("*").eq("product_id", p.id).order("sort_order"),
      supabase.from("product_tag_links").select("tag_id").eq("product_id", p.id),
      supabase.from("related_products").select("*").eq("source_product_id", p.id).order("sort_order"),
    ]);
    setVariants((vRes.data as any) || []);
    setProductTagIds((tlRes.data || []).map((t: any) => t.tag_id));
    setRelatedProducts((rRes.data as any) || []);
  };

  // Tag helpers
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    const slug = slugify(newTagName);
    const existing = allTags.find(t => t.slug === slug);
    if (existing) {
      if (!productTagIds.includes(existing.id)) setProductTagIds(prev => [...prev, existing.id]);
    } else {
      const { data } = await supabase.from("product_tags").insert({ name: newTagName.trim(), slug }).select().single();
      if (data) {
        setAllTags(prev => [...prev, data as any]);
        setProductTagIds(prev => [...prev, data.id]);
      }
    }
    setNewTagName("");
  };

  const toggleTag = (tagId: string) => {
    setProductTagIds(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  // Variant helpers
  const addVariant = () => {
    if (!newVariant.name.trim()) return;
    setVariants(prev => [...prev, { ...newVariant, sort_order: prev.length }]);
    setNewVariant({ name: "", sku: null, price: null, old_price: null, stock: 0, options: {}, sort_order: 0, image_url: null, is_active: true });
  };

  const removeVariant = (idx: number) => setVariants(prev => prev.filter((_, i) => i !== idx));

  const updateVariant = (idx: number, field: string, value: any) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  // Related products helpers
  const searchRelated = async (term: string) => {
    setRelatedSearchTerm(term);
    if (term.length < 2) { setRelatedSearchResults([]); return; }
    const { data } = await supabase.from("products").select("id, name, image_url, price, slug").ilike("name", `%${term}%`).limit(10);
    setRelatedSearchResults((data as any) || []);
  };

  const addRelated = (targetId: string, type: string = "similar") => {
    if (relatedProducts.some(r => r.target_product_id === targetId)) return;
    setRelatedProducts(prev => [...prev, { target_product_id: targetId, relation_type: type, sort_order: prev.length }]);
    setRelatedSearchTerm("");
    setRelatedSearchResults([]);
  };

  const removeRelated = (idx: number) => setRelatedProducts(prev => prev.filter((_, i) => i !== idx));

  const updateField = (field: string, value: any) => {
    setEditing((prev: any) => {
      if (!prev) return null;
      const next = { ...prev, [field]: value };
      if (field === "name" && (isNew || !prev.slug)) next.slug = slugify(value);
      if (field === "name" && !prev.meta_title) next.meta_title = "";
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

  const moveGalleryImage = (idx: number, dir: -1 | 1) => {
    setEditing((prev: any) => {
      const g = [...(prev.gallery || [])];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= g.length) return prev;
      [g[idx], g[newIdx]] = [g[newIdx], g[idx]];
      return { ...prev, gallery: g };
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(p => p.id)));
  };

  const catName = (catId: string | null) => categories.find((c) => c.id === catId)?.name || "—";

  // Stats
  const [statsData, setStatsData] = useState({ total: 0, active: 0, featured: 0, outOfStock: 0, lowStock: 0, totalValue: 0, avgPrice: 0, withImages: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("price,stock,is_active,is_featured,image_url");
      const list = data || [];
      const totalValue = list.reduce((s: number, p: any) => s + Number(p.price) * Number(p.stock || 0), 0);
      const avgPrice = list.length ? list.reduce((s: number, p: any) => s + Number(p.price), 0) / list.length : 0;
      setStatsData({
        total: list.length,
        active: list.filter((p: any) => p.is_active).length,
        featured: list.filter((p: any) => p.is_featured).length,
        outOfStock: list.filter((p: any) => Number(p.stock) <= 0).length,
        lowStock: list.filter((p: any) => Number(p.stock) > 0 && Number(p.stock) <= 10).length,
        totalValue,
        avgPrice,
        withImages: list.filter((p: any) => p.image_url).length,
      });
    })();
  }, [totalCount]);


  if (loading) return (
    <div className="space-y-4">
      <div className="flex justify-between"><div className="h-8 w-48 bg-muted animate-pulse rounded-lg" /><div className="h-10 w-36 bg-muted animate-pulse rounded-lg" /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      <div className="h-96 bg-muted animate-pulse rounded-xl" />
    </div>
  );

  const inputClass = "mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider";
  const thBtn = "flex items-center gap-1 cursor-pointer hover:text-foreground transition";
  const selectClass = "rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "main")} />
      <input ref={galleryFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "gallery")} />
      <input ref={csvFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVFileUpload} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Produse</h1>
          <p className="text-sm text-muted-foreground">{products.length} produse total · {statsData.active} active · {statsData.outOfStock} epuizate</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => load()} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition" title="Reîncarcă">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => csvFileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition">
            <Plus className="h-4 w-4" /> Produs Nou
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total", value: statsData.total, icon: Package, color: "text-foreground" },
          { label: "Active", value: statsData.active, icon: Eye, color: "text-chart-2" },
          { label: "Recomandate", value: statsData.featured, icon: Star, color: "text-accent" },
          { label: "Stoc scăzut", value: statsData.lowStock, icon: AlertTriangle, color: "text-amber-500" },
          { label: "Epuizate", value: statsData.outOfStock, icon: EyeOff, color: "text-destructive" },
          { label: "Cu imagine", value: `${statsData.withImages}/${statsData.total}`, icon: ImageIcon, color: "text-chart-1" },
          { label: "Preț mediu", value: `${statsData.avgPrice.toFixed(0)} RON`, icon: DollarSign, color: "text-chart-3" },
          { label: "Valoare stoc", value: `${(statsData.totalValue / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-chart-2" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter toggle */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume, SKU sau descriere..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-sm focus:border-accent focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${showFilters || hasActiveFilters ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-secondary"}`}>
          <Filter className="h-4 w-4" /> Filtre {hasActiveFilters && <span className="rounded-full bg-accent text-accent-foreground px-1.5 text-[10px] font-bold">{[filterCat, filterStatus, filterStock, filterBadge, priceMin, priceMax].filter(Boolean).length}</span>}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Categorie</label>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={selectClass + " w-full mt-1"}>
              <option value="">Toate</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass + " w-full mt-1"}>
              <option value="">Toate</option>
              <option value="active">Activ</option>
              <option value="inactive">Inactiv</option>
              <option value="featured">Recomandat</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Stoc</label>
            <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className={selectClass + " w-full mt-1"}>
              <option value="">Tot</option>
              <option value="in_stock">În stoc</option>
              <option value="low">Stoc scăzut (≤10)</option>
              <option value="out">Epuizat</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Badge</label>
            <select value={filterBadge} onChange={(e) => setFilterBadge(e.target.value)} className={selectClass + " w-full mt-1"}>
              <option value="">Toate</option>
              <option value="new">Nou</option>
              <option value="sale">Reducere</option>
              <option value="bestseller">Bestseller</option>
              <option value="limited">Stoc limitat</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Preț min (RON)</label>
            <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className={selectClass + " w-full mt-1"} placeholder="0" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Preț max (RON)</label>
            <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className={selectClass + " w-full mt-1"} placeholder="999" />
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{selectedIds.size} selectate</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className={selectClass}>
            <option value="">Acțiune în masă...</option>
            <option value="activate">✅ Activează</option>
            <option value="deactivate">⛔ Dezactivează</option>
            <option value="featured">⭐ Marchează recomandat</option>
            <option value="unfeatured">☆ Scoate recomandat</option>
            <option value="category">📁 Schimbă categoria</option>
            <option value="price_increase">📈 Majorare preț %</option>
            <option value="price_decrease">📉 Reducere preț %</option>
            <option value="delete">🗑️ Șterge</option>
          </select>
          {bulkAction === "category" && (
            <select value={bulkCategoryId} onChange={(e) => setBulkCategoryId(e.target.value)} className={selectClass}>
              <option value="">Selectează categoria...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {(bulkAction === "price_increase" || bulkAction === "price_decrease") && (
            <div className="flex items-center gap-1">
              <input type="number" value={bulkPricePercent} onChange={(e) => setBulkPricePercent(e.target.value)} className={selectClass + " w-20"} placeholder="%" />
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          {bulkAction && (
            <button onClick={handleBulkAction} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
              Aplică
            </button>
          )}
          <button onClick={() => { setSelectedIds(new Set()); setBulkAction(""); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
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
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categorie</th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("price")} className={thBtn}><span className="font-medium text-muted-foreground">Preț</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("stock")} className={thBtn}><span className="font-medium text-muted-foreground">Stoc</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell"><button onClick={() => handleSort("updated_at")} className={thBtn}><span>Actualizat</span><ArrowUpDown className="h-3 w-3" /></button></th>
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
                      <img src={p.image_url} alt={p.name} loading="lazy" className="h-12 w-12 rounded-lg object-cover border border-border shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0"><ImageIcon className="h-5 w-5" /></div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.short_description || p.slug}</p>
                      {p.badge && (
                        <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          p.badge_type === "sale" ? "bg-accent/15 text-accent" : p.badge_type === "limited" ? "bg-destructive/15 text-destructive" : "bg-chart-2/15 text-chart-2"
                        }`}>{p.badge}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden lg:table-cell">{p.sku || "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground bg-secondary rounded-md px-2 py-1">{catName(p.category_id)}</span>
                </td>
                <td className="px-4 py-3">
                  {inlineEdit?.id === p.id && inlineEdit.field === "price" ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={inlineEdit.value} onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                        className="w-20 rounded border border-accent px-2 py-1 text-sm" autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleInlineEditSave(); if (e.key === "Escape") setInlineEdit(null); }}
                        onBlur={handleInlineEditSave} />
                    </div>
                  ) : (
                    <div className="cursor-pointer group" onClick={() => setInlineEdit({ id: p.id, field: "price", value: String(p.price) })} title="Click pentru editare rapidă">
                      {p.old_price && <span className="text-xs text-muted-foreground line-through mr-1">{p.old_price}</span>}
                      <span className="font-medium text-foreground group-hover:text-accent transition">{p.price} <span className="text-xs text-muted-foreground">RON</span></span>
                      {p.old_price && p.price < p.old_price && (
                        <span className="ml-1 text-xs text-chart-2 font-medium">-{Math.round((1 - p.price / p.old_price) * 100)}%</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {inlineEdit?.id === p.id && inlineEdit.field === "stock" ? (
                    <input type="number" value={inlineEdit.value} onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                      className="w-16 rounded border border-accent px-2 py-1 text-sm" autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleInlineEditSave(); if (e.key === "Escape") setInlineEdit(null); }}
                      onBlur={handleInlineEditSave} />
                  ) : (
                    <div className="flex items-center gap-1 cursor-pointer group" onClick={() => setInlineEdit({ id: p.id, field: "stock", value: String(p.stock) })} title="Click pentru editare rapidă">
                      {p.stock <= 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      <span className={`text-xs font-medium group-hover:text-accent transition ${p.stock > 10 ? "text-chart-2" : p.stock > 0 ? "text-amber-500" : "text-destructive"}`}>
                        {p.stock > 0 ? p.stock : "Epuizat"}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleQuickToggleActive(p.id, p.is_active)} title={p.is_active ? "Dezactivează" : "Activează"}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium transition cursor-pointer ${p.is_active ? "bg-chart-2/15 text-chart-2 hover:bg-chart-2/25" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
                      {p.is_active ? "Activ" : "Inactiv"}
                    </button>
                    <button onClick={() => handleQuickToggleFeatured(p.id, p.is_featured)} title={p.is_featured ? "Scoate recomandat" : "Marchează recomandat"}>
                      <Star className={`h-3.5 w-3.5 transition cursor-pointer ${p.is_featured ? "text-accent fill-accent" : "text-muted-foreground/30 hover:text-accent/50"}`} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">
                  {p.updated_at ? new Date(p.updated_at).toLocaleDateString("ro-RO") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Link to="/produs/$slug" params={{ slug: p.slug }} target="_blank" title="Vezi pe site" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-chart-2 transition">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDuplicate(p)} title="Duplică" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"><Copy className="h-4 w-4" /></button>
                    <button onClick={() => openEdit(p)} title="Editează" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-accent transition"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p.id)} title="Șterge" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
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
            {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} din {totalCount} produse
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="rounded-lg border border-border px-2 py-1.5 text-xs disabled:opacity-40 hover:bg-secondary transition">Prima</button>
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
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="rounded-lg border border-border px-2 py-1.5 text-xs disabled:opacity-40 hover:bg-secondary transition">Ultima</button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Import CSV Produse</h2>
              <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Format CSV acceptat:</p>
                <code className="text-xs">Nume, SKU, Categorie, Preț, Preț vechi, Stoc</code>
                <p className="mt-2 text-xs">Prima linie poate fi header (se detectează automat). Categoria se potrivește după nume.</p>
              </div>
              <textarea value={importData} onChange={(e) => setImportData(e.target.value)} rows={10} className={inputClass + " font-mono text-xs"} placeholder="Lumânare Vanilla, GS-001, Lumânări, 49.99, 69.99, 50&#10;Lumânare Lavandă, GS-002, Lumânări, 39.99, , 30" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowImport(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">Anulează</button>
                <button onClick={handleImportCSV} disabled={importLoading || !importData.trim()} className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50">
                  {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Importă
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-xl">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">{isNew ? "Produs Nou" : "Editează Produs"}</h2>
                {!isNew && editing.slug && <p className="text-xs text-muted-foreground mt-0.5">/produs/{editing.slug}</p>}
              </div>
              <div className="flex items-center gap-2">
                {!isNew && editing.slug && (
                  <Link to="/produs/$slug" params={{ slug: editing.slug }} target="_blank" className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition">
                    <ExternalLink className="h-3.5 w-3.5" /> Preview
                  </Link>
                )}
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="border-b border-border px-6">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { key: "info", label: "📝 Informații" },
                  { key: "price", label: "💰 Preț & Stoc" },
                  { key: "variants", label: "📦 Variante" },
                  { key: "media", label: "🖼️ Media" },
                  { key: "tags", label: "🏷️ Taguri" },
                  { key: "related", label: "🔗 Relationate" },
                  { key: "logistics", label: "📐 Logistică" },
                  { key: "seo", label: "🔍 SEO" },
                  { key: "badges", label: "⭐ Badge" },
                  { key: "advanced", label: "⚙️ Avansat" },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition whitespace-nowrap ${activeTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
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
                  <div>
                    <label className={labelClass}>Brand</label>
                    <input value={editing.brand || ""} onChange={(e) => updateField("brand", e.target.value)} className={inputClass} placeholder="Glow & Spark" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Descriere scurtă</label>
                    <input value={editing.short_description || ""} onChange={(e) => updateField("short_description", e.target.value)} className={inputClass} placeholder="Notă caldă de vanilie și lemn de santal" />
                    <p className="mt-1 text-xs text-muted-foreground">{(editing.short_description || "").length} caractere</p>
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Descriere completă (HTML acceptat)</label>
                    <textarea value={editing.description || ""} onChange={(e) => updateField("description", e.target.value)} rows={8} className={inputClass + " font-mono text-xs"} placeholder="Descriere detaliată a produsului..." />
                    <p className="mt-1 text-xs text-muted-foreground">{(editing.description || "").length} caractere</p>
                  </div>
                </div>
              )}

              {activeTab === "price" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Preț (RON) *</label>
                    <input type="number" step="0.01" value={editing.price} onChange={(e) => updateField("price", Number(e.target.value))} className={inputClass} />
                    {editing.price <= 0 && <p className="mt-1 text-xs text-destructive">Prețul trebuie să fie pozitiv</p>}
                    {editing.price > 0 && <p className="mt-1 text-xs text-muted-foreground">Cu TVA (19%): {(editing.price * 1.19).toFixed(2)} RON</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Preț vechi (RON)</label>
                    <input type="number" step="0.01" value={editing.old_price || ""} onChange={(e) => updateField("old_price", e.target.value ? Number(e.target.value) : null)} className={inputClass} placeholder="Pentru reducere" />
                    {editing.old_price && editing.price < editing.old_price && (
                      <p className="mt-1 text-xs text-chart-2 font-medium">🏷️ Reducere: -{Math.round((1 - editing.price / editing.old_price) * 100)}% ({(editing.old_price - editing.price).toFixed(2)} RON economie)</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Cost achiziție (RON)</label>
                    <input type="number" step="0.01" value={editing.cost_price || ""} onChange={(e) => updateField("cost_price", Number(e.target.value))} className={inputClass} placeholder="Preț de achiziție" />
                    {editing.cost_price > 0 && editing.price > 0 && (
                      <p className="mt-1 text-xs text-chart-2 font-medium">
                        Profit: {(editing.price - editing.cost_price).toFixed(2)} RON ({((1 - editing.cost_price / editing.price) * 100).toFixed(0)}% marjă)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>SKU (Cod produs)</label>
                    <input value={editing.sku || ""} onChange={(e) => updateField("sku", e.target.value)} className={inputClass} placeholder="GS-VAN-001" />
                  </div>
                  <div>
                    <label className={labelClass}>Stoc *</label>
                    <input type="number" value={editing.stock} onChange={(e) => updateField("stock", Number(e.target.value))} className={inputClass} />
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${editing.stock > (editing.min_stock_alert || 5) ? "bg-chart-2" : editing.stock > 0 ? "bg-amber-500" : "bg-destructive"}`} />
                      <p className={`text-xs font-medium ${editing.stock > (editing.min_stock_alert || 5) ? "text-chart-2" : editing.stock > 0 ? "text-amber-500" : "text-destructive"}`}>
                        {editing.stock > (editing.min_stock_alert || 5) ? "În stoc" : editing.stock > 0 ? `Stoc limitat (${editing.stock} buc.)` : "Epuizat"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Prag alertă stoc minim</label>
                    <input type="number" value={editing.min_stock_alert ?? 5} onChange={(e) => updateField("min_stock_alert", Number(e.target.value))} className={inputClass} />
                    <p className="mt-1 text-xs text-muted-foreground">Alertă când stocul scade sub {editing.min_stock_alert ?? 5} buc.</p>
                  </div>
                  <div className="col-span-2 border-t border-border pt-4">
                    <label className={labelClass}>Promoție programată</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Start promoție</label>
                        <input type="datetime-local" value={editing.promo_start?.slice(0, 16) || ""} onChange={(e) => updateField("promo_start", e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Sfârșit promoție</label>
                        <input type="datetime-local" value={editing.promo_end?.slice(0, 16) || ""} onChange={(e) => updateField("promo_end", e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputClass} />
                      </div>
                    </div>
                    {editing.promo_start && editing.promo_end && (
                      <p className="mt-1 text-xs text-accent font-medium">
                        📅 Promoție activă: {new Date(editing.promo_start).toLocaleDateString("ro-RO")} — {new Date(editing.promo_end).toLocaleDateString("ro-RO")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Greutate</label>
                    <input value={editing.weight || ""} onChange={(e) => updateField("weight", e.target.value)} className={inputClass} placeholder="250g" />
                  </div>
                  <div>
                    <label className={labelClass}>Ordine afișare</label>
                    <input type="number" value={editing.sort_order || 0} onChange={(e) => updateField("sort_order", Number(e.target.value))} className={inputClass} />
                  </div>
                  <div className="col-span-2 flex items-center gap-6 pt-2 border-t border-border">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={editing.is_active} onChange={(e) => updateField("is_active", e.target.checked)} className="rounded border-border accent-accent h-4 w-4" />
                      <span className="flex items-center gap-1">{editing.is_active ? <Eye className="h-4 w-4 text-chart-2" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />} Activ (vizibil pe site)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={editing.is_featured} onChange={(e) => updateField("is_featured", e.target.checked)} className="rounded border-border accent-accent h-4 w-4" />
                      <span className="flex items-center gap-1"><Star className={`h-4 w-4 ${editing.is_featured ? "text-accent fill-accent" : "text-muted-foreground"}`} /> Produs recomandat</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={editing.allow_backorder || false} onChange={(e) => updateField("allow_backorder", e.target.checked)} className="rounded border-border accent-accent h-4 w-4" />
                      <span>Permite comandă dacă epuizat</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Imagine principală</label>
                    <div className="mt-2 flex gap-3 items-start">
                      <div className="flex-1">
                        <input value={editing.image_url || ""} onChange={(e) => updateField("image_url", e.target.value)} className={inputClass + " mt-0"} placeholder="https://... sau încarcă o imagine" />
                      </div>
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition disabled:opacity-50">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload
                      </button>
                    </div>
                    {editing.image_url && (
                      <div className="mt-3 relative group inline-block">
                        <img src={editing.image_url} alt="Preview" className="h-40 w-40 rounded-xl object-cover border border-border" />
                        <button onClick={() => updateField("image_url", "")} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white opacity-0 group-hover:opacity-100 transition">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border pt-6">
                    <label className={labelClass}>⚙️ Setări redimensionare</label>
                    <div className="mt-2 rounded-lg border border-border p-4 space-y-3">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" checked={resizeEnabled} onChange={(e) => setResizeEnabled(e.target.checked)} className="rounded border-border accent-accent h-4 w-4" />
                        Redimensionare automată la upload
                      </label>
                      {resizeEnabled && (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Lățime max (px)</label>
                            <input type="number" value={maxImageWidth} onChange={(e) => setMaxImageWidth(Number(e.target.value))} className={inputClass} min={100} max={4000} step={100} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Înălțime max (px)</label>
                            <input type="number" value={maxImageHeight} onChange={(e) => setMaxImageHeight(Number(e.target.value))} className={inputClass} min={100} max={4000} step={100} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Calitate (%)</label>
                            <input type="number" value={imageQuality} onChange={(e) => setImageQuality(Number(e.target.value))} className={inputClass} min={10} max={100} step={5} />
                          </div>
                          <p className="col-span-3 text-xs text-muted-foreground">Imaginile mai mari de {maxImageWidth}×{maxImageHeight}px vor fi redimensionate automat. Calitate JPEG: {imageQuality}%.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-border pt-6">
                    <label className={labelClass}>Galerie imagini ({(editing.gallery || []).length} imagini)</label>
                    <div className="mt-2 flex gap-2">
                      <input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} className={`${inputClass} mt-0`} placeholder="URL imagine galerie"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())} />
                      <button onClick={addGalleryImage} className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
                        <Plus className="h-4 w-4" />
                      </button>
                      <button onClick={() => galleryFileRef.current?.click()} disabled={uploadingGallery}
                        className="shrink-0 flex items-center gap-1 rounded-lg border border-dashed border-accent px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition disabled:opacity-50">
                        {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </button>
                    </div>
                    {(editing.gallery || []).length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {(editing.gallery as string[]).map((img: string, i: number) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`Gallery ${i + 1}`} className="h-24 w-24 rounded-lg object-cover border border-border" />
                            <div className="absolute inset-0 bg-foreground/50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                              {i > 0 && <button onClick={() => moveGalleryImage(i, -1)} className="rounded bg-card p-1 text-foreground text-xs hover:bg-secondary">◀</button>}
                              <button onClick={() => removeGalleryImage(i)} className="rounded bg-destructive p-1 text-white"><X className="h-3 w-3" /></button>
                              {i < (editing.gallery as string[]).length - 1 && <button onClick={() => moveGalleryImage(i, 1)} className="rounded bg-card p-1 text-foreground text-xs hover:bg-secondary">▶</button>}
                            </div>
                            <span className="absolute bottom-1 left-1 bg-foreground/70 text-primary-foreground text-[10px] px-1 rounded">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "variants" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Variante de produs (mărimi, culori, etc.) — fiecare variantă poate avea preț și stoc propriu.</p>
                  {/* Existing variants */}
                  {variants.length > 0 && (
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {variants.map((v, i) => (
                        <div key={i} className="p-3 flex items-center gap-3 flex-wrap">
                          <div className="flex-1 min-w-[120px]">
                            <input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)} className={inputClass + " mt-0 text-sm"} placeholder="Nume variantă" />
                          </div>
                          <div className="w-24">
                            <input value={v.sku || ""} onChange={(e) => updateVariant(i, "sku", e.target.value)} className={inputClass + " mt-0 text-xs"} placeholder="SKU" />
                          </div>
                          <div className="w-24">
                            <input type="number" value={v.price ?? ""} onChange={(e) => updateVariant(i, "price", e.target.value ? Number(e.target.value) : null)} className={inputClass + " mt-0 text-sm"} placeholder="Preț" />
                          </div>
                          <div className="w-20">
                            <input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", Number(e.target.value))} className={inputClass + " mt-0 text-sm"} placeholder="Stoc" />
                          </div>
                          <label className="flex items-center gap-1 text-xs">
                            <input type="checkbox" checked={v.is_active} onChange={(e) => updateVariant(i, "is_active", e.target.checked)} className="accent-accent" />
                            Activ
                          </label>
                          <button onClick={() => removeVariant(i)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add new variant */}
                  <div className="rounded-lg border border-dashed border-accent/40 p-4 space-y-3">
                    <p className="text-xs font-medium text-accent uppercase">Adaugă variantă nouă</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <input value={newVariant.name} onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))} className={inputClass + " mt-0"} placeholder="Ex: Mărime M, Roșu" />
                      <input value={newVariant.sku || ""} onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))} className={inputClass + " mt-0"} placeholder="SKU variantă" />
                      <input type="number" value={newVariant.price ?? ""} onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : null }))} className={inputClass + " mt-0"} placeholder="Preț (RON)" />
                      <input type="number" value={newVariant.stock} onChange={(e) => setNewVariant(prev => ({ ...prev, stock: Number(e.target.value) }))} className={inputClass + " mt-0"} placeholder="Stoc" />
                    </div>
                    <button onClick={addVariant} disabled={!newVariant.name.trim()} className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50">
                      <Plus className="h-4 w-4" /> Adaugă variantă
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "tags" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Taguri pentru filtrare și organizare. Poți crea taguri noi sau selecta din cele existente.</p>
                  {/* Selected tags */}
                  <div className="flex flex-wrap gap-2">
                    {productTagIds.map(tagId => {
                      const tag = allTags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span key={tagId} className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent font-medium">
                          <Tag className="h-3 w-3" /> {tag.name}
                          <button onClick={() => toggleTag(tagId)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </span>
                      );
                    })}
                    {productTagIds.length === 0 && <p className="text-sm text-muted-foreground italic">Niciun tag selectat</p>}
                  </div>
                  {/* Add new tag */}
                  <div className="flex gap-2">
                    <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} className={inputClass + " mt-0"} placeholder="Nume tag nou..."
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())} />
                    <button onClick={handleAddTag} disabled={!newTagName.trim()} className="shrink-0 flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50">
                      <Plus className="h-4 w-4" /> Adaugă
                    </button>
                  </div>
                  {/* Existing tags */}
                  {allTags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Taguri existente (click pentru a adăuga/scoate)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map(tag => (
                          <button key={tag.id} onClick={() => toggleTag(tag.id)}
                            className={`rounded-full px-3 py-1 text-xs font-medium border transition ${productTagIds.includes(tag.id) ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border hover:border-accent hover:text-accent"}`}>
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "related" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Produse similare, cross-sell și up-sell. Apar pe pagina produsului.</p>
                  {/* Current related */}
                  {relatedProducts.length > 0 && (
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {relatedProducts.map((r, i) => {
                        const target = products.find(p => p.id === r.target_product_id);
                        return (
                          <div key={i} className="p-3 flex items-center gap-3">
                            {target?.image_url ? (
                              <img src={target.image_url} alt={target.name} loading="lazy" className="h-10 w-10 rounded-lg object-cover border border-border" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{target?.name || r.target_product_id}</p>
                              <p className="text-xs text-muted-foreground">{target?.price} RON</p>
                            </div>
                            <select value={r.relation_type} onChange={(e) => setRelatedProducts(prev => prev.map((rp, ri) => ri === i ? { ...rp, relation_type: e.target.value } : rp))}
                              className="rounded border border-border px-2 py-1 text-xs bg-card">
                              <option value="similar">Similar</option>
                              <option value="cross-sell">Cross-sell</option>
                              <option value="up-sell">Up-sell</option>
                            </select>
                            <button onClick={() => removeRelated(i)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Search to add */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input value={relatedSearchTerm} onChange={(e) => searchRelated(e.target.value)} className={inputClass + " mt-0 pl-10"} placeholder="Caută produs de adăugat..." />
                    {relatedSearchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                        {relatedSearchResults.filter(p => p.id !== editing?.id && !relatedProducts.some(r => r.target_product_id === p.id)).map(p => (
                          <button key={p.id} onClick={() => addRelated(p.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary transition">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} loading="lazy" className="h-8 w-8 rounded object-cover border border-border" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><ImageIcon className="h-3 w-3 text-muted-foreground" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{p.price} RON</span>
                            <Plus className="h-4 w-4 text-accent" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "logistics" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>Cod de bare (EAN/GTIN)</label>
                      <input value={editing.barcode || ""} onChange={(e) => updateField("barcode", e.target.value)} className={inputClass} placeholder="5901234123457" />
                    </div>
                    <div>
                      <label className={labelClass}>Lungime (cm)</label>
                      <input type="number" step="0.1" value={editing.length_cm ?? ""} onChange={(e) => updateField("length_cm", e.target.value ? Number(e.target.value) : null)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Lățime (cm)</label>
                      <input type="number" step="0.1" value={editing.width_cm ?? ""} onChange={(e) => updateField("width_cm", e.target.value ? Number(e.target.value) : null)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Înălțime (cm)</label>
                      <input type="number" step="0.1" value={editing.height_cm ?? ""} onChange={(e) => updateField("height_cm", e.target.value ? Number(e.target.value) : null)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Greutate</label>
                      <input value={editing.weight || ""} onChange={(e) => updateField("weight", e.target.value)} className={inputClass} placeholder="250g" />
                    </div>
                    {(editing.length_cm && editing.width_cm && editing.height_cm) ? (
                      <div className="col-span-2 rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Volum: {((editing.length_cm * editing.width_cm * editing.height_cm) / 1000).toFixed(1)} litri · Dimensiuni: {editing.length_cm} × {editing.width_cm} × {editing.height_cm} cm</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="border-t border-border pt-6">
                    <label className={labelClass}>Produs digital</label>
                    <label className="mt-2 flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={editing.is_digital || false} onChange={(e) => updateField("is_digital", e.target.checked)} className="rounded border-border accent-accent h-4 w-4" />
                      <FileDown className="h-4 w-4" /> Acest produs este digital (descărcabil)
                    </label>
                    {editing.is_digital && (
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-xs text-muted-foreground">URL fișier descărcare</label>
                          <input value={editing.digital_file_url || ""} onChange={(e) => updateField("digital_file_url", e.target.value)} className={inputClass} placeholder="https://...file.pdf" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Nr. maxim descărcări</label>
                          <input type="number" value={editing.digital_max_downloads ?? 5} onChange={(e) => updateField("digital_max_downloads", Number(e.target.value))} className={inputClass} min={1} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">GOOGLE PREVIEW</p>
                    <p className="text-blue-600 text-base font-medium truncate">{editing.meta_title || editing.name || "Titlu produs"} — Lumini.ro</p>
                    <p className="text-green-700 text-xs">lumini.ro/produs/{editing.slug || "..."}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{editing.meta_description || editing.short_description || "Descriere produs..."}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Meta Title</label>
                    <input value={editing.meta_title || ""} onChange={(e) => updateField("meta_title", e.target.value)} className={inputClass} placeholder={editing.name || "Titlu pagină"} />
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Ideal: 50-60 caractere</p>
                      <p className={`text-xs font-medium ${(editing.meta_title || editing.name || "").length > 60 ? "text-destructive" : (editing.meta_title || editing.name || "").length >= 50 ? "text-chart-2" : "text-muted-foreground"}`}>
                        {(editing.meta_title || editing.name || "").length}/60
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Meta Description</label>
                    <textarea value={editing.meta_description || ""} onChange={(e) => updateField("meta_description", e.target.value)} rows={3} className={inputClass} placeholder={editing.short_description || "Descriere pentru motoare de căutare"} />
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Ideal: 120-160 caractere</p>
                      <p className={`text-xs font-medium ${(editing.meta_description || "").length > 160 ? "text-destructive" : (editing.meta_description || "").length >= 120 ? "text-chart-2" : "text-muted-foreground"}`}>
                        {(editing.meta_description || "").length}/160
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "badges" && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Badge produs</label>
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
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Preview:</span>
                        <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                          editing.badge_type === "sale" ? "bg-accent text-accent-foreground" :
                          editing.badge_type === "bestseller" ? "bg-accent text-accent-foreground" :
                          editing.badge_type === "limited" ? "bg-destructive text-white" :
                          "bg-chart-2 text-white"
                        }`}>{editing.badge}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border pt-6">
                    <label className={labelClass}>Rating & Reviews</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Rating (0-5)</label>
                        <input type="number" step="0.1" min="0" max="5" value={editing.rating || 0} onChange={(e) => updateField("rating", Number(e.target.value))} className={inputClass} />
                        <div className="mt-1 flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-4 w-4 ${s <= Math.round(editing.rating || 0) ? "text-accent fill-accent" : "text-muted-foreground/20"}`} />
                          ))}
                          <span className="ml-2 text-xs text-muted-foreground">{editing.rating || 0}/5</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Număr review-uri</label>
                        <input type="number" value={editing.reviews_count || 0} onChange={(e) => updateField("reviews_count", Number(e.target.value))} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "advanced" && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Note interne (vizibile doar admin)</label>
                    <textarea value={editing.internal_notes || ""} onChange={(e) => updateField("internal_notes", e.target.value)} rows={4} className={inputClass} placeholder="Note interne despre acest produs..." />
                    <p className="mt-1 text-xs text-muted-foreground">Aceste note nu sunt vizibile pe site.</p>
                  </div>
                  <div className="border-t border-border pt-6">
                    <label className={labelClass}>Setări stoc avansate</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Prag alertă stoc minim</label>
                        <input type="number" value={editing.min_stock_alert ?? 5} onChange={(e) => updateField("min_stock_alert", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input type="checkbox" checked={editing.allow_backorder || false} onChange={(e) => updateField("allow_backorder", e.target.checked)} className="rounded border-border accent-accent h-4 w-4" />
                          Permite comandă dacă epuizat (backorder)
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border pt-6">
                    <label className={labelClass}>Brand</label>
                    <input value={editing.brand || ""} onChange={(e) => updateField("brand", e.target.value)} className={inputClass} placeholder="Glow & Spark" />
                  </div>
                  <div className="border-t border-border pt-6">
                    <label className={labelClass}>Informații financiare</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Cost achiziție (RON)</label>
                        <input type="number" step="0.01" value={editing.cost_price || ""} onChange={(e) => updateField("cost_price", Number(e.target.value))} className={inputClass} />
                      </div>
                      {editing.cost_price > 0 && editing.price > 0 && (
                        <div className="rounded-lg bg-chart-2/10 p-4 flex flex-col justify-center">
                          <p className="text-sm font-semibold text-chart-2">Profit: {(editing.price - editing.cost_price).toFixed(2)} RON</p>
                          <p className="text-xs text-muted-foreground">Marjă: {((1 - editing.cost_price / editing.price) * 100).toFixed(1)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-6 py-4 rounded-b-xl">
              <div className="text-xs text-muted-foreground space-y-0.5">
                {!isNew && editing.created_at && <p>Creat: {new Date(editing.created_at).toLocaleDateString("ro-RO")}</p>}
                {!isNew && editing.updated_at && <p>Actualizat: {new Date(editing.updated_at).toLocaleDateString("ro-RO")}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">Anulează</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isNew ? "Creează Produs" : "Salvează"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
