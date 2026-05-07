import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/hooks/useCart";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useState, useEffect, useMemo } from "react";
import { trackBeginCheckout } from "@/lib/gtm";
import { trackInitiateCheckout } from "@/lib/fbpixel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Switch } from "@/components/ui/switch";
import { attributeOrderToAffiliate } from "@/lib/affiliate-tracker";
import { TrustBadges } from "@/components/TrustBadges";
import { CheckoutUpsell } from "@/components/CheckoutUpsell";
import {
  MapPin, Gift, Search, Loader2, Check, X, ShoppingBag,
  Truck, CreditCard, Banknote, Building2, Minus, Plus, Trash2,
  Shield, Clock, Package, ChevronRight, Tag, Sparkles,
} from "lucide-react";
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

// Estimated delivery days by region
function getEstimatedDelivery(judet: string): string {
  if (!judet) return "";
  const fast = ["București", "Ilfov", "Giurgiu", "Călărași", "Ialomița", "Prahova", "Dâmbovița"];
  const days = fast.includes(judet) ? { min: 1, max: 2 } : { min: 2, max: 4 };
  const now = new Date();
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() + days.min);
  // skip weekends
  while (minDate.getDay() === 0 || minDate.getDay() === 6) minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + days.max);
  while (maxDate.getDay() === 0 || maxDate.getDay() === 6) maxDate.setDate(maxDate.getDate() + 1);
  const fmt = (d: Date) => d.toLocaleDateString("ro-RO", { day: "numeric", month: "long" });
  return `${fmt(minDate)} – ${fmt(maxDate)}`;
}

// Validation helpers
function validateEmail(email: string): string | null {
  if (!email) return "Email-ul este obligatoriu.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email invalid.";
  return null;
}
function validatePhone(phone: string): string | null {
  if (!phone) return "Telefonul este obligatoriu.";
  const clean = phone.replace(/[\s\-().+]/g, "");
  if (clean.length < 10 || clean.length > 15) return "Telefon invalid (min 10 cifre).";
  if (!/^\+?\d+$/.test(clean)) return "Telefonul conține caractere invalide.";
  return null;
}

function CheckoutPage() {
  const { items, cartSubtotal, shippingCost, discountAmount, discountCode, cartTotal, clearCart, freeShippingMin, addItem, removeItem, updateQuantity, applyDiscount, clearDiscount } = useCart();
  const { user } = useAuth();
  const { general, payment_methods: pmSettings } = useSiteSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [billingType, setBillingType] = useState<"individual" | "company">("individual");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftWrappingQty, setGiftWrappingQty] = useState(1);
  const [giftMessage, setGiftMessage] = useState("");

  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Coupon code input
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

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
      const { data: pts } = await (supabase.from("user_points" as any).select("balance").eq("user_id", user.id).maybeSingle() as any);
      if (pts) { setLoyaltyBalance(pts.balance); setLoyaltyPoints(pts.balance); }
      const { data: w } = await (supabase.from("customer_wallets" as any).select("balance").eq("user_id", user.id).maybeSingle() as any);
      if (w) setWalletBalance(Number(w.balance) || 0);
      const { data: gd } = await supabase.rpc("get_user_group_discount" as any, { p_user_id: user.id });
      if (gd && Number(gd) > 0) setGroupDiscount(Number(gd));
    })();
  }, [user]);

  const groupDiscountAmount = groupDiscount > 0 ? Math.round(cartSubtotal * groupDiscount / 100 * 100) / 100 : 0;
  const loyaltyDiscount = useLoyalty && loyaltyInput ? Math.min(Number(loyaltyInput), loyaltyBalance) / 100 : 0;

  const giftWrappingPrice = Number(general?.gift_wrapping_price) || 15;
  const subtotalAfterGroupDiscount = cartSubtotal - groupDiscountAmount;
  const giftWrappingTotal = giftWrapping ? giftWrappingPrice * giftWrappingQty : 0;
  const preWalletTotal = subtotalAfterGroupDiscount + shippingCost - discountAmount - loyaltyDiscount + giftWrappingTotal;
  const walletDeduction = useWallet ? Math.min(walletBalance, Math.max(preWalletTotal, 0)) : 0;
  const finalTotal = Math.max(preWalletTotal - walletDeduction, 0);

  // Free shipping progress
  const freeShippingProgress = Math.min((cartSubtotal / freeShippingMin) * 100, 100);
  const amountToFreeShipping = Math.max(freeShippingMin - cartSubtotal, 0);

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
    acceptTerms: false,
  });
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const u = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    // Clear inline error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  // Auto-select first enabled payment method
  useEffect(() => {
    if (Array.isArray(pmSettings) && pmSettings.length > 0) {
      const first = pmSettings.find((m: any) => m.enabled);
      if (first) setForm((p) => ({ ...p, paymentMethod: first.code }));
    }
  }, [pmSettings]);

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

  // Fetch saved addresses
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
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          if (defaultAddr) {
            selectAddress(defaultAddr);
            setSelectedAddressId(defaultAddr.id);
          }
        }
      });
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

  // Coupon apply
  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const { data, error: err } = await (supabase
        .from("discount_codes" as any)
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle() as any);
      if (err || !data) {
        setCouponError("Cod invalid sau expirat.");
        setCouponLoading(false);
        return;
      }
      // Check min order
      if (data.min_order_value && cartSubtotal < Number(data.min_order_value)) {
        setCouponError(`Comandă minimă: ${Number(data.min_order_value)} RON.`);
        setCouponLoading(false);
        return;
      }
      // Check usage limit
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setCouponError("Acest cod a atins limita de utilizări.");
        setCouponLoading(false);
        return;
      }
      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError("Codul a expirat.");
        setCouponLoading(false);
        return;
      }
      let amount = 0;
      if (data.type === "percentage") {
        amount = Math.round(cartSubtotal * Number(data.value) / 100 * 100) / 100;
        if (data.max_discount_amount) amount = Math.min(amount, Number(data.max_discount_amount));
        setCouponSuccess(`-${data.value}% aplicat! Economisești ${amount.toFixed(2)} RON`);
      } else {
        amount = Math.min(Number(data.value), cartSubtotal);
        setCouponSuccess(`-${amount.toFixed(2)} RON aplicat!`);
      }
      applyDiscount(code, amount);
    } catch {
      setCouponError("Eroare la verificarea codului.");
    }
    setCouponLoading(false);
  };

  // Estimated delivery
  const estimatedDelivery = useMemo(() => getEstimatedDelivery(form.judet), [form.judet]);

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <MarqueeBanner /><TopBar /><SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Coșul tău este gol</h1>
          <p className="text-muted-foreground mb-6">Parcurge catalogul nostru și descoperă lumânări artizanale unice.</p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3 font-bold text-accent-foreground transition hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            Descoperă produsele
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Numele este obligatoriu.";
    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errors.phone = phoneErr;
    if (!form.judet) errors.judet = "Selectează un județ.";
    if (!form.localitate.trim()) errors.localitate = "Localitatea este obligatorie.";
    if (!form.adresa.trim()) errors.adresa = "Adresa este obligatorie.";
    if (billingType === "company") {
      if (!form.companyName.trim()) errors.companyName = "Denumirea firmei este obligatorie.";
      if (!form.companyCui.trim()) errors.companyCui = "CUI-ul este obligatoriu.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Corectează câmpurile marcate cu roșu.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!form.acceptTerms) {
      setError("Trebuie să accepți termenii, condițiile și politica de confidențialitate.");
      return;
    }
    setSubmitting(true);
    setError("");

    const orderId = crypto.randomUUID();
    let orderNumber = `ML${Math.floor(10000 + Math.random() * 90000)}`;
    try {
      const { data: genNum } = await supabase.rpc("generate_order_number" as any);
      if (genNum && typeof genNum === "string") orderNumber = genNum;
    } catch {}
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
      gift_wrapping_price: giftWrapping ? giftWrappingPrice : 0,
      gift_wrapping_quantity: giftWrapping ? giftWrappingQty : 0,
      gift_wrapping_description: giftWrapping ? (general?.gift_wrapping_description || null) : null,
      gift_message: giftWrapping ? giftMessage || null : null,
    };

    const { error: dbError } = await supabase.from("orders").insert(orderData);
    if (dbError) {
      if (import.meta.env.DEV) console.error("[checkout] Order insert failed:", dbError.code);
      setError("Eroare la plasarea comenzii. Încearcă din nou sau contactează-ne.");
      setSubmitting(false);
      return;
    }

    // GDPR consents
    const consentBase = {
      email: form.email,
      user_id: user?.id || null,
      ip_address: null,
      metadata: { order_id: orderId, order_number: orderData.order_number, policy_version: "2025-05-02" },
    };
    supabase.from("gdpr_consents").insert([
      { ...consentBase, consent_type: "terms_and_privacy", granted: true },
      ...(newsletterOptIn ? [{ ...consentBase, consent_type: "marketing_email", granted: true }] : []),
    ]).then(() => {});

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
          gift_wrapping: orderData.gift_wrapping,
          gift_wrapping_price: orderData.gift_wrapping_price,
          gift_wrapping_quantity: orderData.gift_wrapping_quantity,
          gift_wrapping_description: orderData.gift_wrapping_description,
          gift_message: orderData.gift_message,
        },
      },
    }).catch(() => {});

    for (const item of items) {
      try {
        await supabase.rpc('decrement_stock', { p_product_id: item.id, p_quantity: item.quantity });
      } catch {}
    }

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

    if (useLoyalty && loyaltyInput && Number(loyaltyInput) > 0 && user?.id) {
      try {
        await supabase.rpc("redeem_loyalty_points" as any, {
          p_user_id: user.id,
          p_points: Math.min(Number(loyaltyInput), loyaltyBalance),
          p_order_id: orderId,
        });
      } catch {}
    }

    if (useWallet && walletDeduction > 0 && user?.id) {
      try {
        await supabase.rpc("charge_wallet" as any, {
          p_user_id: user.id,
          p_amount: walletDeduction,
          p_order_id: orderId,
        });
      } catch {}
    }

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

    // Netopia card payment
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
      if (import.meta.env.DEV) console.log("[checkout][netopia] Invoking netopia-payment");
      try {
        const t0 = Date.now();
        const { data: payData, error: payErr } = await supabase.functions.invoke("netopia-payment", {
          body: payloadBody,
        });
        const elapsed = Date.now() - t0;
        if (import.meta.env.DEV) console.log(`[checkout][netopia] Response in ${elapsed}ms`);

        if (payErr) {
          let serverDetails: any = null;
          try {
            const ctx = (payErr as any).context;
            if (ctx && typeof ctx.json === "function") {
              serverDetails = await ctx.json();
            } else if (ctx && typeof ctx.text === "function") {
              serverDetails = await ctx.text();
            }
          } catch {}
          if (import.meta.env.DEV) {
            console.error("[checkout][netopia] Edge function error:", { name: payErr.name, message: payErr.message });
          }
          const debug = JSON.stringify(
            { step: "netopia-invoke", error: payErr.message || String(payErr), serverDetails, orderId, amount: finalTotal },
            null, 2
          );
          setDebugInfo(debug);
          setError(
            `Plata cu cardul a eșuat: ${
              (serverDetails && (serverDetails.error || serverDetails.details)) ||
              payErr.message || "eroare necunoscută"
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
          JSON.stringify({ step: "exception", name: e?.name, message: e?.message || String(e), stack: e?.stack }, null, 2)
        );
        setError(`Eroare la inițierea plății: ${e?.message || String(e)}`);
        setSubmitting(false);
        return;
      }
    }

    clearCart();
    navigate({ to: "/order-confirmed/$orderId", params: { orderId } });
  };

  const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition";
  const inputErrorClass = "w-full rounded-lg border border-destructive bg-card px-3 py-2.5 text-sm text-foreground focus:border-destructive focus:outline-none transition";

  // Payment method icons
  const paymentIcons: Record<string, React.ReactNode> = {
    ramburs: <Banknote className="h-5 w-5 text-accent" />,
    card: <CreditCard className="h-5 w-5 text-accent" />,
    transfer: <Building2 className="h-5 w-5 text-accent" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <MarqueeBanner /><TopBar /><SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Finalizare Comandă</h1>

        {/* Steps indicator */}
        <div className="mt-5 flex items-center gap-1 sm:gap-2">
          {[
            { n: 1, label: "Date livrare", icon: <MapPin className="h-3.5 w-3.5" /> },
            { n: 2, label: "Plată", icon: <CreditCard className="h-3.5 w-3.5" /> },
            { n: 3, label: "Confirmare", icon: <Check className="h-3.5 w-3.5" /> },
          ].map((s, idx) => (
            <div key={s.n} className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => { if (s.n < step) setStep(s.n); }}
                disabled={s.n > step}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                  step >= s.n
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                } ${s.n < step ? "cursor-pointer hover:opacity-80" : ""}`}
              >
                {step > s.n ? <Check className="h-4 w-4" /> : s.n}
              </button>
              <span className={`text-xs sm:text-sm hidden sm:inline ${step >= s.n ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {idx < 2 && <ChevronRight className={`h-4 w-4 ${step > s.n ? "text-accent" : "text-muted-foreground/40"}`} />}
            </div>
          ))}
        </div>

        {error && <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive font-medium">{error}</p>}
        {debugInfo && (
          <details className="mt-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-xs">
            <summary className="cursor-pointer font-medium text-muted-foreground">🔍 Detalii debug (Netopia)</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[11px] text-foreground">{debugInfo}</pre>
          </details>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">

                {/* Saved addresses */}
                {user && savedAddresses.length > 0 && (
                  <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="text-sm font-semibold text-foreground">Adrese salvate</span>
                      </div>
                      <Link to="/account/addresses" className="text-xs text-accent hover:underline">Gestionează →</Link>
                    </div>
                    <select value={selectedAddressId} onChange={(e) => handleAddressSelect(e.target.value)} className={inputClass}>
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
                  <button onClick={() => setBillingType("individual")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${billingType === "individual" ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Persoană Fizică</button>
                  <button onClick={() => setBillingType("company")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${billingType === "company" ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Persoană Juridică</button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Nume complet *</label>
                    <input value={form.name} onChange={(e) => u("name", e.target.value)} className={fieldErrors.name ? inputErrorClass : inputClass} placeholder="Ex: Maria Popescu" />
                    {fieldErrors.name && <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Email *</label>
                    <input type="email" value={form.email} onChange={(e) => u("email", e.target.value)} className={fieldErrors.email ? inputErrorClass : inputClass} placeholder="email@exemplu.ro" />
                    {fieldErrors.email && <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Telefon *</label>
                    <input value={form.phone} onChange={(e) => u("phone", e.target.value)} className={fieldErrors.phone ? inputErrorClass : inputClass} placeholder="07xx xxx xxx" />
                    {fieldErrors.phone && <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Județ *</label>
                    <select value={form.judet} onChange={(e) => u("judet", e.target.value)} className={fieldErrors.judet ? inputErrorClass : inputClass}>
                      <option value="">Alege județul</option>
                      {JUDETE.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                    {fieldErrors.judet && <p className="mt-1 text-xs text-destructive">{fieldErrors.judet}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Localitate *</label>
                    <input value={form.localitate} onChange={(e) => u("localitate", e.target.value)} className={fieldErrors.localitate ? inputErrorClass : inputClass} />
                    {fieldErrors.localitate && <p className="mt-1 text-xs text-destructive">{fieldErrors.localitate}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Adresă (stradă, număr, bloc, scara, apt) *</label>
                    <input value={form.adresa} onChange={(e) => u("adresa", e.target.value)} className={fieldErrors.adresa ? inputErrorClass : inputClass} placeholder="Str. Exemplu nr. 1, bl. A, sc. 1, ap. 1" />
                    {fieldErrors.adresa && <p className="mt-1 text-xs text-destructive">{fieldErrors.adresa}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Cod poștal</label>
                    <input value={form.codPostal} onChange={(e) => u("codPostal", e.target.value)} className={inputClass} placeholder="Ex: 010101" />
                  </div>
                </div>

                {/* Estimated delivery */}
                {estimatedDelivery && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
                    <Truck className="h-5 w-5 text-accent flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Livrare estimată: {estimatedDelivery}</p>
                      <p className="text-xs text-muted-foreground">Prin curier rapid, la adresa ta</p>
                    </div>
                  </div>
                )}

                {/* Save address */}
                {user && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-accent" />
                    Salvează această adresă pentru comenzi viitoare
                  </label>
                )}

                {billingType === "company" && (
                  <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Denumire firmă *</label>
                      <input value={form.companyName} onChange={(e) => u("companyName", e.target.value)} className={fieldErrors.companyName ? inputErrorClass : inputClass} />
                      {fieldErrors.companyName && <p className="mt-1 text-xs text-destructive">{fieldErrors.companyName}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">CUI *</label>
                      <div className="flex gap-2">
                        <input
                          value={form.companyCui}
                          onChange={(e) => { u("companyCui", e.target.value); setCuiLookup({ loading: false, status: "idle", message: "" }); }}
                          className={fieldErrors.companyCui ? inputErrorClass : inputClass}
                          placeholder="ex: 43025661"
                        />
                        <button
                          type="button"
                          onClick={lookupCui}
                          disabled={cuiLookup.loading || form.companyCui.replace(/\D/g, "").length < 6}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                        >
                          {cuiLookup.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                          Verifică
                        </button>
                      </div>
                      {fieldErrors.companyCui && <p className="mt-1 text-xs text-destructive">{fieldErrors.companyCui}</p>}
                      {cuiLookup.status === "success" && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[oklch(0.55_0.15_145)]"><Check className="h-3.5 w-3.5" />{cuiLookup.message}</p>
                      )}
                      {cuiLookup.status === "error" && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><X className="h-3.5 w-3.5" />{cuiLookup.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Nr. Registru Comerțului</label>
                      <input value={form.companyReg} onChange={(e) => u("companyReg", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Observații comandă (opțional)</label>
                  <textarea value={form.observatii} onChange={(e) => u("observatii", e.target.value)} rows={2} className={inputClass} placeholder="Ex: Sună înainte de livrare" />
                </div>

                {general?.gift_wrapping_enabled && (
                  <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-foreground">Ambalaj cadou</span>
                        <span className="text-xs text-muted-foreground">(+{giftWrappingPrice} RON/buc)</span>
                      </div>
                      <Switch checked={giftWrapping} onCheckedChange={(v) => { setGiftWrapping(v); if (!v) setGiftWrappingQty(1); }} />
                    </div>
                    {general?.gift_wrapping_description && (
                      <p className="text-xs text-muted-foreground">{general.gift_wrapping_description}</p>
                    )}
                    {giftWrapping && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-muted-foreground">Cantitate:</label>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setGiftWrappingQty(Math.max(1, giftWrappingQty - 1))} className="h-7 w-7 rounded border border-border bg-card text-foreground text-sm flex items-center justify-center hover:bg-muted">−</button>
                            <span className="w-8 text-center text-sm font-medium">{giftWrappingQty}</span>
                            <button type="button" onClick={() => setGiftWrappingQty(Math.min(items.reduce((s, i) => s + i.quantity, 0), giftWrappingQty + 1))} className="h-7 w-7 rounded border border-border bg-card text-foreground text-sm flex items-center justify-center hover:bg-muted">+</button>
                          </div>
                          <span className="text-xs text-muted-foreground">= {giftWrappingTotal.toFixed(2)} RON</span>
                        </div>
                        <textarea
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value.slice(0, 150))}
                          maxLength={150}
                          rows={2}
                          placeholder="Mesaj pentru card cadou..."
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full rounded-lg bg-accent py-3.5 font-bold text-accent-foreground transition hover:opacity-90 flex items-center justify-center gap-2">
                  Continuă → Metodă de plată
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold text-foreground">Metodă de plată</h2>
                {(() => {
                  const enabledMethods = Array.isArray(pmSettings) && pmSettings.length > 0
                    ? pmSettings.filter((m: any) => m.enabled).map((m: any) => ({ value: m.code, label: m.name, desc: m.description || "" }))
                    : [
                        { value: "ramburs", label: "Plată la livrare (Ramburs)", desc: "Plătești curierului când primești coletul" },
                        { value: "card", label: "Card online (Visa / Mastercard)", desc: "Plată securizată prin Netopia Payments" },
                        { value: "transfer", label: "Transfer bancar", desc: "Plată prin ordin de plată — comanda se procesează la confirmarea plății" },
                      ];
                  return enabledMethods.map((m: any) => (
                    <label key={m.value} className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition ${form.paymentMethod === m.value ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-muted-foreground/30"}`}>
                      <input type="radio" name="payment" value={m.value} checked={form.paymentMethod === m.value} onChange={(e) => u("paymentMethod", e.target.value)} className="accent-accent h-4 w-4" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                      {paymentIcons[m.value] || <CreditCard className="h-5 w-5 text-muted-foreground" />}
                    </label>
                  ));
                })()}

                {/* Security badges */}
                <div className="flex items-center gap-4 rounded-lg bg-secondary/50 px-4 py-3 mt-2">
                  <Shield className="h-5 w-5 text-accent flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Plată 100% securizată</strong> — Datele tale sunt protejate prin criptare SSL 256-bit.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="rounded-lg border border-border px-6 py-3 font-medium text-muted-foreground transition hover:bg-secondary">← Înapoi</button>
                  <button onClick={() => setStep(3)} className="flex-1 rounded-lg bg-accent py-3 font-bold text-accent-foreground transition hover:opacity-90 flex items-center justify-center gap-2">
                    Continuă → Confirmare
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
                <h2 className="font-heading text-lg font-bold text-foreground">Rezumat comandă</h2>
                <div className="space-y-2 rounded-lg bg-secondary p-4">
                  <p className="text-sm"><strong>Client:</strong> {form.name} ({form.email})</p>
                  <p className="text-sm"><strong>Telefon:</strong> {form.phone}</p>
                  <p className="text-sm"><strong>Adresă:</strong> {form.adresa}, {form.localitate}, {form.judet} {form.codPostal}</p>
                  {billingType === "company" && (
                    <p className="text-sm"><strong>Firmă:</strong> {form.companyName} (CUI: {form.companyCui})</p>
                  )}
                  <p className="text-sm"><strong>Plată:</strong> {form.paymentMethod === "ramburs" ? "Ramburs" : form.paymentMethod === "card" ? "Card online" : "Transfer bancar"}</p>
                  {estimatedDelivery && (
                    <p className="text-sm flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-accent" />
                      <strong>Livrare estimată:</strong> {estimatedDelivery}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded object-cover" loading="lazy" />}
                      <span className="flex-1">{item.name} × {item.quantity}</span>
                      <span className="font-medium">{(item.price * item.quantity).toFixed(2)} RON</span>
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
                  <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg bg-accent py-3.5 font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Se plasează...</>
                    ) : (
                      <><Package className="h-4 w-4" /> PLASEAZĂ COMANDA</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Upsell recommendations */}
            {step === 1 && <CheckoutUpsell />}
          </div>

          {/* Order summary sidebar */}
          <div className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-4">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Comanda ta
            </h3>

            {/* Free shipping progress bar */}
            <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
              {amountToFreeShipping > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    <Truck className="inline h-3.5 w-3.5 mr-1 text-accent" />
                    Mai adaugă <strong className="text-foreground">{amountToFreeShipping.toFixed(0)} RON</strong> pentru livrare <strong className="text-accent">GRATUITĂ</strong>!
                  </p>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${freeShippingProgress}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-accent font-medium flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Livrare GRATUITĂ! 🎉
                </p>
              )}
            </div>

            {/* Cart items with edit */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  {item.image_url && <img src={item.image_url} alt={item.name} loading="lazy" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.price.toFixed(2)} RON/buc</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-6 w-6 rounded border border-border bg-background text-foreground text-xs flex items-center justify-center hover:bg-muted transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-6 w-6 rounded border border-border bg-background text-foreground text-xs flex items-center justify-center hover:bg-muted transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="ml-auto h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition"
                        title="Șterge"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground flex-shrink-0">{(item.price * item.quantity).toFixed(2)} RON</span>
                </div>
              ))}
            </div>

            {/* Coupon code input */}
            {!discountCode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); setCouponSuccess(""); }}
                      placeholder="Cod reducere"
                      className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                      onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(); }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                  >
                    {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplică"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-[oklch(0.55_0.15_145)]">{couponSuccess}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-accent" /> {discountCode}
                </span>
                <button type="button" onClick={() => { clearDiscount(); setCouponInput(""); setCouponSuccess(""); }} className="text-xs text-muted-foreground hover:text-destructive transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{cartSubtotal.toFixed(2)} RON</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livrare</span>
                <span className={shippingCost === 0 ? "text-accent font-medium" : ""}>{shippingCost === 0 ? "GRATUITĂ" : `${shippingCost} RON`}</span>
              </div>
              {discountAmount > 0 && <div className="flex justify-between text-[oklch(0.55_0.15_145)]"><span>Reducere cupon</span><span>-{discountAmount.toFixed(2)} RON</span></div>}
              {groupDiscountAmount > 0 && <div className="flex justify-between text-[oklch(0.55_0.15_145)]"><span>Discount grup (-{groupDiscount}%)</span><span>-{groupDiscountAmount.toFixed(2)} RON</span></div>}
              {loyaltyDiscount > 0 && <div className="flex justify-between text-[oklch(0.55_0.15_145)]"><span>Puncte fidelitate</span><span>-{loyaltyDiscount.toFixed(2)} RON</span></div>}
              {walletDeduction > 0 && <div className="flex justify-between text-[oklch(0.55_0.15_145)]"><span>Portofel</span><span>-{walletDeduction.toFixed(2)} RON</span></div>}
              {giftWrapping && <div className="flex justify-between"><span className="text-muted-foreground">Ambalaj cadou ×{giftWrappingQty}</span><span>{giftWrappingTotal.toFixed(2)} RON</span></div>}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span className="text-accent">{finalTotal.toFixed(2)} RON</span></div>
            </div>

            {/* Loyalty points */}
            {user && loyaltyBalance > 0 && (
              <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={useLoyalty} onChange={(e) => { setUseLoyalty(e.target.checked); if (!e.target.checked) setLoyaltyInput(""); }} className="accent-accent" />
                  <span className="text-foreground font-medium">Folosește puncte ({loyaltyBalance} = {(loyaltyBalance / 100).toFixed(2)} RON)</span>
                </label>
                {useLoyalty && (
                  <input type="number" min={100} max={loyaltyBalance} step={100} value={loyaltyInput} onChange={(e) => setLoyaltyInput(e.target.value)} placeholder={`100 - ${loyaltyBalance}`} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
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

            {/* Trust strip */}
            <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> SSL</span>
              <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Livrare rapidă</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 14 zile retur</span>
            </div>

            <TrustBadges variant="full" />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
