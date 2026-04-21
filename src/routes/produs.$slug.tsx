import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/ProductCard";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight, Minus, Plus, ShoppingCart, Truck, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/produs/$slug")({
  head: () => ({
    meta: [
      { title: "Produs — Lumini.ro" },
      { name: "description", content: "Lumânare artizanală premium din ceară de soia." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("descriere");
  const [selectedImage, setSelectedImage] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setActiveTab("descriere");
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
          const cat = data.categories as any;
          setCategory(cat);
          // Fetch related
          if (cat?.id) {
            supabase
              .from("products")
              .select("*")
              .eq("is_active", true)
              .eq("category_id", cat.id)
              .neq("id", data.id)
              .limit(4)
              .then(({ data: rel }) => setRelated(rel || []));
          }
        }
        setLoading(false);
      });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      old_price: product.old_price,
      image_url: product.image_url,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Update page title dynamically
  useEffect(() => {
    if (product) {
      document.title = `${product.meta_title || product.name} — Lumini.ro`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", product.meta_description || product.short_description || "");
    }
  }, [product]);

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

  const stockText = product.stock > 10
    ? `În stoc (${product.stock} buc)`
    : product.stock > 0
      ? "Stoc limitat"
      : "Epuizat";
  const stockColor = product.stock > 10 ? "text-chart-2" : product.stock > 0 ? "text-accent" : "text-destructive";

  const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  const badges: { label: string; type: string }[] = [];
  if (product.badge) badges.push({ label: product.badge, type: product.badge_type || "new" });

  const badgeColors: Record<string, string> = {
    sale: "bg-sale text-sale-foreground",
    bestseller: "bg-accent text-accent-foreground",
    limited: "bg-foreground text-primary-foreground",
    new: "bg-chart-2 text-primary-foreground",
  };

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

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              {product.old_price && (
                <span className="text-lg text-muted-foreground line-through">{product.old_price} RON</span>
              )}
              <span className="text-3xl font-bold text-foreground">{product.price} RON</span>
            </div>

            {/* Stock */}
            <p className={`mt-3 text-sm font-medium ${stockColor}`}>
              {product.stock > 0 ? "●" : "○"} {stockText}
            </p>

            {/* SKU */}
            {product.sku && (
              <p className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</p>
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
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
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
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-1 border-b border-border">
            {[
              { key: "descriere", label: "Descriere" },
              { key: "ingrediente", label: "Ingrediente" },
              { key: "livrare", label: "Livrare & Retur" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium transition border-b-2 -mb-[1px] ${
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
              <div dangerouslySetInnerHTML={{ __html: product.description || "Nicio descriere disponibilă." }} />
            )}
            {activeTab === "ingrediente" && (
              <p>Ceară de soia pură, uleiuri esențiale premium, fitil din lemn natural. Fără parafină, fără coloranți artificiali.</p>
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
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
