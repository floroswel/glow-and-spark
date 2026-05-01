import { useState, useEffect, useRef, useCallback } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, Heart, GitCompare, ShoppingBag, User, FileText, Home, Phone, Package, X, Gift, Star, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { HighlightText } from "@/components/HighlightText";

function useProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [categoryResults, setCategoryResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((term: string) => {
    setQuery(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 2) {
      setResults([]);
      setCategoryResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    debounceRef.current = setTimeout(async () => {
      const t = term.trim();
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.rpc("search_products_unaccent", { term: t, lim: 6 }),
        supabase.rpc("search_categories_unaccent", { term: t, lim: 4 }),
      ]);
      setResults(productsRes.data || []);
      setCategoryResults(categoriesRes.data || []);
      setLoading(false);
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setCategoryResults([]);
    setOpen(false);
  }, []);

  return { query, results, categoryResults, loading, open, setOpen, search, clear };
}

export function SiteHeader() {
  const { header, general } = useSiteSettings();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const desktopSearch = useProductSearch();
  const mobileSearch = useProductSearch();
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Fetch user points
  useEffect(() => {
    if (!user) { setUserPoints(null); return; }
    supabase.from("user_points").select("balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setUserPoints(data?.balance ?? null));
  }, [user]);

  // Live unread notifications count
  useEffect(() => {
    if (!user) { setUnreadNotif(0); return; }
    const fetchCount = async () => {
      const { count } = await supabase
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadNotif(count || 0);
    };
    fetchCount();
    const channel = supabase
      .channel("header-notif-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications", filter: "user_id=eq." + user.id }, () => fetchCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const navLinks = (header?.navbar_links || []).filter((link: any) => link.active);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        desktopSearch.setOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        mobileSearch.setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <>
      <header className="sticky top-0 z-50 bg-card shadow-sm">

        {/* Main header */}
        <div className="border-b border-border">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:py-3">
            <Link to="/" className="font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {general?.logo_url ? (
                <img src={general.logo_url} alt={general?.logo_alt || general?.site_name || "Mama Lucica"} className="h-8 md:h-10 w-auto" />
              ) : (
                <>{general?.site_name || "Mama Lucica"}</>
              )}
            </Link>

            {/* Desktop search */}
            {header?.show_search !== false && (
              <div className="hidden flex-1 max-w-xl mx-8 md:block relative" ref={desktopSearchRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={desktopSearch.query}
                    onChange={(e) => desktopSearch.search(e.target.value)}
                    onFocus={() => { if (desktopSearch.results.length > 0) desktopSearch.setOpen(true); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && desktopSearch.query.trim()) {
                        navigate({ to: "/search", search: { q: desktopSearch.query.trim() } as any });
                        desktopSearch.clear();
                      }
                    }}
                    placeholder={header?.search_placeholder || "Caută produse, categorii, arome..."}
                    className="w-full rounded-full border border-border bg-secondary px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button
                    onClick={() => {
                      if (desktopSearch.query.trim()) {
                        navigate({ to: "/search", search: { q: desktopSearch.query.trim() } as any });
                        desktopSearch.clear();
                      }
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-foreground p-2 text-primary-foreground transition hover:bg-accent"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                {/* Search dropdown */}
                {desktopSearch.open && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                    {desktopSearch.loading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Se caută...</div>
                    ) : desktopSearch.results.length === 0 && desktopSearch.categoryResults.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Niciun rezultat pentru „{desktopSearch.query}"</p>
                        <Link
                          to="/search"
                          search={{ q: desktopSearch.query.trim() } as any}
                          onClick={() => desktopSearch.clear()}
                          className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                        >
                          Caută în catalog →
                        </Link>
                      </div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto">
                        {desktopSearch.categoryResults.length > 0 && (
                          <>
                            <div className="px-4 pt-3 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorii</div>
                            <div className="divide-y divide-border">
                              {desktopSearch.categoryResults.map((cat) => (
                                <Link
                                  key={cat.id}
                                  to="/categorie/$slug"
                                  params={{ slug: cat.slug }}
                                  onClick={() => desktopSearch.clear()}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition"
                                >
                                  {cat.image_url ? (
                                    <img src={cat.image_url} alt={cat.name} className="h-10 w-10 rounded-lg object-cover bg-muted" />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent text-lg">
                                      {cat.icon || "📁"}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                                    <span className="text-xs text-muted-foreground">Categorie</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </>
                        )}
                        {desktopSearch.results.length > 0 && (
                          <>
                            <div className="px-4 pt-3 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produse</div>
                            <div className="divide-y divide-border">
                              {desktopSearch.results.map((p) => (
                                <Link
                                  key={p.id}
                                  to="/produs/$slug"
                                  params={{ slug: p.slug }}
                                  onClick={() => desktopSearch.clear()}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition"
                                >
                                  {p.image_url && (
                                    <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover bg-muted" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <HighlightText text={p.name} query={desktopSearch.query} className="text-sm font-medium text-foreground truncate block" />
                                    {p.short_description && (
                                      <HighlightText text={p.short_description} query={desktopSearch.query} className="text-xs text-muted-foreground truncate block mt-0.5" />
                                    )}
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-sm font-bold text-accent">{p.price} RON</span>
                                      {p.old_price && (
                                        <span className="text-xs text-muted-foreground line-through">{p.old_price} RON</span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {desktopSearch.query.trim().length >= 2 && (
                      <Link
                        to="/search"
                        search={{ q: desktopSearch.query.trim() } as any}
                        onClick={() => desktopSearch.clear()}
                        className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-accent hover:bg-secondary transition"
                      >
                        Vezi toate rezultatele →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Desktop icons + mobile hamburger */}
            <div className="flex items-center gap-3 md:gap-4 text-sm text-muted-foreground">
              {header?.show_compare !== false && (
                <Link to="/compare" className="hidden md:flex items-center gap-1 hover:text-foreground transition">
                  <GitCompare className="h-5 w-5" />
                  Compară
                </Link>
              )}
              {header?.show_favorites !== false && (
                <Link to="/account/favorites" className="hidden md:flex items-center gap-1 hover:text-foreground transition">
                  <Heart className="h-5 w-5" />
                  Favorite
                </Link>
              )}
              {user && userPoints !== null && userPoints > 0 && (
                <Link to="/account" className="hidden md:flex items-center gap-1 text-accent hover:text-foreground transition">
                  <Star className="h-4 w-4 fill-accent" />
                  <span className="text-xs font-semibold">{userPoints} pts</span>
                </Link>
              )}
              {user && (
                <Link to="/account/notifications" className="relative flex items-center hover:text-foreground transition" aria-label="Notificări">
                  <Bell className="h-5 w-5" />
                  {unreadNotif > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                      {unreadNotif > 9 ? "9+" : unreadNotif}
                    </span>
                  )}
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
                onClick={() => setMobileOpen(true)}
                className="md:hidden flex items-center justify-center rounded-md p-1.5 hover:bg-secondary transition"
                aria-label="Deschide meniu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop nav with mega-menu */}
        <nav className="hidden md:block border-b border-border bg-card relative">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 text-sm font-medium">
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

              {megaMenuOpen && categories.length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-0 flex w-[600px] rounded-b-xl border border-border bg-card shadow-xl">
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
                        <span>{cat.name}</span>
                        <span className="text-xs transition-transform" style={{ transform: activeCategory === cat.id ? "translateX(4px)" : undefined }}>›</span>
                      </Link>
                    ))}
                  </div>
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
            <Link to="/gift-card" className="transition hover:text-foreground" activeProps={{ className: "text-accent font-semibold" }}>
              Card Cadou
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile menu - Sheet drawer from left */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Meniu navigare</SheetTitle>
          </SheetHeader>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              Mama Lucica
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-1.5 hover:bg-secondary transition"
              aria-label="Închide meniu"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Mobile search */}
          {header?.show_search !== false && (
            <div className="p-4 border-b border-border" ref={mobileSearchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={mobileSearch.query}
                  onChange={(e) => mobileSearch.search(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mobileSearch.query.trim()) {
                      navigate({ to: "/search", search: { q: mobileSearch.query.trim() } as any });
                      mobileSearch.clear();
                      setMobileOpen(false);
                    }
                  }}
                  placeholder={header?.search_placeholder || "Caută produse..."}
                  className="w-full rounded-full border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button
                  onClick={() => {
                    if (mobileSearch.query.trim()) {
                      navigate({ to: "/search", search: { q: mobileSearch.query.trim() } as any });
                      mobileSearch.clear();
                      setMobileOpen(false);
                    }
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-foreground p-2 text-primary-foreground"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Mobile search results */}
              {mobileSearch.open && (
                <div className="mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                  {mobileSearch.loading ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">Se caută...</div>
                  ) : mobileSearch.results.length === 0 && mobileSearch.categoryResults.length === 0 ? (
                    <div className="p-3 text-center">
                      <p className="text-sm text-muted-foreground">Niciun rezultat pentru „{mobileSearch.query}"</p>
                      <Link
                        to="/search"
                        search={{ q: mobileSearch.query.trim() } as any}
                        onClick={() => { mobileSearch.clear(); setMobileOpen(false); }}
                        className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                      >
                        Caută în catalog →
                      </Link>
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                      {mobileSearch.categoryResults.length > 0 && (
                        <>
                          <div className="px-3 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorii</div>
                          <div className="divide-y divide-border">
                            {mobileSearch.categoryResults.map((cat) => (
                              <Link
                                key={cat.id}
                                to="/categorie/$slug"
                                params={{ slug: cat.slug }}
                                onClick={() => { mobileSearch.clear(); setMobileOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm">
                                  {cat.icon || "📁"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                                  <span className="text-xs text-muted-foreground">Categorie</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                      {mobileSearch.results.length > 0 && (
                        <>
                          <div className="px-3 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produse</div>
                          <div className="divide-y divide-border">
                            {mobileSearch.results.map((p) => (
                              <Link
                                key={p.id}
                                to="/produs/$slug"
                                params={{ slug: p.slug }}
                                onClick={() => { mobileSearch.clear(); setMobileOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition"
                              >
                                {p.image_url && (
                                  <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-muted" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <HighlightText text={p.name} query={mobileSearch.query} className="text-sm font-medium text-foreground truncate block" />
                                  {p.short_description && (
                                    <HighlightText text={p.short_description} query={mobileSearch.query} className="text-xs text-muted-foreground truncate block mt-0.5" />
                                  )}
                                  <span className="text-xs font-bold text-accent">{p.price} RON</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {mobileSearch.query.trim().length >= 2 && (mobileSearch.results.length > 0 || mobileSearch.categoryResults.length > 0) && (
                    <Link
                      to="/search"
                      search={{ q: mobileSearch.query.trim() } as any}
                      onClick={() => { mobileSearch.clear(); setMobileOpen(false); }}
                      className="block border-t border-border px-3 py-2.5 text-center text-sm font-medium text-accent hover:bg-secondary transition"
                    >
                      Vezi toate rezultatele →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav links */}
          <div className="p-3 space-y-0.5">
            <MobileLink to="/" icon={<Home className="h-5 w-5" />} label="Acasă" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/catalog" icon={<Package className="h-5 w-5" />} label="Toate Produsele" onClick={() => setMobileOpen(false)} />

            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/categorie/$slug"
                params={{ slug: cat.slug }}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition pl-8"
              >
                {cat.name}
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
            <MobileLink to="/gift-card" icon={<Gift className="h-5 w-5" />} label="Card Cadou" onClick={() => setMobileOpen(false)} />
          </div>

          <div className="mx-4 border-t border-border" />

          {/* Utility links */}
          <div className="p-3 space-y-0.5">
            {header?.show_compare !== false && (
              <MobileLink to="/compare" icon={<GitCompare className="h-5 w-5" />} label="Compară" onClick={() => setMobileOpen(false)} />
            )}
            {header?.show_favorites !== false && (
              <MobileLink to="/account/favorites" icon={<Heart className="h-5 w-5" />} label="Favorite" onClick={() => setMobileOpen(false)} />
            )}
            <MobileLink to="/account" icon={<User className="h-5 w-5" />} label="Contul Meu" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/track-order" icon={<Search className="h-5 w-5" />} label="Urmărește Comanda" onClick={() => setMobileOpen(false)} />
          </div>

          {/* Contact */}
          {(general?.phone || general?.email) && (
            <>
              <div className="mx-4 border-t border-border" />
              <div className="p-4 space-y-2">
                {general?.contact_phone && (
                  <a href={`tel:${general.contact_phone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition">
                    <Phone className="h-4 w-4" />
                    {general.contact_phone}
                  </a>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
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
