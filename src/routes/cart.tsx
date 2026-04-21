import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Coș de cumpărături | Glow & Spark" },
      { name: "description", content: "Coșul tău de cumpărături" },
    ],
  }),
});

function CartPage() {
  const { items, removeItem, updateQuantity, cartSubtotal, shippingCost, freeShippingMin, cartTotal, discountAmount, discountCode, applyDiscount, clearDiscount } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const remaining = Math.max(0, freeShippingMin - cartSubtotal);
  const progressPct = Math.min(100, (cartSubtotal / freeShippingMin) * 100);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponInput.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (!data) {
      setCouponError("Cod invalid sau expirat.");
      setCouponLoading(false);
      return;
    }
    if (data.min_order && cartSubtotal < Number(data.min_order)) {
      setCouponError(`Comanda minimă: ${data.min_order} RON`);
      setCouponLoading(false);
      return;
    }
    if (data.max_uses && (data.uses ?? 0) >= data.max_uses) {
      setCouponError("Cuponul a fost folosit de prea multe ori.");
      setCouponLoading(false);
      return;
    }
    const amount = data.type === "percent" ? (cartSubtotal * Number(data.value)) / 100 : Number(data.value);
    applyDiscount(data.code, Math.min(amount, cartSubtotal));
    setCouponLoading(false);
  };

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-foreground">Coș de cumpărături</h1>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
            <p className="text-lg text-muted-foreground">Coșul tău este gol</p>
            <Link to="/" className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:opacity-90">
              Continuă cumpărăturile
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="h-24 w-24 rounded-lg object-cover" />
                  )}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.price} RON / buc</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-border">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-muted-foreground hover:text-foreground">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-foreground">{(item.price * item.quantity).toFixed(2)} RON</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-4 h-fit space-y-5 rounded-xl border border-border bg-card p-6">
              {/* Free shipping bar */}
              <div>
                {remaining > 0 ? (
                  <p className="mb-2 text-sm text-muted-foreground">
                    Mai adaugă <strong className="text-accent">{remaining.toFixed(0)} RON</strong> pentru livrare gratuită!
                  </p>
                ) : (
                  <p className="mb-2 text-sm font-medium text-chart-2">🚚 Livrare GRATUITĂ!</p>
                )}
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Coupon */}
              {discountCode ? (
                <div className="flex items-center justify-between rounded-lg bg-chart-2/10 px-3 py-2">
                  <span className="text-sm font-medium text-chart-2">🎉 {discountCode} aplicat</span>
                  <button onClick={clearDiscount} className="text-xs text-muted-foreground hover:text-destructive">Șterge</button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Cod voucher" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                    <button onClick={handleApplyCoupon} disabled={couponLoading} className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50">
                      Aplică
                    </button>
                  </div>
                  {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
                </div>
              )}

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{cartSubtotal.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livrare</span>
                  <span className={shippingCost === 0 ? "font-medium text-chart-2" : "text-foreground"}>
                    {shippingCost === 0 ? "GRATUITĂ" : `${shippingCost} RON`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-chart-2">
                    <span>Reducere</span>
                    <span>-{discountAmount.toFixed(2)} RON</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-foreground">{cartTotal.toFixed(2)} RON</span>
                </div>
              </div>

              <Link to="/checkout" className="block w-full rounded-lg bg-accent py-3 text-center font-bold text-accent-foreground transition hover:opacity-90">
                FINALIZEAZĂ COMANDA →
              </Link>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>🔒 Plată securizată</span>
                <span>↩️ Retur 30 zile</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
