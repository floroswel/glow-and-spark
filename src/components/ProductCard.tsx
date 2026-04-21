import { useCart, type CartItem } from "@/hooks/useCart";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HighlightText } from "@/components/HighlightText";

interface ProductCardProps {
  id: string;
  slug: string;
  image: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  badgeType?: "sale" | "bestseller" | "limited" | "new";
  searchQuery?: string;
}

export function ProductCard({
  id, slug, image, title, description, price, oldPrice, rating, reviews, badge, badgeType = "new", searchQuery,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const badgeColors: Record<string, string> = {
    sale: "bg-sale text-sale-foreground",
    bestseller: "bg-accent text-accent-foreground",
    limited: "bg-foreground text-primary-foreground",
    new: "bg-chart-2 text-primary-foreground",
  };

  const stars = "★".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "☆" : "");

  const handleAdd = () => {
    addItem({ id, slug, name: title, price, old_price: oldPrice, image_url: image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <Link to="/produs/$slug" params={{ slug }} className="block relative overflow-hidden">
        {badge && (
          <span className={`absolute left-3 top-3 z-10 rounded-md px-2.5 py-1 text-xs font-bold uppercase ${badgeColors[badgeType]}`}>
            {badge}
          </span>
        )}
        <img src={image} alt={title} className="img-zoom aspect-square w-full object-cover" loading="lazy" width={640} height={640} />
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
            {oldPrice && <span className="text-sm text-muted-foreground line-through">{oldPrice} RON</span>}
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
  );
}
