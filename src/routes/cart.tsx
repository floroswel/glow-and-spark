import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, RotateCcw, Truck, Tag, Gift, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "Coș de cumpărături | Mama Lucica" },
      { name: "description", content: "Coșul tău de cumpărături — Mama Lucica." },
    ],
  }),
});

function CartPage() {
  const { items, removeItem, updateQuantity, cartSubtotal, shippingCost, freeShippingMin, cartTotal, discountAmount, discountCode, applyDiscount, clearDiscount } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError("Cuponul a expirat.");
      setCouponLoading(false);
      return;
    }
    if ((data as any).starts_at && new Date((data as any).starts_at) > new Date()) {
      setCouponError("Cuponul nu este încă activ.");
      setCouponLoading(false);
      return;
    }
    const amount = data.type === "percent" ? (cartSubtotal * Number(data.value)) / 100 : Number(data.value);
    applyDiscount(data.code, Math.min(amount, cartSubtotal));
    try {
      await supabase.from("coupons").update({ uses: (data.uses || 0) + 1 }).eq("id", data.id);
    } catch {}
    setCouponLoading(false);
  };

  const handleRemoveWithAnimation = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeItem(id);
      setRemovingId(null);
    }, 300);
  };

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition">Acasă</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Coș de cumpărături</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Coș de cumpărături
            {items.length > 0 && (
              <span className="ml-2 text-lg font-normal text-muted-foreground">
                ({items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? "produs" : "produse"})
              </span>
            )}
          </h1>
          {items.length > 0 && (
            <Link to="/" className="text-sm text-accent hover:underline flex items-center gap-1">
              ← Continuă cumpărăturile
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Coșul tău este gol</h2>
            <p className="text-muted-foreground max-w-md">Nu ai adăugat niciun produs. Explorează catalogul nostru și descoperă produse de calitate!</p>
            <Link to="/" className="rounded-lg bg-accent px-8 py-3 font-semibold text-accent-foreground transition hover:opacity-90 flex items-center gap-2">
              Explorează produsele <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                <div className="col-span-6">Produs</div>
                <div className="col-span-2 text-center">Preț</div>
                <div className="col-span-2 text-center">Cantitate</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {items.map((item) => {
                const lineTotal = item.price * item.quantity;
                const isRemoving = removingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border border-border bg-card p-4 transition-all duration-300 ${
                      isRemoving ? "opacity-0 scale-95 -translate-x-4" : "opacity-100"
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Product info */}
                      <div className="col-span-12 sm:col-span-6 flex gap-4">
                        {item.image_url ? (
                          <Link to="/product/$slug" params={{ slug: (item as any).slug || item.id }}>
                            <img src={item.image_url} alt={item.name} className="h-20 w-20 rounded-lg object-cover border border-border hover:border-accent transition" />
                          </Link>
                        ) : (
                          <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex flex-col justify-between min-w-0">
                          <div>
                            <Link to="/product/$slug" params={{ slug: (item as any).slug || item.id }} className="font-semibold text-foreground hover:text-accent transition line-clamp-2">
                              {item.name}
                            </Link>
                          </div>
                          <button
                            onClick={() => handleRemoveWithAnimation(item.id)}
                            className="self-start flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition mt-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Șterge
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-4 sm:col-span-2 text-center">
                        <span className="text-sm font-medium text-foreground">{item.price.toFixed(2)} lei</span>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2 flex justify-center">
                        <div className="inline-flex items-center rounded-lg border border-border bg-background">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition rounded-l-lg"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 py-1.5 text-sm font-semibold min-w-[40px] text-center border-x border-border">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition rounded-r-lg"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="col-span-4 sm:col-span-2 text-right">
                        <span className="text-base font-bold text-foreground">{lineTotal.toFixed(2)} lei</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Stock warning */}
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Produsele din coș nu sunt rezervate. Finalizează comanda cât mai curând pentru a-ți asigura disponibilitatea.</span>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-4 h-fit space-y-5 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">Sumar comandă</h2>

              {/* Free shipping bar */}
              <div className="rounded-lg bg-secondary/50 p-3">
                {remaining > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Mai adaugă <strong className="text-accent">{remaining.toFixed(0)} lei</strong> pentru livrare gratuită
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-600">✓ Livrare GRATUITĂ!</p>
                  </div>
                )}
              </div>

              {/* Coupon */}
              {discountCode ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <Tag className="h-3.5 w-3.5" /> {discountCode} aplicat
                  </span>
                  <button onClick={clearDiscount} className="text-xs text-muted-foreground hover:text-destructive transition">✕ Șterge</button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cod de reducere</label>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="Introdu codul"
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none bg-background"
                    />
                    <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()} className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50">
                      Aplică
                    </button>
                  </div>
                  {couponError && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {couponError}</p>}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} produse)</span>
                  <span className="text-foreground font-medium">{cartSubtotal.toFixed(2)} lei</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livrare</span>
                  <span className={shippingCost === 0 ? "font-semibold text-emerald-600" : "text-foreground font-medium"}>
                    {shippingCost === 0 ? "GRATUITĂ" : `${shippingCost.toFixed(2)} lei`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Reducere</span>
                    <span className="font-medium">-{discountAmount.toFixed(2)} lei</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">{cartTotal.toFixed(2)} lei</span>
                </div>
              </div>

              <Link to="/checkout" className="block w-full rounded-lg bg-accent py-3.5 text-center font-bold text-accent-foreground transition hover:opacity-90 text-base">
                FINALIZEAZĂ COMANDA →
              </Link>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="flex flex-col items-center gap-1 text-center">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground leading-tight">Plată<br/>securizată</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground leading-tight">Retur<br/>30 zile</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground leading-tight">Livrare<br/>rapidă</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
