import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquare, Package } from "lucide-react";

export const Route = createFileRoute("/account/reviews")({
  component: AccountReviews,
});

function AccountReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*, products(name, slug, images)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReviews(data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-accent" />
          Recenziile Mele
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toate recenziile tale despre produsele achiziționate.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-foreground">Nicio recenzie încă</p>
          <p className="mt-1 text-sm text-muted-foreground">
            După ce primești o comandă, poți lăsa o recenzie pentru produsele achiziționate.
          </p>
          <Link
            to="/account/orders"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
          >
            <Package className="h-4 w-4" /> Vezi comenzile
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const product = review.products;
            const img = Array.isArray(product?.images) && product.images.length > 0
              ? product.images[0]
              : null;
            return (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-card p-4 flex gap-4"
              >
                {/* Product image */}
                <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                  {img ? (
                    <img src={img} alt={product?.name || ""} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Product name */}
                  {product?.name && (
                    <Link
                      to={`/produs/${product.slug || review.product_id}` as any}
                      className="text-sm font-semibold text-foreground hover:text-accent transition line-clamp-1"
                    >
                      {product.name}
                    </Link>
                  )}

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < (review.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1.5">
                      {new Date(review.created_at).toLocaleDateString("ro-RO")}
                    </span>
                  </div>

                  {/* Review text */}
                  {review.content && (
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
                      {review.content}
                    </p>
                  )}

                  {/* Status badge */}
                  {review.status && review.status !== "approved" && (
                    <span className={`mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      review.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {review.status === "pending" ? "În așteptare" : "Respinsă"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
