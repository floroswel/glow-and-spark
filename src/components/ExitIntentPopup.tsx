import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCart } from "@/hooks/useCart";
import { X, Copy, Check, Gift } from "lucide-react";
import { toast } from "sonner";

const SESSION_KEY = "exit_popup_shown";

export function ExitIntentPopup() {
  const { general } = useSiteSettings();
  const { items, applyDiscount } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const readyRef = useRef(false);

  const coupon = general?.exit_intent_coupon as string | undefined;
  const discountValue = general?.exit_intent_value as number | undefined;

  // Mark ready after 10s on page
  useEffect(() => {
    const t = setTimeout(() => { readyRef.current = true; }, 10000);
    return () => clearTimeout(t);
  }, []);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY > 0) return;
    if (!readyRef.current) return;
    if (items.length === 0) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (!coupon || !discountValue) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(true);
  }, [items.length, coupon, discountValue]);

  useEffect(() => {
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [handleMouseLeave]);

  const handleCopy = () => {
    if (!coupon) return;
    navigator.clipboard.writeText(coupon);
    setCopied(true);
    toast.success("Cod copiat!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (coupon && discountValue) {
      applyDiscount(coupon, discountValue);
    }
    setOpen(false);
    navigate({ to: "/cart" });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-in fade-in duration-200" onClick={() => setOpen(false)}>
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Gift className="h-7 w-7 text-accent" />
        </div>

        {/* Content */}
        <h2 className="text-center font-heading text-2xl font-bold text-foreground">
          Înainte să pleci...
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Ai produse în coș! Folosește codul de mai jos și primești{" "}
          <span className="font-semibold text-accent">{discountValue} RON reducere</span> la comanda ta.
        </p>

        {/* Coupon code */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 px-5 py-3">
            <span className="font-mono text-xl font-bold tracking-widest text-foreground">{coupon}</span>
            <button
              onClick={handleCopy}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 transition"
              title="Copiază"
            >
              {copied ? <Check className="h-4 w-4 text-chart-2" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleUse}
          className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
        >
          Folosește reducerea
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setOpen(false)}
          className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
        >
          Nu, mulțumesc
        </button>
      </div>
    </div>
  );
}
