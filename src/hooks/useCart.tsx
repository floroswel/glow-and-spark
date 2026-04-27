import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useSiteSettings } from "./useSiteSettings";
import { saveAbandonedCart } from "@/utils/abandoned-cart.functions";

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number | null;
  image_url?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingCost: number;
  freeShippingMin: number;
  cartTotal: number;
  discountAmount: number;
  discountCode: string | null;
  applyDiscount: (code: string, amount: number) => void;
  clearDiscount: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "glow_spark_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { general } = useSiteSettings();
  const freeShippingMin = Number(general?.free_shipping_min) || 200;
  const defaultShipping = Number(general?.default_shipping_cost) || 15;

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items]);

  // Debounced abandoned cart sync via secure server function (httpOnly cookie)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (items.length === 0) return;
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      saveAbandonedCart({
        data: {
          items: items as any,
          subtotal,
          total: subtotal,
        },
      }).catch((err) => {
        console.warn("[cart] abandoned cart save failed", err);
      });
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [items]);

  const addItem = useCallback((product: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...product, quantity }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountCode(null);
    setDiscountAmount(0);
  }, []);

  const applyDiscount = useCallback((code: string, amount: number) => {
    setDiscountCode(code);
    setDiscountAmount(amount);
  }, []);

  const clearDiscount = useCallback(() => {
    setDiscountCode(null);
    setDiscountAmount(0);
  }, []);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = cartSubtotal >= freeShippingMin ? 0 : defaultShipping;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      cartCount, cartSubtotal, shippingCost, freeShippingMin, cartTotal,
      discountAmount, discountCode, applyDiscount, clearDiscount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
