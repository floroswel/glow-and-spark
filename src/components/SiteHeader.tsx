import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCart } from "@/hooks/useCart";
import { Link } from "@tanstack/react-router";
import { Menu, X, Search, Heart, GitCompare, ShoppingBag, User, FileText, Home, Phone, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { header, general } = useSiteSettings();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const navLinks = (header?.navbar_links || []).filter((link: any) => link.active);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .eq("visible", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-card shadow-sm">
      {/* Sub-header bar */}
      <div className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-muted-foreground">
          <span>🚚 Livrare gratuită peste 150 RON</span>
          <span>Suport: {general?.contact_phone || "0800 123 456"}</span>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {general?.site_name || "LUMINI"}<span className="text-accent">.RO</span>
          </Link>

          {/* Desktop search */}
          {header?.show_search !== false && (
            <div className="hidden flex-1 max-w-xl mx-8 md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder={header?.search_placeholder || "Caută produse, categorii, arome..."}
                  className="w-full rounded-full border border-border bg-secondary px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-foreground p-2 text-primary-foreground transition hover:bg-accent">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop icons */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {header?.show_compare !== false && (
              <Link to="/compare" className="hidden md:flex items-center gap-1 hover:text-foreground transition">
                <GitCompare className="h-5 w-5" />
                Compară
              </Link>
            )}
            {header?.show_favorites !== false && (
              <Link to="/wishlist" className="hidden md:flex items-center gap-1 hover:text-foreground transition">
                <Heart className="h-5 w-5" />
                Favorite
              </Link>
            )}
            {header?.show_cart !== false && (
              <Link to="/cart" className="relative flex items-center gap-1 hover:text-foreground transition">
                <ShoppingBag className="h-5 w-5" />
                <span className="hidden md:inline">Coș</span>
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center rounded-md p-1.5 hover:bg-secondary transition"
              aria-label={mobileOpen ? "Închide meniu" : "Deschide meniu"}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop nav with mega-menu */}
      <nav className="hidden md:block border-b border-border bg-card relative">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 text-sm font-medium">
          {/* Toate Produsele with mega-menu */}
          <div
            className="relative"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => { setMegaMenuOpen(false); setActiveCategory(null); }}
          >
            <Link
              to="/catalog"
              className="flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              <Package className="h-4 w-4" />
              Toate Produsele
            </Link>

            {/* Mega-menu dropdown */}
            {megaMenuOpen && categories.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-0 flex w-[600px] rounded-b-xl border border-border bg-card shadow-xl">
                {/* Category sidebar */}
                <div className="w-56 border-r border-border py-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to="/categorie/$slug"
                      params={{ slug: cat.slug }}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer border-l-4 transition-all ${
                        activeCategory === cat.id
                          ? "border-accent bg-secondary text-accent"
                          : "border-transparent text-muted-foreground hover:border-accent hover:bg-secondary hover:text-foreground"
                      }`}
                      onMouseEnter={() => setActiveCategory(cat.id)}
                      onClick={() => setMegaMenuOpen(false)}
                    >
                      <span>{cat.icon || "🕯️"} {cat.name}</span>
                      <span className="text-xs transition-transform" style={{ transform: activeCategory === cat.id ? "translateX(4px)" : undefined }}>›</span>
                    </Link>
                  ))}
                </div>
                {/* Category detail */}
                <div className="flex-1 p-6">
                  {activeCategory ? (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {categories.find((c) => c.id === activeCategory)?.name}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {categories.find((c) => c.id === activeCategory)?.description || "Explorează produsele din această categorie."}
                      </p>
                      <Link
                        to="/categorie/$slug"
                        params={{ slug: categories.find((c) => c.id === activeCategory)?.slug || "" }}
                        className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                        onClick={() => setMegaMenuOpen(false)}
                      >
                        Vezi toate produsele →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selectează o categorie din stânga...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {navLinks.map((link: any, i: number) => {
            const isInternal = link.url?.startsWith("/");
            if (isInternal) {
              return (
                <Link
                  key={i}
                  to={link.url}
                  className="transition hover:text-foreground"
                  activeProps={{ className: "text-accent font-semibold" }}
                  style={{
                    color: link.highlight ? link.color : undefined,
                    fontWeight: link.highlight ? 600 : undefined,
                  }}
                >
                  {link.label}
                </Link>
              );
            }
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-foreground"
                style={{
                  color: link.highlight ? link.color : undefined,
                  fontWeight: link.highlight ? 600 : undefined,
                }}
              >
                {link.label}
              </a>
            );
          })}
          <Link to="/blog" className="transition hover:text-foreground" activeProps={{ className: "text-accent font-semibold" }}>
            Blog
          </Link>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-50 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile slide-in menu */}
      <div
        className={`md:hidden fixed top-[57px] left-0 z-50 h-[calc(100dvh-57px)] w-[280px] bg-card border-r border-border shadow-xl transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile search */}
        {header?.show_search !== false && (
          <div className="p-4 border-b border-border">
            <div className="relative">
              <input
                type="text"
                placeholder={header?.search_placeholder || "Caută produse..."}
                className="w-full rounded-full border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-foreground p-2 text-primary-foreground">
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile nav links */}
        <div className="p-3 space-y-1">
          <MobileLink to="/" icon={<Home className="h-5 w-5" />} label="Acasă" onClick={() => setMobileOpen(false)} />
          <MobileLink to="/catalog" icon={<Package className="h-5 w-5" />} label="Toate Produsele" onClick={() => setMobileOpen(false)} />

          {/* Categories in mobile */}
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to="/categorie/$slug"
              params={{ slug: cat.slug }}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition pl-8"
            >
              {cat.icon || "🕯️"} {cat.name}
            </Link>
          ))}

          {navLinks.map((link: any, i: number) => {
            const isInternal = link.url?.startsWith("/");
            if (isInternal) {
              return (
                <MobileLink
                  key={i}
                  to={link.url}
                  label={link.label}
                  onClick={() => setMobileOpen(false)}
                  highlight={link.highlight}
                  highlightColor={link.color}
                />
              );
            }
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                style={{ color: link.highlight ? link.color : undefined }}
              >
                {link.label}
              </a>
            );
          })}

          <MobileLink to="/blog" icon={<FileText className="h-5 w-5" />} label="Blog" onClick={() => setMobileOpen(false)} />
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-border" />

        {/* Mobile utility links */}
        <div className="p-3 space-y-1">
          {header?.show_compare !== false && (
            <MobileLink to="/compare" icon={<GitCompare className="h-5 w-5" />} label="Compară" onClick={() => setMobileOpen(false)} />
          )}
          {header?.show_favorites !== false && (
            <MobileLink to="/wishlist" icon={<Heart className="h-5 w-5" />} label="Favorite" onClick={() => setMobileOpen(false)} />
          )}
          <MobileLink to="/account" icon={<User className="h-5 w-5" />} label="Contul Meu" onClick={() => setMobileOpen(false)} />
          <MobileLink to="/track-order" icon={<Search className="h-5 w-5" />} label="Urmărește Comanda" onClick={() => setMobileOpen(false)} />
        </div>

        {/* Mobile contact */}
        {(general?.phone || general?.email) && (
          <>
            <div className="mx-4 border-t border-border" />
            <div className="p-4 space-y-2">
              {general?.phone && (
                <a href={`tel:${general.phone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition">
                  <Phone className="h-4 w-4" />
                  {general.phone}
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function MobileLink({
  to,
  icon,
  label,
  onClick,
  highlight,
  highlightColor,
}: {
  to: string;
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  highlightColor?: string;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition"
      activeProps={{ className: "bg-accent/10 text-accent font-semibold" }}
      style={{
        color: highlight ? highlightColor : undefined,
        fontWeight: highlight ? 600 : undefined,
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
