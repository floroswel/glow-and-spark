declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: (...args: any[]) => void;
  }
}

export function initPixel() {
  const pixelId = import.meta.env.VITE_FB_PIXEL_ID;
  if (!pixelId || typeof document === "undefined") return;
  if (typeof window.fbq === "function") return;

  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f;
  f.loaded = true;
  f.version = "2.0";
  f.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

export function trackPageView() {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "PageView");
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export function trackViewContent(product: ProductItem) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "ViewContent", {
    content_type: "product",
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category || "",
    value: product.price,
    currency: "RON",
  });
}

export function trackAddToCart(item: ProductItem, quantity: number) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "AddToCart", {
    content_type: "product",
    content_ids: [item.id],
    content_name: item.name,
    value: item.price * quantity,
    currency: "RON",
  });
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty?: number;
  quantity?: number;
}

export function trackInitiateCheckout(items: CartItem[], total: number) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    value: total,
    currency: "RON",
    num_items: items.reduce((s, i) => s + (i.qty || i.quantity || 1), 0),
  });
}

export function trackPurchase(order: { id: string; total: number; items?: any[] }) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", "Purchase", {
    content_ids: (order.items || []).map((i: any) => i.product_id || i.id),
    value: order.total,
    currency: "RON",
    content_type: "product",
  });
}
