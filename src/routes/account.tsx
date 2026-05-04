import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  LayoutDashboard, ShoppingBag, Heart, MapPin, Settings, LogOut, ChevronRight, Bell, Shield, Repeat,
} from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Contul Meu — Mama Lucica" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountLayout,
});

const allNavItems = [
  { to: "/account", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/account/orders", icon: ShoppingBag, label: "Comenzile Mele" },
  { to: "/account/notifications", icon: Bell, label: "Notificări", badge: true },
  { to: "/account/favorites", icon: Heart, label: "Favorite" },
  { to: "/account/addresses", icon: MapPin, label: "Adrese" },
  { to: "/account/settings", icon: Settings, label: "Setări Cont" },
  { to: "/account/gdpr", icon: Shield, label: "Date Personale (GDPR)", key: "gdpr" },
];

function AccountLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const { settings } = useSiteSettings();

  const navItems = useMemo(() => {
    const gdprEnabled = settings?.gdpr_section_enabled === "true" || settings?.gdpr_section_enabled === true;
    return allNavItems.filter((item) => {
      if ((item as any).key === "gdpr" && !gdprEnabled) return false;
      return true;
    });
  }, [settings]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <TopBar />
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
          <div className="max-w-sm text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground">Autentificare necesară</h1>
            <p className="mt-2 text-sm text-muted-foreground">Trebuie să fii conectat pentru a accesa contul.</p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
            >
              Conectează-te
            </Link>
          </div>
        </div>
        <SiteFooter />
      </>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <>
      <TopBar />
      <SiteHeader />
      <div className="bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition">Acasă</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Contul Meu</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 pb-4 border-b border-border">
                <p className="font-heading text-lg font-bold text-foreground">
                  {profile?.full_name || "Contul Meu"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = item.end
                    ? location.pathname === "/account" || location.pathname === "/account/"
                    : location.pathname.startsWith(item.to) && item.to !== "/account";
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
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {(item as any).badge && unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground min-w-[20px]">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-destructive transition"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                  <span>Deconectare</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile tabs */}
          <div className="lg:hidden overflow-x-auto">
            <div className="flex gap-1 bg-card rounded-xl border border-border p-1 min-w-max">
              {navItems.map((item) => {
                const isActive = item.end
                  ? location.pathname === "/account" || location.pathname === "/account/"
                  : location.pathname.startsWith(item.to) && item.to !== "/account";
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                      isActive
                        ? "bg-accent/15 text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {(item as any).badge && unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground min-w-[18px]">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
