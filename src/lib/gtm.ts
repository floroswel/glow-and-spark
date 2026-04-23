declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

function push(event: string, data: Record<string, any>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

export function initGTM(gtmId: string) {
  if (!gtmId || typeof document === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
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
