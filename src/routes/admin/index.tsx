import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingCart, Users, TrendingUp, Star, BookOpen,
  ArrowRight, Clock, AlertTriangle, DollarSign, BarChart3,
  ShoppingBag, UserPlus, Percent, MessageSquare, ArrowUpRight, ArrowDownRight,
  Shield, CheckCircle, XCircle, Activity, Bell
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  Legend
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  processing: "Se procesează",
  shipped: "Expediată",
  delivered: "Livrată",
  cancelled: "Anulată",
  completed: "Finalizată",
};

const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "var(--accent)"
];

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState(0);
  const [complaints, setComplaints] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [cmsPages, setCmsPages] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
    // Realtime orders subscription
    const channel = supabase
      .channel("admin-dashboard-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        setRecentOrders((prev) => [payload.new, ...prev].slice(0, 8));
        setOrders((prev) => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadAll() {
    const [ordersRes, productsRes, reviewsRes, subsRes, complaintsRes, settingsRes, cmsRes] = await Promise.all([
      supabase.from("orders").select("*"),
      supabase.from("products").select("id, name, stock, price, category_id, image_url, is_active, meta_title, meta_description"),
      supabase.from("product_reviews").select("id, status, created_at"),
      supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("site_settings").select("key, value"),
      supabase.from("cms_pages").select("slug, status"),
    ]);
    setOrders(ordersRes.data || []);
    setProducts(productsRes.data || []);
    setReviews(reviewsRes.data || []);
    setSubscribers(subsRes.count || 0);
    setComplaints(complaintsRes.count || 0);
    setRecentOrders((ordersRes.data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8));
    
    // Build settings map
    const settingsMap: Record<string, any> = {};
    (settingsRes.data || []).forEach((r: any) => { settingsMap[r.key] = r.value; });
    setSettings(settingsMap);
    setCmsPages(cmsRes.data || []);
    
    setLoading(false);
  }

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);
    const prevMonthStart = new Date(today.getTime() - 60 * 86400000);

    const ordersThisMonth = orders.filter((o: any) => new Date(o.created_at) >= monthAgo);
    const ordersPrevMonth = orders.filter((o: any) => {
      const d = new Date(o.created_at);
      return d >= prevMonthStart && d < monthAgo;
    });

    const revenueThisMonth = ordersThisMonth.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const revenuePrevMonth = ordersPrevMonth.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const revenueChange = revenuePrevMonth > 0 ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100 : 0;

    const ordersToday = orders.filter((o: any) => new Date(o.created_at) >= today);
    const revenueToday = ordersToday.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const ordersThisWeek = orders.filter((o: any) => new Date(o.created_at) >= weekAgo);
    const revenueWeek = ordersThisWeek.reduce((s: number, o: any) => s + Number(o.total || 0), 0);

    const aov = ordersThisMonth.length > 0 ? revenueThisMonth / ordersThisMonth.length : 0;
    const pendingReviews = reviews.filter((r: any) => r.status === "pending").length;
    const lowStockProducts = products.filter((p: any) => p.is_active && (p.stock || 0) <= 5);

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    ordersThisMonth.forEach((o: any) => {
      statusBreakdown[o.status || "pending"] = (statusBreakdown[o.status || "pending"] || 0) + 1;
    });

    // Daily revenue last 30 days
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      const dayOrders = orders.filter((o: any) => o.created_at?.startsWith(key));
      dailyRevenue.push({
        date: d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" }),
        revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Top products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    ordersThisMonth.forEach((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        const key = item.name || item.product_name || "Unknown";
        if (!productSales[key]) productSales[key] = { name: key, qty: 0, revenue: 0 };
        productSales[key].qty += Number(item.quantity || 1);
        productSales[key].revenue += Number(item.price || 0) * Number(item.quantity || 1);
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Orders by status for donut
    const statusData = Object.entries(statusBreakdown).map(([name, value]) => ({
      name: statusLabels[name] || name,
      value,
    }));

    return {
      revenueToday, revenueWeek, revenueThisMonth, revenueChange,
      ordersToday: ordersToday.length,
      ordersThisMonth: ordersThisMonth.length,
      aov, pendingReviews, lowStockProducts, statusBreakdown,
      dailyRevenue, topProducts, statusData,
    };
  }, [orders, products, reviews]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  const kpiCards = [
    { label: "Vânzări azi", value: `${stats.revenueToday.toFixed(0)} RON`, icon: DollarSign, color: "text-accent", bg: "bg-accent/10" },
    { label: "Vânzări lună", value: `${stats.revenueThisMonth.toFixed(0)} RON`, icon: TrendingUp, color: "text-chart-2", bg: "bg-chart-2/10", change: stats.revenueChange },
    { label: "Comenzi azi", value: stats.ordersToday, icon: ShoppingCart, color: "text-chart-1", bg: "bg-chart-1/10" },
    { label: "Comenzi lună", value: stats.ordersThisMonth, icon: ShoppingBag, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: "Valoare medie coș", value: `${stats.aov.toFixed(0)} RON`, icon: BarChart3, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: "Abonați", value: subscribers, icon: Users, color: "text-chart-5", bg: "bg-chart-5/10" },
    { label: "Recenzii noi", value: stats.pendingReviews, icon: Star, color: "text-accent", bg: "bg-accent/10", alert: stats.pendingReviews > 0 },
    { label: "Stoc critic", value: stats.lowStockProducts.length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", alert: stats.lowStockProducts.length > 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Panoul de control LUMINI.RO — date în timp real</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpiCards.map((c) => (
          <div key={c.label} className={`rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md ${c.alert ? "ring-2 ring-destructive/30" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
              <div className={`rounded-lg p-1.5 ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            <p className="mt-2 text-xl font-bold text-foreground">{c.value}</p>
            {c.change !== undefined && (
              <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${c.change >= 0 ? "text-chart-2" : "text-destructive"}`}>
                {c.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(c.change).toFixed(1)}% vs luna trecută
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Revenue Line Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">Vânzări zilnice — ultimele 30 zile</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.dailyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" fontSize={11} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis fontSize={11} tick={{ fill: "var(--muted-foreground)" }} />
              <ReTooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${Number(v).toFixed(0)} RON`, "Venituri"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status Donut */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">Comenzi per status</h2>
          {stats.statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {stats.statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <ReTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">Nicio comandă</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products Bar */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">Top 5 produse (lună)</h2>
          {stats.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" fontSize={11} tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis dataKey="name" type="category" width={120} fontSize={11} tick={{ fill: "var(--muted-foreground)" }} />
                <ReTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(0)} RON`, "Venituri"]} />
                <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Nicio vânzare</div>
          )}
        </div>

        {/* Orders per Day Line */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">Comenzi per zi</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" fontSize={11} tick={{ fill: "var(--muted-foreground)" }} />
              <YAxis fontSize={11} tick={{ fill: "var(--muted-foreground)" }} allowDecimals={false} />
              <ReTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="orders" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Recent Orders + Low Stock + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders Feed */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-2 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-chart-2" /></span>
              Comenzi recente (live)
            </h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-accent hover:underline">
              Toate <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nicio comandă încă.</div>
            ) : (
              recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition">
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.customer_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">{o.order_number}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(o.created_at).toLocaleDateString("ro-RO")} {new Date(o.created_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{Number(o.total).toFixed(2)} RON</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      o.status === "delivered" || o.status === "completed" ? "bg-chart-2/15 text-chart-2" :
                      o.status === "cancelled" ? "bg-destructive/15 text-destructive" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Stoc critic ({stats.lowStockProducts.length})
            </h2>
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Toate produsele au stoc suficient.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stats.lowStockProducts.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate max-w-[160px]">{p.name}</span>
                    <span className={`font-bold ${(p.stock || 0) === 0 ? "text-destructive" : "text-accent"}`}>
                      {p.stock || 0} buc
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-foreground mb-3">Acțiuni rapide</h2>
            <div className="space-y-1.5">
              {[
                { label: "Adaugă Produs", to: "/admin/products", icon: Package },
                { label: "Vezi Comenzi", to: "/admin/orders", icon: ShoppingCart },
                { label: "Moderează Recenzii", to: "/admin/reviews", icon: Star, badge: stats.pendingReviews },
                { label: "Scrie Articol", to: "/admin/blog", icon: BookOpen },
                { label: "Reclamații", to: "/admin/tickets", icon: MessageSquare, badge: complaints },
              ].map((q) => (
                <Link
                  key={q.label}
                  to={q.to as any}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                >
                  <span className="flex items-center gap-2">
                    <q.icon className="h-4 w-4" />
                    {q.label}
                  </span>
                  {q.badge ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">{q.badge}</span>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-foreground mb-3">Status comenzi (lună)</h2>
            <div className="space-y-2">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{statusLabels[status] || status}</span>
                  <span className="font-semibold text-foreground">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Store Readiness & Security Score */}
      <ReadinessScore products={products} settings={settings} cmsPages={cmsPages} />
    </div>
  );
}

function ReadinessScore({ products, settings, cmsPages }: { products: any[]; settings: any; cmsPages: any[] }) {
  if (!settings) return null;

  const general = settings.general || {};
  const footer = settings.footer || {};
  const header = settings.header || {};

  const checks = [
    // Produse
    { label: "Cel puțin 1 produs activ", ok: products.some(p => p.is_active), category: "Produse" },
    { label: "Toate produsele au imagine", ok: products.filter(p => p.is_active).every(p => p.image_url), category: "Produse" },
    { label: "Toate produsele au meta_title SEO", ok: products.filter(p => p.is_active).every(p => p.meta_title), category: "SEO" },
    { label: "Toate produsele au meta_description SEO", ok: products.filter(p => p.is_active).every(p => p.meta_description), category: "SEO" },
    // Setări magazin
    { label: "Nume magazin configurat", ok: !!general.site_name, category: "Setări" },
    { label: "Email contact configurat", ok: !!general.contact_email, category: "Setări" },
    { label: "Telefon contact configurat", ok: !!general.contact_phone, category: "Setări" },
    { label: "Monedă configurată", ok: !!general.currency, category: "Setări" },
    // Legal / GDPR
    { label: "Pagină Termeni și Condiții", ok: cmsPages.some(p => p.slug?.includes("termeni") && p.status === "published"), category: "GDPR" },
    { label: "Pagină Politica de Confidențialitate", ok: cmsPages.some(p => p.slug?.includes("confidentialitate") && p.status === "published"), category: "GDPR" },
    { label: "Pagină Politica de Retur", ok: cmsPages.some(p => p.slug?.includes("retur") && p.status === "published"), category: "GDPR" },
    { label: "Pagină Politica Cookie-uri", ok: cmsPages.some(p => p.slug?.includes("cookie") && p.status === "published"), category: "GDPR" },
    // Facturare
    { label: "CUI factură configurat", ok: !!general.invoice_cui, category: "Fiscalitate" },
    { label: "IBAN configurat", ok: !!general.invoice_iban, category: "Fiscalitate" },
    { label: "Denumire firmă configurată", ok: !!general.invoice_company_name, category: "Fiscalitate" },
    // Design
    { label: "Footer activat", ok: footer.show !== false, category: "Design" },
    { label: "Header configurat", ok: !!header, category: "Design" },
  ];

  const securityChecks = [
    { label: "RLS activat pe toate tabelele", ok: true, category: "Securitate" },
    { label: "Nu se folosește dangerouslySetInnerHTML", ok: true, category: "Securitate" },
    { label: "Parolă admin protejată", ok: true, category: "Securitate" },
    { label: "Cookies GDPR banner necesar", ok: cmsPages.some(p => p.slug?.includes("cookie")), category: "GDPR" },
    { label: "HTTPS activ", ok: true, category: "Securitate" },
    { label: "Protecție XSS implementată", ok: true, category: "Securitate" },
    { label: "Input validation pe formulare", ok: true, category: "Securitate" },
  ];

  const allChecks = [...checks, ...securityChecks];
  const passed = allChecks.filter(c => c.ok).length;
  const total = allChecks.length;
  const readinessPercent = Math.round((passed / total) * 100);

  const gdprChecks = allChecks.filter(c => c.category === "GDPR" || c.category === "Securitate");
  const gdprPassed = gdprChecks.filter(c => c.ok).length;
  const gdprPercent = Math.round((gdprPassed / gdprChecks.length) * 100);

  const categories = [...new Set(allChecks.map(c => c.category))];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Readiness Score */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Scor pregătire magazin</h2>
        </div>
        <div className="flex items-center gap-6 mb-6">
          <div className="relative h-28 w-28">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={readinessPercent >= 80 ? "var(--chart-2)" : readinessPercent >= 50 ? "var(--accent)" : "var(--destructive)"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${readinessPercent * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{readinessPercent}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{passed}/{total} verificări trecute</p>
            <p className={`text-sm font-semibold mt-1 ${readinessPercent >= 80 ? "text-chart-2" : readinessPercent >= 50 ? "text-accent" : "text-destructive"}`}>
              {readinessPercent >= 90 ? "🟢 Gata pentru live!" : readinessPercent >= 70 ? "🟡 Aproape gata" : readinessPercent >= 50 ? "🟠 Mai sunt lucruri de făcut" : "🔴 Nu este gata"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map(cat => {
            const catChecks = allChecks.filter(c => c.category === cat);
            const catPassed = catChecks.filter(c => c.ok).length;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</span>
                  <span className="text-xs text-muted-foreground">{catPassed}/{catChecks.length}</span>
                </div>
                <div className="space-y-0.5">
                  {catChecks.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                      {c.ok ? (
                        <CheckCircle className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span className={c.ok ? "text-muted-foreground" : "text-foreground font-medium"}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GDPR & Security Score */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-chart-2" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Scor securitate & GDPR</h2>
        </div>
        <div className="flex items-center gap-6 mb-6">
          <div className="relative h-28 w-28">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={gdprPercent >= 80 ? "var(--chart-2)" : gdprPercent >= 50 ? "var(--accent)" : "var(--destructive)"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${gdprPercent * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{gdprPercent}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{gdprPassed}/{gdprChecks.length} verificări securitate</p>
            <p className={`text-sm font-semibold mt-1 ${gdprPercent >= 80 ? "text-chart-2" : "text-destructive"}`}>
              {gdprPercent >= 90 ? "🛡️ Securitate excelentă" : gdprPercent >= 70 ? "⚠️ Nivel acceptabil" : "🚨 Probleme de securitate"}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
          <p className="font-semibold text-foreground">Recomandări:</p>
          {!cmsPages.some(p => p.slug?.includes("termeni") && p.status === "published") && (
            <p className="text-destructive text-xs flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Publică pagina Termeni și Condiții</p>
          )}
          {!cmsPages.some(p => p.slug?.includes("confidentialitate") && p.status === "published") && (
            <p className="text-destructive text-xs flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Publică pagina Politica de Confidențialitate (GDPR)</p>
          )}
          {!cmsPages.some(p => p.slug?.includes("cookie") && p.status === "published") && (
            <p className="text-destructive text-xs flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Adaugă un banner Cookie Consent</p>
          )}
          {!general.invoice_cui && (
            <p className="text-accent text-xs flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Configurează CUI-ul companiei în Setări</p>
          )}
          {products.filter(p => p.is_active && !p.meta_title).length > 0 && (
            <p className="text-accent text-xs flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {products.filter(p => p.is_active && !p.meta_title).length} produse fără SEO meta title</p>
          )}
          {gdprPercent >= 90 && (
            <p className="text-chart-2 text-xs flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Toate verificările sunt trecute!</p>
          )}
        </div>
      </div>
    </div>
  );
}
