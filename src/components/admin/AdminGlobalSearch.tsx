import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, ShoppingCart, Users, FileText, Settings, X, ArrowRight, Command } from "lucide-react";

interface SearchResult {
  type: "product" | "order" | "customer" | "page";
  id: string;
  title: string;
  subtitle?: string;
  to: string;
}

const ADMIN_PAGES: SearchResult[] = [
  { type: "page", id: "dashboard", title: "Dashboard", to: "/admin" },
  { type: "page", id: "orders", title: "Toate Comenzile", to: "/admin/orders" },
  { type: "page", id: "products", title: "Toate Produsele", to: "/admin/products" },
  { type: "page", id: "categories", title: "Categorii", to: "/admin/categories" },
  { type: "page", id: "customers", title: "Toți Clienții", to: "/admin/customers" },
  { type: "page", id: "coupons", title: "Cupoane", to: "/admin/coupons" },
  { type: "page", id: "reviews", title: "Recenzii", to: "/admin/reviews" },
  { type: "page", id: "blog", title: "Blog", to: "/admin/blog" },
  { type: "page", id: "pages", title: "Pagini CMS", to: "/admin/pages" },
  { type: "page", id: "media", title: "Media Library", to: "/admin/media" },
  { type: "page", id: "theme", title: "Temă & Culori", to: "/admin/theme" },
  { type: "page", id: "header", title: "Header", to: "/admin/header" },
  { type: "page", id: "footer", title: "Footer", to: "/admin/footer" },
  { type: "page", id: "homepage", title: "Homepage", to: "/admin/homepage" },
  { type: "page", id: "ticker", title: "Ticker Banner", to: "/admin/ticker" },
  { type: "page", id: "settings", title: "Setări Generale", to: "/admin/settings" },
  { type: "page", id: "checkout", title: "Checkout Config", to: "/admin/settings/checkout" },
  { type: "page", id: "shipping", title: "Curieri & Tarife", to: "/admin/shipping" },
  { type: "page", id: "payments", title: "Metode de Plată", to: "/admin/payments" },
  { type: "page", id: "system", title: "System Health", to: "/admin/system" },
  { type: "page", id: "users", title: "Utilizatori Admin", to: "/admin/users" },
  { type: "page", id: "integrations", title: "Integrări", to: "/admin/integrations" },
  { type: "page", id: "reports", title: "Rapoarte", to: "/admin/reports" },
  { type: "page", id: "stock", title: "Dashboard Stoc", to: "/admin/stock" },
  { type: "page", id: "warehouses", title: "Depozite", to: "/admin/stock/warehouses" },
  { type: "page", id: "suppliers", title: "Furnizori", to: "/admin/stock/suppliers" },
  { type: "page", id: "tickets", title: "Reclamații / Tichete", to: "/admin/complaints" },
  { type: "page", id: "crm", title: "CRM Segmente", to: "/admin/crm" },
  { type: "page", id: "subscribers", title: "Abonați Newsletter", to: "/admin/subscribers" },
  { type: "page", id: "abandoned", title: "Coșuri Abandonate", to: "/admin/abandoned-carts" },
  { type: "page", id: "faq", title: "FAQ", to: "/admin/content/faq" },
  { type: "page", id: "seo", title: "SEO Global", to: "/admin/content/seo" },
  { type: "page", id: "email-templates", title: "Șabloane Email", to: "/admin/content/email-templates" },
  { type: "page", id: "redirects", title: "Redirecturi", to: "/admin/content/redirects" },
  { type: "page", id: "ai", title: "AI Generator", to: "/admin/ai" },
];

const typeIcons = {
  product: Package,
  order: ShoppingCart,
  customer: Users,
  page: FileText,
};

const typeLabels = {
  product: "Produs",
  order: "Comandă",
  customer: "Client",
  page: "Pagină",
};

export default function AdminGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(ADMIN_PAGES.slice(0, 8));
      return;
    }
    setSearching(true);
    const lower = q.toLowerCase();
    const pageResults = ADMIN_PAGES.filter(p =>
      p.title.toLowerCase().includes(lower)
    ).slice(0, 5);

    const allResults: SearchResult[] = [...pageResults];

    try {
      const [prodRes, orderRes] = await Promise.all([
        supabase.from("products").select("id, name, sku, price").ilike("name", `%${q}%`).limit(5),
        supabase.from("orders").select("id, order_number, customer_name, total").or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%`).limit(5),
      ]);

      if (prodRes.data) {
        allResults.push(...prodRes.data.map(p => ({
          type: "product" as const,
          id: p.id,
          title: p.name,
          subtitle: `${p.sku || "—"} • ${p.price} RON`,
          to: "/admin/products",
        })));
      }

      if (orderRes.data) {
        allResults.push(...orderRes.data.map(o => ({
          type: "order" as const,
          id: o.id,
          title: `#${o.order_number}`,
          subtitle: `${o.customer_name} • ${o.total} RON`,
          to: "/admin/orders",
        })));
      }
    } catch { /* silent */ }

    setResults(allResults);
    setSelectedIdx(0);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate({ to: result.to as any });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      handleSelect(results[selectedIdx]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Caută produse, comenzi, clienți, pagini..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border px-1.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {searching && (
            <div className="py-8 text-center text-sm text-muted-foreground">Se caută...</div>
          )}
          {!searching && results.length === 0 && query && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Niciun rezultat pentru „{query}"
            </div>
          )}
          {!searching && results.map((r, i) => {
            const Icon = typeIcons[r.type];
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  i === selectedIdx ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{r.title}</div>
                  {r.subtitle && <div className="truncate text-xs text-muted-foreground">{r.subtitle}</div>}
                </div>
                <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {typeLabels[r.type]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ navigare</span>
          <span>↵ selectare</span>
          <span>esc închide</span>
        </div>
      </div>
    </div>
  );
}
