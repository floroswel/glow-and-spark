import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useState, useEffect } from "react";
import { trackBeginCheckout } from "@/lib/gtm";
import { trackInitiateCheckout } from "@/lib/fbpixel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Switch } from "@/components/ui/switch";
import { attributeOrderToAffiliate } from "@/lib/affiliate-tracker";
import { TrustBadges } from "@/components/TrustBadges";
import { MapPin, Gift, Search, Loader2, Check, X } from "lucide-react";
import { sanitizeText, sanitizePhone, sanitizeEmail } from "@/lib/sanitize";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Finalizare comandă | Mama Lucica" },
      { name: "description", content: "Finalizează comanda ta — lumânări artizanale Mama Lucica." },
    ],
  }),
});

const JUDETE = [
  "Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brașov",
  "Brăila","București","Buzău","Caraș-Severin","Călărași","Cluj","Constanța",
  "Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara",
  "Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt",
  "Prahova","Satu Mare","Sălaj","Sibiu","Suceava","Teleorman","Timiș","Tulcea",
  "Vaslui","Vâlcea","Vrancea"
];

function CheckoutPage() {
  const { items, cartSubtotal, shippingCost, discountAmount, discountCode, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { general } = useSiteSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [billingType, setBillingType] = useState<"individual" | "company">("individual");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  // Loyalty / Wallet / Group discount
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyInput, setLoyaltyInput] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [groupDiscount, setGroupDiscount] = useState(0);

  // Fetch loyalty, wallet, group discount for logged-in users
  useEffect(() => {
    if (!user) return;
    (async () => {
      // Loyalty points
      const { data: pts } = await (supabase.from("user_points" as any).select("balance").eq("user_id", user.id).maybeSingle() as any);
      if (pts) { setLoyaltyBalance(pts.balance); setLoyaltyPoints(pts.balance); }
      // Wallet
      const { data: w } = await (supabase.from("customer_wallets" as any).select("balance").eq("user_id", user.id).maybeSingle() as any);
      if (w) setWalletBalance(Number(w.balance) || 0);
      // Group discount
      const { data: gd } = await supabase.rpc("get_user_group_discount" as any, { p_user_id: user.id });
      if (gd && Number(gd) > 0) setGroupDiscount(Number(gd));
    })();
  }, [user]);

  const groupDiscountAmount = groupDiscount > 0 ? Math.round(cartSubtotal * groupDiscount / 100 * 100) / 100 : 0;
  const loyaltyDiscount = useLoyalty && loyaltyInput ? Math.min(Number(loyaltyInput), loyaltyBalance) / 100 : 0;
  const walletPayment = useWallet ? Math.min(walletBalance, 0) : 0; // calculated below

  const giftWrappingPrice = Number(general?.gift_wrapping_price) || 15;
  const subtotalAfterGroupDiscount = cartSubtotal - groupDiscountAmount;
  const preWalletTotal = subtotalAfterGroupDiscount + shippingCost - discountAmount - loyaltyDiscount + (giftWrapping ? giftWrappingPrice : 0);
  const walletDeduction = useWallet ? Math.min(walletBalance, Math.max(preWalletTotal, 0)) : 0;
  const finalTotal = Math.max(preWalletTotal - walletDeduction, 0);

  // Saved addresses
  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(items, cartTotal);
      trackInitiateCheckout(items, cartTotal);
    }
  }, []);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState(!!user);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", judet: "", localitate: "", adresa: "", codPostal: "", observatii: "",
    companyName: "", companyCui: "", companyReg: "",
    paymentMethod: "ramburs",
    acceptTerms: false, acceptGdpr: false,
  });
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const u = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const [cuiLookup, setCuiLookup] = useState<{ loading: boolean; status: "idle" | "success" | "error"; message: string }>({ loading: false, status: "idle", message: "" });

  const lookupCui = async () => {
    const cleanCui = form.companyCui.replace(/\D/g, "");
    if (cleanCui.length < 6) {
      setCuiLookup({ loading: false, status: "error", message: "CUI invalid sau negăsit în ANAF" });
      return;
    }
    setCuiLookup({ loading: true, status: "idle", message: "" });
    try {
      const { data, error } = await supabase.functions.invoke("anaf-lookup", { body: { cui: cleanCui } });
      if (error || !data?.valid) {
        setCuiLookup({ loading: false, status: "error", message: "CUI invalid sau negăsit în ANAF" });
        return;
      }
      setForm((p) => ({ ...p, companyName: data.denumire || p.companyName, companyReg: data.numar_reg || p.companyReg }));
      setCuiLookup({ loading: false, status: "success", message: data.denumire || "Firmă găsită" });
    } catch {
      setCuiLookup({ loading: false, status: "error", message: "CUI invalid sau negăsit în ANAF" });
    }
  };

  // Fetch saved addresses for logged-in users
  useEffect(() => {
    if (!user) return;
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSavedAddresses(data);
          // Auto-select default address
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          if (defaultAddr) {
            selectAddress(defaultAddr);
            setSelectedAddressId(defaultAddr.id);
          }
        }
      });
    // Pre-fill email from auth
    if (user.email) u("email", user.email);
  }, [user]);

  const selectAddress = (addr: any) => {
    setForm((prev) => ({
      ...prev,
      name: addr.full_name || prev.name,
      phone: addr.phone || prev.phone,
      judet: addr.county || prev.judet,
      localitate: addr.city || prev.localitate,
      adresa: addr.address || prev.adresa,
      codPostal: addr.postal_code || prev.codPostal,
    }));
  };

  const handleAddressSelect = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === "") return;
    const addr = savedAddresses.find((a) => a.id === addrId);
    if (addr) selectAddress(addr);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <MarqueeBanner /><TopBar /><SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Coșul tău este gol.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const validateStep1 = () => {
    if (!form.name || !form.email || !form.phone || !form.judet || !form.localitate || !form.adresa) {
      setError("Completează toate câmpurile obligatorii.");
      return false;
    }
    if (billingType === "company" && (!form.companyName || !form.companyCui)) {
      setError("Completează datele firmei.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!form.acceptTerms || !form.acceptGdpr) {
      setError("Trebuie să accepți termenii și politica de confidențialitate.");
      return;
    }
    setSubmitting(true);
    setError("");

    const orderId = crypto.randomUUID();
    // Generate ML + 5 random digits via DB function (guarantees uniqueness)
    let orderNumber = `ML${Math.floor(10000 + Math.random() * 90000)}`;
    try {
      const { data: genNum } = await supabase.rpc("generate_order_number" as any);
      if (genNum && typeof genNum === "string") orderNumber = genNum;
    } catch {
      // fallback to client-generated number above
    }
    const orderData = {
      id: orderId,
      order_number: orderNumber,
      customer_name: sanitizeText(form.name),
      customer_email: sanitizeEmail(form.email),
      customer_phone: sanitizePhone(form.phone),
      shipping_address: sanitizeText(form.adresa),
      city: sanitizeText(form.localitate),
      county: form.judet,
      postal_code: form.codPostal,
      billing_type: billingType,
      company_name: billingType === "company" ? sanitizeText(form.companyName) : null,
      company_cui: billingType === "company" ? form.companyCui : null,
      company_reg: billingType === "company" ? form.companyReg : null,
      items: items.map((i) => ({ id: i.id, product_id: i.id, name: i.name, price: i.price, quantity: i.quantity, qty: i.quantity, image: i.image_url })),
      subtotal: cartSubtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount + groupDiscountAmount + loyaltyDiscount,
      discount_code: discountCode,
      total: finalTotal,
      payment_method: form.paymentMethod,
      notes: form.observatii ? sanitizeText(form.observatii) : null,
      status: "pending",
      payment_status: "pending",
      user_id: user?.id || null,
      gift_wrapping: giftWrapping,
      gift_message: giftWrapping ? giftMessage || null : null,
    };

    const { error: dbError } = await supabase.from("orders").insert(orderData);
    if (dbError) {
      if (import.meta.env.DEV) console.error("[checkout] Order insert failed:", dbError.code);
      setError("Eroare la plasarea comenzii. Încearcă din nou sau contactează-ne.");
      setSubmitting(false);
      return;
    }

    // Save address if checked
    if (saveAddress && user) {
      supabase.from("addresses").insert({
        user_id: user.id,
        full_name: form.name,
        phone: form.phone,
        county: form.judet,
        city: form.localitate,
        address: form.adresa,
        postal_code: form.codPostal,
        label: "Checkout",
        is_default: savedAddresses.length === 0,
      }).then(() => {});
    }

    // Fire-and-forget email notification
    supabase.functions.invoke('send-email', {
      body: {
        type: 'order_confirmation',
        to: orderData.customer_email,
        data: {
          orderNumber: orderData.order_number,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          items: orderData.items,
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shipping_cost,
          discount_amount: orderData.discount_amount,
          total: orderData.total,
          shipping_address: orderData.shipping_address,
          city: orderData.city,
          county: orderData.county,
          postal_code: orderData.postal_code,
          customer_phone: orderData.customer_phone,
        },
      },
    }).catch(() => {});

    // Decrement stock for each item
    for (const item of items) {
      try {
        await supabase.rpc('decrement_stock', { p_product_id: item.id, p_quantity: item.quantity });
      } catch {}
    }

    // Deduct gift card balance via atomic RPC (uses gift_cards table + transactions log)
    try {
      const gcCode = sessionStorage.getItem("gift_card_code");
      const gcAmount = parseFloat(sessionStorage.getItem("gift_card_amount") || "0");
      if (gcCode && gcAmount > 0) {
        await supabase.rpc("redeem_gift_card", {
          p_code: gcCode,
          p_amount: gcAmount,
          p_order_id: orderId,
        });
        sessionStorage.removeItem("gift_card_code");
        sessionStorage.removeItem("gift_card_amount");
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error("[checkout] gift card redemption failed");
    }

    // Redeem loyalty points
    if (useLoyalty && loyaltyInput && Number(loyaltyInput) > 0 && user?.id) {
      try {
        await supabase.rpc("redeem_loyalty_points" as any, {
          p_user_id: user.id,
          p_points: Math.min(Number(loyaltyInput), loyaltyBalance),
          p_order_id: orderId,
        });
      } catch { /* silent in production */ }
    }

    // Charge wallet
    if (useWallet && walletDeduction > 0 && user?.id) {
      try {
        await supabase.rpc("charge_wallet" as any, {
          p_user_id: user.id,
          p_amount: walletDeduction,
          p_order_id: orderId,
        });
      } catch { /* silent in production */ }
    }

    // Affiliate attribution
    attributeOrderToAffiliate(orderId).catch(() => {});

    if (newsletterOptIn && form.email) {
      supabase.from("newsletter_subscribers").upsert(
        { email: form.email, name: form.name, is_active: true, source: "checkout" },
        { onConflict: "email", ignoreDuplicates: true }
      ).then(() => {});
    }

    if (user?.id) {
      supabase.from("user_notifications").insert({
        user_id: user.id,
        title: "Comandă plasată",
        message: `Comanda #${orderData.order_number} a fost plasată cu succes. Total: ${orderData.total} RON`,
        type: "order",
        link: "/account/orders",
        is_read: false,
      }).then(() => {});
    }

    // If card payment, initiate Netopia and redirect to payment page
    if (form.paymentMethod === "card") {
      const payloadBody = {
        orderId,
        amount: finalTotal,
        currency: "RON",
        returnUrl: `${window.location.origin}/order-confirmed/${orderId}`,
        cancelUrl: `${window.location.origin}/checkout`,
        customerData: {
          email: orderData.customer_email,
          phone: orderData.customer_phone,
          firstName: orderData.customer_name?.split(" ")[0] || "",
          lastName: orderData.customer_name?.split(" ").slice(1).join(" ") || "-",
          city: orderData.city,
          county: orderData.county,
          postalCode: orderData.postal_code,
          address: orderData.shipping_address,
        },
      };
      // Payment payload logged only in dev for debugging
      if (import.meta.env.DEV) console.log("[checkout][netopia] Invoking netopia-payment");
      try {
        const t0 = Date.now();
        const { data: payData, error: payErr } = await supabase.functions.invoke("netopia-payment", {
          body: payloadBody,
        });
        const elapsed = Date.now() - t0;
        if (import.meta.env.DEV) console.log(`[checkout][netopia] Response in ${elapsed}ms`);

        if (payErr) {
          // Try to extract the response body from FunctionsHttpError
          let serverDetails: any = null;
          try {
            const ctx = (payErr as any).context;
            if (ctx && typeof ctx.json === "function") {
              serverDetails = await ctx.json();
            } else if (ctx && typeof ctx.text === "function") {
              serverDetails = await ctx.text();
            }
          } catch {
            // Silent — context parsing failure is not actionable
          }
          if (import.meta.env.DEV) {
            console.error("[checkout][netopia] Edge function error:", { name: payErr.name, message: payErr.message });
          }
          const debug = JSON.stringify(
            {
              step: "netopia-invoke",
              error: payErr.message || String(payErr),
              serverDetails,
              orderId,
              amount: finalTotal,
            },
            null,
            2
          );
          setDebugInfo(debug);
          setError(
            `Plata cu cardul a eșuat: ${
              (serverDetails && (serverDetails.error || serverDetails.details)) ||
              payErr.message ||
              "eroare necunoscută"
            }`
          );
          setSubmitting(false);
          return;
        }
        if (!payData?.paymentUrl) {
          if (import.meta.env.DEV) console.error("[checkout][netopia] Missing paymentUrl in response");
          setDebugInfo(JSON.stringify({ step: "missing-payment-url", payData }, null, 2));
          setError("Răspunsul Netopia nu conține URL de plată. Verifică logurile.");
          setSubmitting(false);
          return;
        }
        if (import.meta.env.DEV) console.log("[checkout][netopia] Redirecting to payment page");
        clearCart();
        window.location.href = payData.paymentUrl;
        return;
      } catch (e: any) {
        if (import.meta.env.DEV) console.error("[checkout][netopia] Exception:", e?.name);
        setDebugInfo(
          JSON.stringify(
            {
              step: "exception",
              name: e?.name,
              message: e?.message || String(e),
              stack: e?.stack,
            },
            null,
            2
          )
        );
        setError(`Eroare la inițierea plății: ${e?.message || String(e)}`);
        setSubmitting(false);
        return;
      }
    }

    clearCart();
    navigate({ to: "/order-confirmed/$orderId", params: { orderId } });
  };

  const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none";

  return (
    <div className="min-h-screen">
      <MarqueeBanner /><TopBar /><SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-foreground">Finalizare Comandă</h1>

        {/* Steps indicator */}
        <div className="mt-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{s}</div>
              <span className={`text-sm ${step >= s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s === 1 ? "Date livrare" : s === 2 ? "Plată" : "Confirmare"}
              </span>
              {s < 3 && <div className={`h-0.5 w-8 ${step > s ? "bg-accent" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {error && <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}
        {debugInfo && (
          <details className="mt-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-xs">
            <summary className="cursor-pointer font-medium text-muted-foreground">🔍 Detalii debug (Netopia)</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[11px] text-foreground">{debugInfo}</pre>
          </details>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6 rounded-xl border border-border bg-card p-6">

                {/* Saved addresses dropdown */}
                {user && savedAddresses.length > 0 && (
                  <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="text-sm font-semibold text-foreground">Adrese salvate</span>
                      </div>
                      <Link to="/account/addresses" className="text-xs text-accent hover:underline">Gestionează adresele →</Link>
                    </div>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => handleAddressSelect(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">— Completează manual —</option>
                      {savedAddresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label ? `${a.label} — ` : ""}{a.full_name}, {a.address}, {a.city}, {a.county}
                          {a.is_default ? " ★" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setBillingType("individual")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${billingType === "individual" ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Persoană Fizică</button>
                  <button onClick={() => setBillingType("company")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${billingType === "company" ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Persoană Juridică</button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-muted-foreground">Nume complet *</label><input value={form.name} onChange={(e) => u("name", e.target.value)} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label><input type="email" value={form.email} onChange={(e) => u("email", e.target.value)} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Telefon *</label><input value={form.phone} onChange={(e) => u("phone", e.target.value)} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Județ *</label>
                    <select value={form.judet} onChange={(e) => u("judet", e.target.value)} className={inputClass}>
                      <option value="">Alege județul</option>
                      {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Localitate *</label><input value={form.localitate} onChange={(e) => u("localitate", e.target.value)} className={inputClass} /></div>
                  <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-muted-foreground">Adresă (stradă, număr) *</label><input value={form.adresa} onChange={(e) => u("adresa", e.target.value)} className={inputClass} /></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Cod poștal</label><input value={form.codPostal} onChange={(e) => u("codPostal", e.target.value)} className={inputClass} /></div>
                </div>

                {/* Save address checkbox */}
                {user && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="accent-accent"
                    />
                    Salvează această adresă pentru comenzi viitoare
                  </label>
                )}

                {billingType === "company" && (
                  <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
                    <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-muted-foreground">Denumire firmă *</label><input value={form.companyName} onChange={(e) => u("companyName", e.target.value)} className={inputClass} /></div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">CUI *</label>
                      <div className="flex gap-2">
                        <input
                          value={form.companyCui}
                          onChange={(e) => { u("companyCui", e.target.value); setCuiLookup({ loading: false, status: "idle", message: "" }); }}
                          className={inputClass}
                          placeholder="ex: 43025661"
                        />
                        <button
                          type="button"
                          onClick={lookupCui}
                          disabled={cuiLookup.loading || form.companyCui.replace(/\D/g, "").length < 6}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                        >
                          {cuiLookup.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                          Verifică
                        </button>
                      </div>
                      {cuiLookup.status === "success" && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[oklch(0.55_0.15_145)]"><Check className="h-3.5 w-3.5" />{cuiLookup.message}</p>
                      )}
                      {cuiLookup.status === "error" && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><X className="h-3.5 w-3.5" />{cuiLookup.message}</p>
                      )}
                    </div>
                    <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Nr. Registru Comerțului</label><input value={form.companyReg} onChange={(e) => u("companyReg", e.target.value)} className={inputClass} /></div>
                  </div>
                )}

                <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Observații</label><textarea value={form.observatii} onChange={(e) => u("observatii", e.target.value)} rows={2} className={inputClass} /></div>

                {/* Gift wrapping */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-foreground">Ambalaj cadou</span>
                      <span className="text-xs text-muted-foreground">(+{giftWrappingPrice} RON)</span>
                    </div>
                    <Switch checked={giftWrapping} onCheckedChange={setGiftWrapping} />
                  </div>
                  {giftWrapping && (
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value.slice(0, 150))}
                      maxLength={150}
                      rows={2}
                      placeholder="Mesaj pentru card cadou..."
                      className={inputClass}
                    />
                  )}
                </div>

                <button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full rounded-lg bg-accent py-3 font-bold text-accent-foreground transition hover:opacity-90">
                  Continuă → Metodă de plată
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="font-heading text-lg font-bold text-foreground">Metodă de plată</h2>
                {[
                  { value: "ramburs", label: "Ramburs", desc: "Plătești la livrare" },
                  { value: "card", label: "Card online", desc: "Netopia Payments" },
                  { value: "transfer", label: "Transfer bancar", desc: "Plată prin ordin de plată" },
                ].map((m) => (
                  <label key={m.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${form.paymentMethod === m.value ? "border-accent bg-accent/5" : "border-border"}`}>
                    <input type="radio" name="payment" value={m.value} checked={form.paymentMethod === m.value} onChange={(e) => u("paymentMethod", e.target.value)} className="accent-accent" />
                    <div>
                      <p className="font-medium text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </label>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="rounded-lg border border-border px-6 py-3 font-medium text-muted-foreground transition hover:bg-secondary">← Înapoi</button>
                  <button onClick={() => setStep(3)} className="flex-1 rounded-lg bg-accent py-3 font-bold text-accent-foreground transition hover:opacity-90">Continuă → Confirmare</button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="font-heading text-lg font-bold text-foreground">Rezumat comandă</h2>
                <div className="space-y-2 rounded-lg bg-secondary p-4">
                  <p className="text-sm"><strong>Client:</strong> {form.name} ({form.email})</p>
                  <p className="text-sm"><strong>Telefon:</strong> {form.phone}</p>
                  <p className="text-sm"><strong>Adresă:</strong> {form.adresa}, {form.localitate}, {form.judet} {form.codPostal}</p>
                  <p className="text-sm"><strong>Plată:</strong> {form.paymentMethod === "ramburs" ? "Ramburs" : form.paymentMethod === "card" ? "Card online" : "Transfer bancar"}</p>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} RON</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={form.acceptTerms} onChange={(e) => u("acceptTerms", e.target.checked)} className="mt-0.5 accent-accent" />
                    <span>
                      Am citit și accept{" "}
                      <Link to="/termeni-si-conditii" target="_blank" className="text-accent underline">Termenii și condițiile</Link>
                      {" "}și{" "}
                      <Link to="/politica-confidentialitate" target="_blank" className="text-accent underline">Politica de confidențialitate</Link> *
                    </span>
                  </label>
                  <p className="text-[11px] text-muted-foreground ml-6">
                    Obligatoriu — necesar pentru procesarea comenzii și livrarea produselor.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer pt-1">
                    <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} className="w-4 h-4 rounded border-border accent-accent" />
                    <span className="text-sm text-muted-foreground">Doresc să primesc oferte și noutăți pe email (opțional)</span>
                  </label>
                  <div className="rounded-lg bg-secondary/50 border border-border p-3 space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      🔒 Conexiune securizată SSL pentru protecția datelor tale.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ↩️ Ai dreptul de retragere în <strong>14 zile calendaristice</strong> de la primirea produsului — detalii în{" "}
                      <Link to="/politica-returnare" className="text-accent underline hover:opacity-80">Politica de returnare</Link>.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      📞 Asistență: <strong>contact@mamalucica.ro</strong> • Luni–Vineri 09:00–17:00
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(2)} className="rounded-lg border border-border px-6 py-3 font-medium text-muted-foreground transition hover:bg-secondary">← Înapoi</button>
                  <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg bg-accent py-3 font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-50">
                    {submitting ? "Se plasează..." : "PLASEAZĂ COMANDA"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="h-fit space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading font-bold text-foreground">Comanda ta</h3>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.image_url && <img src={item.image_url} alt={item.name} loading="lazy" className="h-12 w-12 rounded-lg object-cover" />}
                <div className="flex-1 text-sm">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-muted-foreground">×{item.quantity}</p>
                </div>
                <span className="text-sm font-medium">{(item.price * item.quantity).toFixed(2)} RON</span>
              </div>
            ))}
            <div className="space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{cartSubtotal.toFixed(2)} RON</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Livrare</span><span>{shippingCost === 0 ? "GRATUITĂ" : `${shippingCost} RON`}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-chart-2"><span>Reducere cupon</span><span>-{discountAmount.toFixed(2)} RON</span></div>}
              {groupDiscountAmount > 0 && <div className="flex justify-between text-chart-2"><span>Discount grup (-{groupDiscount}%)</span><span>-{groupDiscountAmount.toFixed(2)} RON</span></div>}
              {loyaltyDiscount > 0 && <div className="flex justify-between text-chart-2"><span>Puncte fidelitate</span><span>-{loyaltyDiscount.toFixed(2)} RON</span></div>}
              {walletDeduction > 0 && <div className="flex justify-between text-chart-2"><span>Portofel</span><span>-{walletDeduction.toFixed(2)} RON</span></div>}
              {giftWrapping && <div className="flex justify-between"><span className="text-muted-foreground">Ambalaj cadou</span><span>{giftWrappingPrice.toFixed(2)} RON</span></div>}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span>{finalTotal.toFixed(2)} RON</span></div>
            </div>

            {/* Loyalty points */}
            {user && loyaltyBalance > 0 && (
              <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={useLoyalty} onChange={(e) => { setUseLoyalty(e.target.checked); if (!e.target.checked) setLoyaltyInput(""); }} className="accent-accent" />
                  <span className="text-foreground font-medium">Folosește puncte ({loyaltyBalance} disponibile = {(loyaltyBalance / 100).toFixed(2)} RON)</span>
                </label>
                {useLoyalty && (
                  <input
                    type="number"
                    min={100}
                    max={loyaltyBalance}
                    step={100}
                    value={loyaltyInput}
                    onChange={(e) => setLoyaltyInput(e.target.value)}
                    placeholder={`100 - ${loyaltyBalance}`}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  />
                )}
              </div>
            )}

            {/* Wallet */}
            {user && walletBalance > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer rounded-lg border border-border bg-secondary/50 p-3">
                <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="accent-accent" />
                <span className="text-foreground font-medium">Plătește din portofel ({walletBalance.toFixed(2)} RON)</span>
              </label>
            )}

            <TrustBadges variant="full" />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
