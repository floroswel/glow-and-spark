import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Search, ChevronDown, ChevronUp, Mail, Phone, MapPin,
  ShoppingCart, Download, TrendingUp, ArrowUpDown, Eye, X,
  ChevronLeft, ChevronRight, Star, Calendar, Crown, UserCheck
} from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

const PAGE_SIZE = 25;

function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [aggregateStats, setAggregateStats] = useState({ total: 0, activeCount: 0, vipCount: 0, newThisMonth: 0, totalOrders: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [viewing, setViewing] = useState<any>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Debounce search (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filterType]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("*", { count: "exact" });
    if (debouncedSearch) {
      const s = debouncedSearch.replace(/[%,()]/g, "");
      if (s) q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%`);
    }
    q = q.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data: profiles, count } = await q;

    const phones = (profiles || []).map((p: any) => p.phone).filter(Boolean);
    const userIds = (profiles || []).map((p: any) => p.user_id);

    const [ordersRes, addressesRes] = await Promise.all([
      phones.length ? supabase.from("orders").select("*").in("customer_phone", phones) : Promise.resolve({ data: [] as any[] }),
      userIds.length ? supabase.from("addresses").select("user_id, id").in("user_id", userIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const orders = (ordersRes as any).data || [];
    const addresses = (addressesRes as any).data || [];
    setAllOrders(orders);

    const enriched = (profiles || []).map((p: any) => {
      const userAddresses = addresses.filter((a: any) => a.user_id === p.user_id);
      const userOrders = p.phone ? orders.filter((o: any) => o.customer_phone === p.phone).sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1)) : [];
      const lastOrder = userOrders[0];
      return {
        ...p,
        orderCount: userOrders.length,
        totalSpent: userOrders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total || 0), 0),
        addressCount: userAddresses.length,
        matchedEmail: userOrders[0]?.customer_email || null,
        lastOrderDate: lastOrder?.created_at || null,
        avgOrderValue: userOrders.length ? userOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0) / userOrders.length : 0,
      };
    });
    setCustomers(enriched);
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, debouncedSearch]);

  // Load aggregate stats independent of pagination
  const loadStats = useCallback(async () => {
    const [profilesRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("created_at, phone"),
      supabase.from("orders").select("customer_phone, total, status"),
    ]);
    const profiles = profilesRes.data || [];
    const orders = ordersRes.data || [];
    const phoneSet = new Set(orders.map((o: any) => o.customer_phone).filter(Boolean));
    const activeCount = profiles.filter((p: any) => p.phone && phoneSet.has(p.phone)).length;
    const totalsByPhone: Record<string, number> = {};
    let totalSpent = 0;
    let totalOrders = 0;
    orders.forEach((o: any) => {
      totalOrders++;
      if (o.status !== "cancelled") {
        const t = Number(o.total || 0);
        totalSpent += t;
        if (o.customer_phone) totalsByPhone[o.customer_phone] = (totalsByPhone[o.customer_phone] || 0) + t;
      }
    });
    const vipCount = profiles.filter((p: any) => p.phone && (totalsByPhone[p.phone] || 0) >= 500).length;
    const now = new Date();
    const newThisMonth = profiles.filter((p: any) => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    setAggregateStats({ total: profiles.length, activeCount, vipCount, newThisMonth, totalOrders, totalSpent });
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Apply VIP/with-orders filter and sort on the loaded page (computed metrics)
  const filtered = useMemo(() => {
    let list = customers.filter(c => {
      if (filterType === "with_orders") return c.orderCount > 0;
      if (filterType === "no_orders") return c.orderCount === 0;
      if (filterType === "vip") return c.totalSpent >= 500;
      return true;
    });
    list.sort((a: any, b: any) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [customers, sortField, sortDir, filterType]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginated = filtered;


  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0);
  const vipCount = customers.filter(c => c.totalSpent >= 500).length;
  const activeCount = customers.filter(c => c.orderCount > 0).length;
  const newThisMonth = customers.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleExportCSV = () => {
    const headers = "Nume,Telefon,Email,Comenzi,Total Cheltuit,Valoare Medie,Adrese,Ultima Comandă,Data Înregistrare\n";
    const rows = filtered.map(c =>
      `"${c.full_name || ""}","${c.phone || ""}","${c.matchedEmail || ""}",${c.orderCount},${c.totalSpent.toFixed(2)},${c.avgOrderValue.toFixed(2)},${c.addressCount},"${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("ro-RO") : "—"}","${new Date(c.created_at).toLocaleDateString("ro-RO")}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `clienti_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    showToast("📥 CSV exportat!");
  };

  const getCustomerOrders = (customer: any) => {
    if (!customer.phone) return [];
    return allOrders.filter((o: any) => o.customer_phone === customer.phone);
  };

  const selectClass = "rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none";
  const thBtn = "flex items-center gap-1 cursor-pointer hover:text-foreground transition";

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      <div className="h-96 bg-muted animate-pulse rounded-xl" />
    </div>
  );

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Clienți</h1>
          <p className="text-sm text-muted-foreground">{customers.length} clienți · {activeCount} activi · {newThisMonth} noi luna aceasta</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total clienți", value: customers.length, icon: Users, color: "text-foreground" },
          { label: "Activi", value: activeCount, icon: UserCheck, color: "text-chart-2" },
          { label: "VIP (500+ RON)", value: vipCount, icon: Crown, color: "text-accent" },
          { label: "Noi luna asta", value: newThisMonth, icon: Calendar, color: "text-chart-1" },
          { label: "Total comenzi", value: totalOrders, icon: ShoppingCart, color: "text-chart-4" },
          { label: "Venituri", value: `${(totalSpent / 1000).toFixed(1)}k RON`, icon: TrendingUp, color: "text-chart-2" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Caută după nume, telefon sau email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
          <option value="all">Toți clienții</option>
          <option value="with_orders">Cu comenzi</option>
          <option value="no_orders">Fără comenzi</option>
          <option value="vip">VIP (500+ RON)</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3"><button onClick={() => handleSort("full_name")} className={thBtn}><span className="font-medium text-muted-foreground">Client</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
              <th className="text-center px-4 py-3"><button onClick={() => handleSort("orderCount")} className={thBtn}><span className="font-medium text-muted-foreground">Comenzi</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="text-right px-4 py-3"><button onClick={() => handleSort("totalSpent")} className={thBtn + " justify-end"}><span className="font-medium text-muted-foreground">Total</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="text-right px-4 py-3 hidden lg:table-cell font-medium text-muted-foreground">Medie</th>
              <th className="text-center px-4 py-3 hidden xl:table-cell"><button onClick={() => handleSort("created_at")} className={thBtn}><span className="font-medium text-muted-foreground">Înregistrat</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="w-16 px-4 py-3 text-right font-medium text-muted-foreground">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((c) => (
              <tr key={c.id} className="hover:bg-secondary/30 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${c.totalSpent >= 500 ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {c.totalSpent >= 500 ? <Crown className="h-4 w-4" /> : (c.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{c.full_name || "—"}</p>
                      {c.lastOrderDate && <p className="text-[10px] text-muted-foreground">Ultima: {new Date(c.lastOrderDate).toLocaleDateString("ro-RO")}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.matchedEmail || "—"}</p>
                  <p className="text-xs text-muted-foreground">{c.phone || "—"}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.orderCount > 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                    {c.orderCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">{c.totalSpent.toFixed(0)} RON</td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{c.avgOrderValue.toFixed(0)} RON</td>
                <td className="px-4 py-3 text-center text-muted-foreground text-xs hidden xl:table-cell">{new Date(c.created_at).toLocaleDateString("ro-RO")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewing(c)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-accent transition">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun client găsit.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} din {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pNum => (
              <button key={pNum} onClick={() => setPage(pNum)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${page === pNum ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>{pNum}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Customer detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setViewing(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${viewing.totalSpent >= 500 ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                  {viewing.totalSpent >= 500 ? <Crown className="h-5 w-5" /> : (viewing.full_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">{viewing.full_name || "Client"}</h2>
                  <p className="text-xs text-muted-foreground">Înregistrat: {new Date(viewing.created_at).toLocaleDateString("ro-RO")}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Comenzi", value: viewing.orderCount },
                  { label: "Total", value: `${viewing.totalSpent.toFixed(0)} RON` },
                  { label: "Medie", value: `${viewing.avgOrderValue.toFixed(0)} RON` },
                  { label: "Adrese", value: viewing.addressCount },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-secondary p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground truncate">{viewing.matchedEmail || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="text-sm text-foreground">{viewing.phone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Order history */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Istoric comenzi</h3>
                {getCustomerOrders(viewing).length > 0 ? (
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {getCustomerOrders(viewing).map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-mono font-medium text-foreground">{o.order_number}</p>
                          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")} · {(Array.isArray(o.items) ? o.items : []).length} produse</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{Number(o.total).toFixed(2)} RON</p>
                          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${o.status === "completed" || o.status === "delivered" ? "bg-chart-2/15 text-chart-2" : o.status === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-accent/15 text-accent"}`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nicio comandă</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
