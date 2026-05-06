import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HighlightText } from "@/components/HighlightText";
import { Eye, Minus, Plus, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProductCardProps {
  id: string;
  slug: string;
  image: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  /** Omnibus Directive: lowest price in last 30 days. Required to show discount badges/strikethrough. */
  lowestPrice30d?: number | null;
  rating: number;
  reviews: number;
  badge?: string;
  badgeType?: "sale" | "bestseller" | "limited" | "new";
  searchQuery?: string;
}

export function ProductCard({
  id, slug, image, title, description, price, oldPrice, lowestPrice30d, rating, reviews, badge, badgeType = "new", searchQuery,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // Quick view state
  const [qvOpen, setQvOpen] = useState(false);
  const [qvProduct, setQvProduct] = useState<any>(null);
  const [qvVariants, setQvVariants] = useState<any[]>([]);
  const [qvSelectedVariant, setQvSelectedVariant] = useState<any>(null);
  const [qvQuantity, setQvQuantity] = useState(1);
  const [qvAdded, setQvAdded] = useState(false);
  const [qvLoading, setQvLoading] = useState(false);

  const badgeColors: Record<string, string> = {
    sale: "bg-sale text-sale-foreground",
    bestseller: "bg-accent text-accent-foreground",
    limited: "bg-foreground text-primary-foreground",
    new: "bg-chart-2 text-primary-foreground",
  };

  /**
   * Omnibus safety: hide "sale" badges and strikethrough prices unless
   * lowest_price_30d is provided. This prevents Omnibus Directive violations
   * by never showing discount claims without proper price history.
   * [VERIFICARE_AVOCAT]
   */
  const omnibusCompliant = badgeType === "sale" ? lowestPrice30d != null : true;
  const showOldPrice = oldPrice != null && oldPrice > price && lowestPrice30d != null;
  const safeBadge = omnibusCompliant ? badge : undefined;

  const stars = "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "☆" : "");

  const handleAdd = () => {
    addItem({ id, slug, name: title, price, old_price: oldPrice, image_url: image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const openQuickView = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQvOpen(true);
    setQvLoading(true);
    setQvQuantity(1);
    setQvSelectedVariant(null);
    setQvAdded(false);

    const [productRes, variantsRes] = await Promise.all([
      supabase.from("products_public").select("*").eq("slug", slug).eq("is_active", true).single(),
      supabase.from("product_variants").select("*").eq("product_id", id).eq("is_active", true).order("sort_order"),
    ]);

    setQvProduct(productRes.data);
    setQvVariants(variantsRes.data || []);
    setQvLoading(false);
  };

  const qvActivePrice = qvSelectedVariant?.price || qvProduct?.price || price;
  const qvActiveOldPrice = qvSelectedVariant?.old_price || qvProduct?.old_price || oldPrice;
  const qvActiveStock = qvSelectedVariant ? qvSelectedVariant.stock : (qvProduct?.stock ?? 0);

  const handleQvAdd = () => {
    if (!qvProduct) return;
    const v = qvSelectedVariant;
    addItem({
      id: qvProduct.id,
      slug: qvProduct.slug,
      name: v ? `${qvProduct.name} — ${v.name}` : qvProduct.name,
      price: v?.price || qvProduct.price,
      old_price: v?.old_price || qvProduct.old_price,
      image_url: v?.image_url || qvProduct.image_url,
    }, qvQuantity);
    setQvAdded(true);
    setTimeout(() => setQvAdded(false), 2000);
  };

  return (
    <>
      <div
        className="group overflow-hidden rounded-xl border border-border bg-card transition hover:brightness-[1.02]"
        style={{ boxShadow: "var(--product-card-shadow, 0 1px 2px 0 rgb(0 0 0 / 0.05))" }}
      >
        <Link to="/produs/$slug" params={{ slug }} className="block relative overflow-hidden">
          {safeBadge && (
            <span className={`absolute left-3 top-3 z-10 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${badgeColors[badgeType]}`}>
              {safeBadge}
            </span>
          )}
          <img src={image} alt={title} className="img-zoom aspect-square w-full object-cover" loading="lazy" width={640} height={640} />
          {/* Quick View button */}
          <button
            onClick={openQuickView}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border px-3 py-2 text-xs font-semibold text-foreground opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-accent hover:text-accent-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
            Vizualizare rapidă
          </button>
        </Link>
        <div className="p-4">
          <Link to="/produs/$slug" params={{ slug }} className="hover:text-accent transition">
            <h3 className="font-heading text-sm font-semibold leading-snug text-foreground">
              {searchQuery ? <HighlightText text={title} query={searchQuery} /> : title}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {searchQuery ? <HighlightText text={description} query={searchQuery} /> : description}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-sm text-accent">{stars}</span>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {showOldPrice && <span className="text-sm text-muted-foreground line-through">{oldPrice} RON</span>}
              <span className="text-lg font-bold text-foreground">{price} RON</span>
            </div>
            <button
              onClick={handleAdd}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${added ? "bg-chart-2 text-primary-foreground" : "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              {added ? "✓ Adăugat" : "Adaugă"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Dialog */}
      <Dialog open={qvOpen} onOpenChange={setQvOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{qvProduct?.name || title}</DialogTitle>
            <DialogDescription className="sr-only">Vizualizare rapidă produs</DialogDescription>
          </DialogHeader>

          {qvLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          ) : qvProduct ? (
            <div className="space-y-4">
              {/* Image */}
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={qvProduct.image_url || image}
                  alt={qvProduct.name}
                  className="aspect-square w-full object-cover"
                  width={500}
                  height={500}
                />
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {qvActiveOldPrice && lowestPrice30d != null && (
                  <span className="text-base text-muted-foreground line-through">{qvActiveOldPrice} RON</span>
                )}
                <span className="text-2xl font-bold text-foreground">{qvActivePrice} RON</span>
              </div>

              {/* Stock badge */}
              <p className={`text-sm font-medium ${
                qvActiveStock > 10 ? "text-chart-2" : qvActiveStock > 0 ? "text-accent" : "text-destructive"
              }`}>
                {qvActiveStock > 10
                  ? `● În stoc (${qvActiveStock} buc)`
                  : qvActiveStock > 0
                    ? "● Stoc limitat"
                    : "○ Epuizat"}
              </p>

              {/* Short description */}
              {qvProduct.short_description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{qvProduct.short_description}</p>
              )}

              {/* Variants */}
              {qvVariants.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Variante:</h4>
                  <div className="flex flex-wrap gap-2">
                    {qvVariants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setQvSelectedVariant(qvSelectedVariant?.id === v.id ? null : v)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          qvSelectedVariant?.id === v.id
                            ? "border-accent bg-accent/15 text-accent font-medium"
                            : "border-border text-foreground hover:border-accent/50"
                        } ${v.stock === 0 ? "opacity-50 line-through" : ""}`}
                        disabled={v.stock === 0}
                      >
                        {v.name}
                        {v.price && v.price !== qvProduct.price && (
                          <span className="ml-1 text-xs text-muted-foreground">{v.price} RON</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    onClick={() => setQvQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-foreground">{qvQuantity}</span>
                  <button
                    onClick={() => setQvQuantity((q) => Math.min(qvActiveStock || 99, q + 1))}
                    className="px-3 py-2.5 text-muted-foreground hover:text-foreground transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleQvAdd}
                  disabled={qvActiveStock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50 ${
                    qvAdded
                      ? "bg-chart-2 text-primary-foreground"
                      : "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {qvAdded ? "✓ Adăugat în coș" : "Adaugă în coș"}
                </button>
              </div>

              {/* Full page link */}
              <Link
                to="/produs/$slug"
                params={{ slug }}
                onClick={() => setQvOpen(false)}
                className="block text-center text-sm font-medium text-accent hover:underline"
              >
                Vezi pagina completă →
              </Link>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
