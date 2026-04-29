declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

function push(event: string, data: Record<string, any>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

/**
 * Initialize Google tag manager OR Google Analytics 4 based on ID prefix.
 *  - "G-XXXX"   → loads gtag.js (GA4 Measurement ID)
 *  - "GTM-XXXX" → loads gtm.js  (Google Tag Manager container)
 * Invalid / unknown IDs are ignored to avoid leaking misconfigured tags.
 */
export function initGTM(id: string) {
  if (!id || typeof document === "undefined") return;
  const trimmed = id.trim();
  window.dataLayer = window.dataLayer || [];

  if (/^G-[A-Z0-9]+$/i.test(trimmed)) {
    // GA4 via gtag.js
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trimmed}`;
    document.head.appendChild(script);
    const inline = document.createElement("script");
    inline.text = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${trimmed}');`;
    document.head.appendChild(inline);
    return;
  }

  if (/^GTM-[A-Z0-9]+$/i.test(trimmed)) {
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${trimmed}`;
    document.head.appendChild(script);
    return;
  }

  if (typeof console !== "undefined") {
    console.warn(`[analytics] Ignored invalid tracking ID: "${trimmed}". Expected "G-..." (GA4) or "GTM-..." (Tag Manager).`);
  }
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  slug?: string;
  category?: string;
  image_url?: string;
}

export function trackViewItem(product: ProductItem) {
  push("view_item", {
    ecommerce: {
      currency: "RON",
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category || "",
      }],
    },
  });
}

export function trackAddToCart(item: ProductItem, quantity: number) {
  push("add_to_cart", {
    ecommerce: {
      currency: "RON",
      value: item.price * quantity,
      items: [{
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity,
      }],
    },
  });
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty?: number;
  quantity?: number;
}

export function trackBeginCheckout(items: CartItem[], total: number) {
  push("begin_checkout", {
    ecommerce: {
      currency: "RON",
      value: total,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.qty || i.quantity || 1,
      })),
    },
  });
}

export function trackPurchase(order: { id: string; order_number?: string; total: number; items?: any[] }) {
  push("purchase", {
    ecommerce: {
      transaction_id: order.id,
      value: order.total,
      currency: "RON",
      items: (order.items || []).map((i: any) => ({
        item_id: i.product_id || i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.qty || i.quantity || 1,
      })),
    },
  });
}
