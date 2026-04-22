import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Users, Settings,
  Palette, LogOut, Menu, X, Type, TicketPercent, Home, PanelBottom, MessageSquare,
  Tag, Star, FileText, BookOpen, BarChart3, Bell, ShoppingBag
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

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/products", icon: Package, label: "Produse" },
  { to: "/admin/categories", icon: FolderOpen, label: "Categorii" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Comenzi" },
  { to: "/admin/customers", icon: Users, label: "Clienți" },
  { to: "/admin/coupons", icon: Tag, label: "Cupoane" },
  { to: "/admin/reviews", icon: Star, label: "Recenzii" },
  { to: "/admin/blog", icon: BookOpen, label: "Blog" },
  { to: "/admin/pages", icon: FileText, label: "Pagini CMS" },
  { to: "/admin/reports", icon: BarChart3, label: "Rapoarte" },
  { to: "/admin/subscribers", icon: Users, label: "Abonați" },
  { to: "/admin/theme", icon: Palette, label: "Temă & Culori" },
  { to: "/admin/header", icon: Type, label: "Header" },
  { to: "/admin/ticker", icon: TicketPercent, label: "Ticker Banner" },
  { to: "/admin/homepage", icon: Home, label: "Homepage" },
  { to: "/admin/footer", icon: PanelBottom, label: "Footer" },
  { to: "/admin/popup", icon: MessageSquare, label: "Popup" },
  { to: "/admin/social-proof", icon: Bell, label: "Social Proof" },
  { to: "/admin/abandoned-carts", icon: ShoppingBag, label: "Coșuri Abandonate" },
  { to: "/admin/settings", icon: Settings, label: "Setări Generale" },
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

function AdminLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

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

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-card transition-all duration-300`}>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          {sidebarOpen && <span className="font-heading text-lg font-bold text-foreground">LUMINI<span className="text-accent">.RO</span></span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const isActive = item.end
              ? location.pathname === "/admin" || location.pathname === "/admin/"
              : location.pathname.startsWith(item.to) && item.to !== "/admin";
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-2">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-destructive transition"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Deconectare</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
