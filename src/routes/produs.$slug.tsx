import { createFileRoute, Link } from "@tanstack/react-router";
import { setPageMeta, setCanonical, removeCanonical } from "@/lib/seo";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { ProductCard } from "@/components/ProductCard";
import { RecentlyViewed, addToRecentlyViewed } from "@/components/RecentlyViewed";
import { ForYouRecommendations } from "@/components/ForYouRecommendations";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";
import { TrustBadges } from "@/components/TrustBadges";
import { ChevronRight, Minus, Plus, ShoppingCart, Truck, RotateCcw, Heart, GitCompare, Share2, Star, Shield, Check, X, ChevronLeft, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/produs/$slug")({
  head: () => ({
    meta: [
      { title: "Produs — Lumini.ro" },
      { name: "description", content: "Lumânare artizanală premium din ceară de soia." },
    ],
  }),
  component: ProductPage,
});

function ReviewsTab({ product, reviews, setReviews, avgRating }: { product: any; reviews: any[]; setReviews: (r: any[]) => void; avgRating: number }) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState(profile?.full_name || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} nu este o imagine.`); continue; }
      if (f.size > 2 * 1024 * 1024) { toast.error(`${f.name} depășește 2MB.`); continue; }
      valid.push(f);
    }
    const combined = [...photoFiles, ...valid].slice(0, 3);
    setPhotoFiles(combined);
    setPhotoPreviews(combined.map((f) => URL.createObjectURL(f)));
    if (e.target) e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    const next = photoFiles.filter((_, i) => i !== idx);
    setPhotoFiles(next);
    setPhotoPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const openLightbox = (images: string[], idx: number) => {
    setLightboxImages(images);
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (profile?.full_name && !authorName) setAuthorName(profile.full_name);
  }, [profile]);

  const handleSubmitReview = async () => {
    if (rating === 0) { toast.error("Selectează un rating (1-5 stele)."); return; }
    if (!authorName.trim()) { toast.error("Completează numele."); return; }
    setSubmitting(true);

    // Upload photos
    let photo_urls: string[] = [];
    if (photoFiles.length > 0) {
      for (const file of photoFiles) {
        const path = `${product.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("review-photos").upload(path, file);
        if (upErr) { console.error(upErr); continue; }
        const { data: pubData } = supabase.storage.from("review-photos").getPublicUrl(path);
        if (pubData?.publicUrl) photo_urls.push(pubData.publicUrl);
      }
    }

    const { error } = await supabase.from("product_reviews").insert({
      product_id: product.id,
      user_id: user?.id || null,
      author_name: authorName.trim(),
      rating,
      title: title.trim() || null,
      content: content.trim() || null,
      status: "pending",
      verified_purchase: false,
      photo_urls,
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Eroare la trimiterea recenziei.");
      return;
    }
    toast.success("Recenzia ta a fost trimisă și va fi publicată după moderare.");
    setSubmitted(true);
    setRating(0); setTitle(""); setContent(""); setPhotoFiles([]); setPhotoPreviews([]);
  };

  return (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nu există recenzii încă. Fii primul care lasă o recenzie!</p>
      ) : (
        <>
          {/* Rating summary */}
          <div className="flex items-center gap-6 rounded-xl border border-border bg-card p-5">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} recenzii</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right">{star}</span>
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual reviews */}
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                {review.author_name && <span className="text-xs font-medium text-foreground">{review.author_name}</span>}
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("ro-RO")}
                </span>
              </div>
              {review.title && <p className="font-medium text-foreground text-sm">{review.title}</p>}
              {review.content && <p className="mt-1 text-sm text-muted-foreground">{review.content}</p>}
              {review.photo_urls && (review.photo_urls as string[]).length > 0 && (
                <div className="mt-2 flex gap-2">
                  {(review.photo_urls as string[]).map((url: string, idx: number) => (
                    <button key={idx} onClick={() => openLightbox(review.photo_urls as string[], idx)} className="rounded-md overflow-hidden border border-border hover:border-accent transition">
                      <img src={url} alt={`Foto ${idx + 1}`} className="h-[60px] w-[60px] object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Review form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-heading text-lg font-bold text-foreground mb-4">Lasă o recenzie</h3>
        {!user ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-3">Loghează-te pentru a lăsa o recenzie.</p>
            <Link to="/auth" className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90">
              Autentificare
            </Link>
          </div>
        ) : submitted ? (
          <p className="text-center py-4 text-chart-2 font-medium">✓ Recenzia ta a fost trimisă și va fi publicată după moderare.</p>
        ) : (
          <div className="space-y-4">
            {/* Star selector */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-0.5 transition"
                  >
                    <Star className={`h-7 w-7 transition ${s <= (hoverRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Numele tău *</label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Titlu recenzie</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Rezumat scurt..."
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Recenzie</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Spune-ne părerea ta despre produs..."
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">{content.length}/500</p>
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Se trimite..." : "Trimite recenzia"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const { isFav, toggle: toggleFav } = useFavorites();
  const { has: hasCompare, toggle: toggleCompare } = useCompare();
  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("descriere");
  const [selectedImage, setSelectedImage] = useState("");
  const [added, setAdded] = useState(false);
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const el = addToCartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  // Countdown timer
  useEffect(() => {
    if (!product?.countdown_end) { setCountdown(null); return; }
    const end = new Date(product.countdown_end).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setCountdown(null);
        // Reload product data when countdown expires
        supabase.from("products").select("*, categories!products_category_id_fkey(id, name, slug)").eq("slug", slug).eq("is_active", true).single().then(({ data }) => {
          if (data) setProduct(data);
        });
        return false;
      }
      const s = Math.floor(diff / 1000);
      setCountdown({ d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 });
      return true;
    };
    if (!tick()) return;
    const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000);
    return () => clearInterval(id);
  }, [product?.countdown_end, slug]);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setActiveTab("descriere");
    setSelectedVariant(null);
    supabase
      .from("products")
      .select("*, categories!products_category_id_fkey(id, name, slug)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setProduct(data);
          setSelectedImage(data.image_url || "");
          addToRecentlyViewed(data.id);
          const cat = data.categories as any;
          setCategory(cat);
          // Fetch related, variants, reviews in parallel
          Promise.all([
            cat?.id
              ? supabase.from("products").select("*").eq("is_active", true).eq("category_id", cat.id).neq("id", data.id).limit(4)
              : Promise.resolve({ data: [] }),
            supabase.from("product_variants").select("*").eq("product_id", data.id).eq("is_active", true).order("sort_order"),
            supabase.from("product_reviews").select("*").eq("product_id", data.id).eq("status", "approved").order("created_at", { ascending: false }).limit(20),
          ]).then(([relRes, varRes, revRes]) => {
            setRelated((relRes as any).data || []);
            setVariants((varRes as any).data || []);
            setReviews((revRes as any).data || []);
          });
        }
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (product) {
      setPageMeta({
        title: product.meta_title || product.name,
        description: product.meta_description || product.short_description || "",
        image: product.image_url || undefined,
        price: product.price,
        type: "product",
      });
    }
  }, [product]);

  useEffect(() => {
    setCanonical(window.location.origin + "/produs/" + slug);
    return () => removeCanonical();
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    const galleryImages: string[] = Array.isArray(product.gallery) ? (product.gallery as string[]) : [];
    const images = [product.image_url, ...galleryImages].filter(Boolean);
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.short_description,
      image: images,
      sku: product.sku || product.id,
      brand: { '@type': 'Brand', name: 'Glow & Spark' },
      offers: {
        '@type': 'Offer',
        url: window.location.href,
        priceCurrency: 'RON',
        price: product.price,
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    };
    if (reviews.length > 0) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avg.toFixed(1),
        reviewCount: reviews.length,
      };
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [product, reviews]);

  const handleAddToCart = () => {
    if (!product) return;
    const v = selectedVariant;
    addItem({
      id: product.id,
      slug: product.slug,
      name: v ? `${product.name} — ${v.name}` : product.name,
      price: v?.price || product.price,
      old_price: v?.old_price || product.old_price,
      image_url: v?.image_url || product.image_url,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiat!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <MarqueeBanner /><TopBar /><SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="aspect-square rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-10 w-1/3 rounded bg-muted" />
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <MarqueeBanner /><TopBar /><SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Produsul nu a fost găsit</h1>
          <Link to="/catalog" className="mt-4 inline-block text-accent hover:underline">← Înapoi la catalog</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const gallery: string[] = Array.isArray(product.gallery) ? product.gallery as string[] : [];
  const allImages = [product.image_url, ...gallery].filter(Boolean) as string[];

  const activePrice = selectedVariant?.price || product.price;
  const activeOldPrice = selectedVariant?.old_price || product.old_price;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;

  const stockText = activeStock > 10
    ? `În stoc (${activeStock} buc)`
    : activeStock > 0
      ? "Stoc limitat"
      : "Epuizat";
  const stockColor = activeStock > 10 ? "text-chart-2" : activeStock > 0 ? "text-accent" : "text-destructive";

  const discount = activeOldPrice ? Math.round((1 - activePrice / activeOldPrice) * 100) : 0;

  const badges: { label: string; type: string }[] = [];
  if (product.badge) badges.push({ label: product.badge, type: product.badge_type || "new" });

  const badgeColors: Record<string, string> = {
    sale: "bg-sale text-sale-foreground",
    bestseller: "bg-accent text-accent-foreground",
    limited: "bg-foreground text-primary-foreground",
    new: "bg-chart-2 text-primary-foreground",
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  return (
    <div className="min-h-screen">
      <MarqueeBanner /><TopBar /><SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {category && (
            <>
              <Link to="/categorie/$slug" params={{ slug: category.slug }} className="hover:text-foreground">
                {category.name}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        {/* Product layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-xl border border-border bg-card">
              {badges.map((b, i) => (
                <span key={i} className={`absolute left-3 top-3 z-10 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${badgeColors[b.type] || badgeColors.new}`}>
                  {b.label}
                </span>
              ))}
              {discount > 0 && (
                <span className="absolute right-3 top-3 z-10 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-white">
                  -{discount}%
                </span>
              )}
              <img
                src={selectedImage || "/placeholder.svg"}
                alt={product.name}
                className="aspect-square w-full object-cover"
                width={800}
                height={800}
              />
            </div>
            {allImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`shrink-0 h-20 w-20 overflow-hidden rounded-lg border-2 transition ${selectedImage === img ? "border-accent" : "border-border"}`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{product.name}</h1>
            {product.short_description && (
              <p className="mt-2 text-muted-foreground">{product.short_description}</p>
            )}

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({reviews.length} recenzii)</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              {activeOldPrice && (
                <span className="text-lg text-muted-foreground line-through">{activeOldPrice} RON</span>
              )}
              <span className="text-3xl font-bold text-foreground">{activePrice} RON</span>
            </div>

            {/* Countdown timer */}
            {countdown && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Ofertă expiră în:</span>
                <div className="flex gap-1">
                  {[
                    { val: countdown.d, label: "Z" },
                    { val: countdown.h, label: "O" },
                    { val: countdown.m, label: "M" },
                    { val: countdown.s, label: "S" },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center rounded-md bg-destructive/10 px-2 py-1 min-w-[36px]">
                      <span className="text-sm font-bold tabular-nums text-destructive">{String(val).padStart(2, "0")}</span>
                      <span className="text-[9px] text-destructive/70 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mt-3 flex items-center gap-2">
              <p className={`text-sm font-medium ${stockColor}`}>
                {activeStock > 0 ? "●" : "○"} {stockText}
              </p>
              {activeStock > 0 && activeStock <= 5 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                  </span>
                  Doar {activeStock} {activeStock === 1 ? "bucată rămasă" : "bucăți rămase"}!
                </span>
              )}
            </div>

            {/* SKU & Brand */}
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              {product.sku && <span>SKU: {product.sku}</span>}
              {product.brand && <span>Brand: {product.brand}</span>}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-medium text-foreground mb-2">Variante:</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(selectedVariant?.id === v.id ? null : v);
                        if (v.image_url) setSelectedImage(v.image_url);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        selectedVariant?.id === v.id
                          ? "border-accent bg-accent/15 text-accent font-medium"
                          : "border-border text-foreground hover:border-accent/50"
                      } ${v.stock === 0 ? "opacity-50 line-through" : ""}`}
                      disabled={v.stock === 0}
                    >
                      {v.name}
                      {v.price && v.price !== product.price && (
                        <span className="ml-1 text-xs text-muted-foreground">{v.price} RON</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-border">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(activeStock || 99, q + 1))}
                  className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                ref={addToCartRef}
                onClick={handleAddToCart}
                disabled={activeStock === 0}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  added
                    ? "bg-chart-2 text-primary-foreground"
                    : "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {added ? "✓ Adăugat în coș" : "ADAUGĂ ÎN COȘ"}
              </button>
            </div>

            <TrustBadges variant="compact" />

            {/* Action buttons */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => toggleFav(product.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                  isFav(product.id) ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-950/30 dark:border-red-900" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFav(product.id) ? "fill-current" : ""}`} />
                {isFav(product.id) ? "Favorit" : "Adaugă la favorite"}
              </button>
              <button
                onClick={() => toggleCompare(product.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                  hasCompare(product.id) ? "border-accent bg-accent/15 text-accent" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitCompare className="h-4 w-4" />
                Compară
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Share2 className="h-4 w-4" />
                Distribuie
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <Truck className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs font-medium text-foreground">Livrare 24-48h</p>
                  <p className="text-xs text-muted-foreground">În toată România</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <RotateCcw className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs font-medium text-foreground">Retur gratuit</p>
                  <p className="text-xs text-muted-foreground">30 de zile</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <Shield className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs font-medium text-foreground">Plată securizată</p>
                  <p className="text-xs text-muted-foreground">SSL & GDPR</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <Check className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs font-medium text-foreground">100% Natural</p>
                  <p className="text-xs text-muted-foreground">Ceară de soia pură</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-1 border-b border-border overflow-x-auto">
            {[
              { key: "descriere", label: "Descriere" },
              { key: "ingrediente", label: "Ingrediente" },
              { key: "recenzii", label: `Recenzii (${reviews.length})` },
              { key: "livrare", label: "Livrare & Retur" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition border-b-2 -mb-[1px] ${
                  activeTab === tab.key
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="py-6 text-sm text-muted-foreground leading-relaxed">
            {activeTab === "descriere" && (
              <div className="prose prose-sm max-w-none">
                {product.description ? (
                  product.description.split('\n').map((paragraph: string, i: number) => (
                    <p key={i}>{paragraph}</p>
                  ))
                ) : (
                  <p>Nicio descriere disponibilă.</p>
                )}
              </div>
            )}
            {activeTab === "ingrediente" && (
              <p>Ceară de soia pură, uleiuri esențiale premium, fitil din lemn natural. Fără parafină, fără coloranți artificiali.</p>
            )}
            {activeTab === "recenzii" && (
              <ReviewsTab product={product} reviews={reviews} setReviews={setReviews} avgRating={avgRating} />
            )}
            {activeTab === "livrare" && (
              <div className="space-y-3">
                <p><strong>Livrare:</strong> Comenzile plasate până la ora 14:00 sunt expediate în aceeași zi. Livrare în 24-48h prin Fan Courier, DPD sau Sameday.</p>
                <p><strong>Livrare gratuită:</strong> Pentru comenzi peste 200 RON.</p>
                <p><strong>Retur:</strong> Ai 30 de zile pentru a returna produsul dacă nu ești mulțumit. Produsul trebuie să fie nefolosit și în ambalajul original.</p>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Produse similare</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  image={p.image_url || ""}
                  title={p.name}
                  description={p.short_description || ""}
                  price={p.price}
                  oldPrice={p.old_price}
                  rating={p.rating || 0}
                  reviews={p.reviews_count || 0}
                  badge={p.badge}
                  badgeType={p.badge_type}
                />
              ))}
            </div>
          </div>
        )}

        {/* For You Recommendations */}
        <ForYouRecommendations
          excludeIds={[product.id]}
          categoryId={product.category_id}
        />

        {/* Recently viewed */}
        <RecentlyViewed excludeId={product.id} />
      </div>

      <SiteFooter />
      <WhatsAppButton />
      <BackToTop />

      {/* Sticky bottom bar */}
      {activeStock > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out"
          style={{ transform: showStickyBar ? "translateY(0)" : "translateY(100%)" }}
        >
          <div className="mx-auto w-full max-w-[680px] border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage || product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                width={40}
                height={40}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-sm font-bold text-foreground">{activePrice} RON</p>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-shrink-0 flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Adaugă în coș</span>
                <span className="sm:hidden">Adaugă</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
