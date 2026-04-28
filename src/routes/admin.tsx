import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Palette, LogOut, Menu, X, Tag, FileText, BarChart3,
  CreditCard, Truck, Brain, Server, ChevronDown, ChevronRight,
  Link2, UserCog, Warehouse, Search, Command, Bell, Moon, Sun,
  RotateCcw, Activity, User, Gift, Crown, Percent, FileSpreadsheet,
  Zap, Receipt, Calculator, Cookie, Star, Briefcase
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Lumini.ro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

interface SubItem { to: string; label: string }
interface MenuItem { icon: any; label: string; to?: string; end?: boolean; children?: SubItem[] }
interface MenuSection { title: string; items: MenuItem[] }

const menuSections: MenuSection[] = [
  {
    title: "ACCES RAPID",
    items: [
      { icon: Star, label: "Social Proof", to: "/admin/social-proof" },
      { icon: Cookie, label: "Politica Cookies", to: "/admin/pages" },
      { icon: Briefcase, label: "Date Comerciale", to: "/admin/footer" },
    ],
  },
  {
    title: "PRINCIPAL",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/admin", end: true },
      {
        icon: ShoppingCart, label: "Comenzi",
        children: [
          { to: "/admin/orders", label: "Toate Comenzile" },
          { to: "/admin/returns", label: "Retururi" },
          { to: "/admin/abandoned-carts", label: "Coșuri Abandonate" },
        ],
      },
      {
        icon: Package, label: "Produse",
        children: [
          { to: "/admin/products", label: "Toate Produsele" },
          { to: "/admin/categories", label: "Categorii" },
          { to: "/admin/reviews", label: "Recenzii" },
        ],
      },
      {
        icon: Warehouse, label: "Stoc & Depozit",
        children: [
          { to: "/admin/stock", label: "Dashboard Stoc" },
          { to: "/admin/stock/manager", label: "Manager Stoc" },
          { to: "/admin/stock/warehouses", label: "Depozite" },
          { to: "/admin/stock/movements", label: "Mișcări" },
          { to: "/admin/stock/transfers", label: "Transferuri" },
          { to: "/admin/stock/suppliers", label: "Furnizori" },
          { to: "/admin/stock/purchase-orders", label: "Comenzi Furnizori" },
          { to: "/admin/stock/batches", label: "Loturi" },
          { to: "/admin/stock/alerts", label: "Alerte Stoc" },
        ],
      },
    ],
  },
  {
    title: "CRM & CLIENȚI",
    items: [
      {
        icon: Users, label: "Clienți",
        children: [
          { to: "/admin/customers", label: "Toți Clienții" },
          { to: "/admin/crm", label: "Segmente & Grupuri" },
          { to: "/admin/tickets", label: "Tichete Suport" },
          { to: "/admin/complaints", label: "Reclamații" },
        ],
      },
    ],
  },
  {
    title: "MARKETING",
    items: [
      {
        icon: Tag, label: "Marketing",
        children: [
          { to: "/admin/coupons", label: "Cupoane" },
          { to: "/admin/promotions", label: "Promoții & Campanii" },
          { to: "/admin/subscribers", label: "Abonați Newsletter" },
          { to: "/admin/social-proof", label: "Social Proof" },
          { to: "/admin/popup", label: "Popup" },
          { to: "/admin/gift-cards", label: "Carduri Cadou" },
          { to: "/admin/gift-cards/history", label: "Istoric Carduri Cadou" },
          { to: "/admin/loyalty", label: "Program Fidelitate" },
        ],
      },
    ],
  },
  {
    title: "CONȚINUT",
    items: [
      {
        icon: FileText, label: "Conținut",
        children: [
          { to: "/admin/blog", label: "Blog" },
          { to: "/admin/pages", label: "Pagini CMS" },
          { to: "/admin/content/faq", label: "FAQ" },
          { to: "/admin/content/seo", label: "SEO Global" },
          { to: "/admin/content/email-templates", label: "Șabloane Email" },
          { to: "/admin/media", label: "Media Library" },
          { to: "/admin/content/redirects", label: "Redirecturi" },
        ],
      },
      {
        icon: Palette, label: "Design",
        children: [
          { to: "/admin/theme", label: "Temă & Culori" },
          { to: "/admin/header", label: "Header" },
          { to: "/admin/ticker", label: "Ticker Banner" },
          { to: "/admin/homepage", label: "Homepage" },
          { to: "/admin/footer", label: "Footer" },
        ],
      },
    ],
  },
  {
    title: "FINANȚE & LIVRARE",
    items: [
      {
        icon: CreditCard, label: "Plăți",
        children: [
          { to: "/admin/payments", label: "Metode de Plată" },
          { to: "/admin/transactions", label: "Tranzacții" },
          { to: "/admin/invoices", label: "Facturi" },
          { to: "/admin/tax-settings", label: "Setări Fiscale & TVA" },
        ],
      },
      {
        icon: Truck, label: "Livrare",
        children: [
          { to: "/admin/shipping", label: "Curieri & Tarife" },
          { to: "/admin/tracking", label: "Tracking Colete" },
        ],
      },
    ],
  },
  {
    title: "RAPOARTE & AI",
    items: [
      {
        icon: BarChart3, label: "Rapoarte",
        children: [
          { to: "/admin/reports", label: "Overview" },
          { to: "/admin/reports/top-products", label: "Top Produse" },
          { to: "/admin/reports/profit", label: "Profit & Costuri" },
          { to: "/admin/reports/customers", label: "Rapoarte Clienți" },
          { to: "/admin/reports/conversion", label: "Conversie & Funnel" },
          { to: "/admin/reports/inventory", label: "Inventar & Valoare Stoc" },
        ],
      },
      {
        icon: Brain, label: "AI & Automatizări",
        children: [
          { to: "/admin/ai", label: "AI Generator Hub" },
          { to: "/admin/automations", label: "Automatizări" },
        ],
      },
    ],
  },
  {
    title: "SISTEM",
    items: [
      {
        icon: Server, label: "Sistem",
        children: [
          { to: "/admin/system", label: "System Health" },
          { to: "/admin/activity", label: "Jurnal Activitate" },
          { to: "/admin/settings", label: "Setări Generale" },
          { to: "/admin/settings/checkout", label: "Checkout Config" },
        ],
      },
      { icon: Link2, label: "Integrări", to: "/admin/integrations" },
      { icon: UserCog, label: "Utilizatori", to: "/admin/users" },
      { icon: FileSpreadsheet, label: "Import / Export", to: "/admin/import-export" },
    ],
  },
];

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const { error } = await signIn(email, password);
    if (error) setAuthError(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="font-heading text-2xl font-bold text-center text-foreground">Admin Lumini.ro</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Conectează-te pentru a gestiona magazinul</p>
        {authError && (
          <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{authError}</div>
        )}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" required />
          <input type="password" placeholder="Parolă" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" required />
          <button type="submit" className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground">
            Conectare
          </button>
        </form>
      </div>
    </div>
  );
}

function CollapsibleMenu({ item, sidebarOpen, pathname }: { item: MenuItem; sidebarOpen: boolean; pathname: string }) {
  const isChildActive = item.children?.some(c => pathname.startsWith(c.to)) ?? false;
  const [open, setOpen] = useState(isChildActive);

  if (!item.children) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isChildActive ? "text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {sidebarOpen && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </>
        )}
      </button>
      {open && sidebarOpen && (
        <div className="ml-7 mt-0.5 space-y-0.5 border-l border-border pl-3">
          {item.children.map(child => {
            const active = child.to === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname.startsWith(child.to) && child.to !== "/admin";
            return (
              <Link
                key={child.to}
                to={child.to as any}
                className={`block rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminLayout() {
  const { user, loading, isAdmin, signOut, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return document.documentElement.classList.contains("dark");
    return false;
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user || !isAdmin) return;
    supabase.from("admin_notifications").select("*").eq("is_read", false).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setNotifications(data || []));

    const channel = supabase.channel("admin-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const markRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    if (ids.length === 0) return;
    for (const id of ids) await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLoginForm />;
  }

  // Breadcrumbs
  const pathParts = location.pathname.replace("/admin", "").split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => ({
    label: part.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    to: "/admin/" + pathParts.slice(0, i + 1).join("/"),
  }));

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className={`${sidebarOpen ? "w-60" : "w-14"} fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-card transition-all duration-300`}>
        <div className="flex h-12 items-center justify-between border-b border-border px-3">
          {sidebarOpen && <span className="font-heading text-base font-bold text-foreground">LUMINI<span className="text-accent">.RO</span></span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-3">
          {menuSections.map((section, si) => (
            <div key={si}>
              {sidebarOpen && (
                <div className="px-3 pb-1 pt-2 text-[10px] font-bold tracking-widest text-muted-foreground/60">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  if (item.children) {
                    return <CollapsibleMenu key={item.label} item={item} sidebarOpen={sidebarOpen} pathname={location.pathname} />;
                  }
                  const isActive = item.end
                    ? location.pathname === "/admin" || location.pathname === "/admin/"
                    : location.pathname.startsWith(item.to!) && item.to !== "/admin";
                  return (
                    <Link
                      key={item.to}
                      to={item.to as any}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-2">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-destructive transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Deconectare</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarOpen ? "ml-60" : "ml-14"} transition-all duration-300`}>
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6 py-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/admin" className="hover:text-foreground transition">Dashboard</Link>
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                <Link to={b.to as any} className="hover:text-foreground transition">{b.label}</Link>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-accent/50 hover:text-foreground transition"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Caută...</span>
              <kbd className="ml-2 rounded border border-border px-1 text-[10px]">⌘K</kbd>
            </button>

            {/* Dark mode toggle */}
            <button onClick={toggleDark} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition" title="Schimbă tema">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-border bg-card shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                    <span className="text-sm font-semibold text-foreground">Notificări</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-accent hover:underline">Marchează toate citite</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-muted-foreground">Nicio notificare</div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.id} className={`px-4 py-2.5 hover:bg-muted/30 transition cursor-pointer ${!n.is_read ? "bg-accent/5" : ""}`}
                        onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}>
                        <p className="text-xs font-medium text-foreground">{n.title}</p>
                        {n.message && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{n.message}</p>}
                        <span className="text-[9px] text-muted-foreground">{new Date(n.created_at).toLocaleString("ro-RO")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 rounded-lg px-2 py-1 border border-border bg-secondary/50">
              <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-3.5 w-3.5 text-accent" />
                )}
              </div>
              <span className="text-xs font-medium text-foreground max-w-[100px] truncate">
                {profile?.full_name || user.email?.split("@")[0] || "Admin"}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ErrorBoundary variant="admin">
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <AdminGlobalSearch />
    </div>
  );
}
