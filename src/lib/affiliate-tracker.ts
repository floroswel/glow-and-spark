// Affiliate tracking — capture ?ref=CODE, store in cookie 30 zile, attribute la checkout
import { supabase } from "@/integrations/supabase/client";

const COOKIE_NAME = "ml_ref";
const COOKIE_DAYS = 30;

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + days * 86400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

export function getRefCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return m ? decodeURIComponent(m[2]) : null;
}

export async function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref || !/^[a-zA-Z0-9_-]{3,40}$/.test(ref)) return;

  setCookie(COOKIE_NAME, ref, COOKIE_DAYS);

  // Înregistrează click anonim
  try {
    const { data: aff } = await supabase
      .from("affiliates")
      .select("id")
      .eq("code", ref)
      .eq("status", "active")
      .maybeSingle();
    if (aff) {
      await supabase.from("affiliate_clicks").insert({
        affiliate_id: aff.id,
        landing_page: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent.slice(0, 500),
      });
    }
  } catch (e) {
    console.warn("Affiliate tracking failed", e);
  }
}

export async function attributeOrderToAffiliate(orderId: string) {
  const ref = getRefCookie();
  if (!ref) return;
  try {
    await supabase.rpc("attribute_affiliate_conversion", {
      p_order_id: orderId,
      p_ref_code: ref,
    });
  } catch (e) {
    console.warn("Affiliate attribution failed", e);
  }
}
