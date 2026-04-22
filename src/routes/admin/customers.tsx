import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, Search, Download, TrendingUp, ArrowUpDown, Eye, X,
  ChevronLeft, ChevronRight, Crown, UserCheck, Calendar, ShoppingCart,
  Mail, Phone, MapPin, Star, Plus, MessageSquare, FileText, Tag,
  Clock, Send, StickyNote, BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

const PAGE_SIZE = 25;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function AdminCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allAddresses, setAllAddresses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [customerNotes, setCustomerNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [viewing, setViewing] = useState<any>(null);
  const [detailTab, setDetailTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const loadData = async () => {
    const [
      { data: profiles },
      { data: orders },
      { data: addresses },
      { data: revs },
      { data: subs },
      { data: comps },
      { data: tix },
      { data: notes },
    ] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("addresses").select("*"),
      supabase.from("product_reviews").select("*"),
      supabase.from("newsletter_subscribers").select("*"),
      supabase.from("complaints").select("*"),
      supabase.from("support_tickets").select("*"),
      supabase.from("customer_notes").select("*").order("created_at", { ascending: false }),
    ]);

    setAllOrders(orders || []);
    setAllAddresses(addresses || []);
    setReviews(revs || []);
    setSubscribers(subs || []);
    setComplaints(comps || []);
    setTickets(tix || []);
    setCustomerNotes(notes || []);

    if (!profiles) { setLoading(false); return; }

    const enriched = profiles.map((p: any) => {
      const userOrders = (orders || []).filter((o: any) =>
        o.customer_phone === p.phone || o.customer_email?.toLowerCase() === p.full_name?.toLowerCase()
      );
      const validOrders = userOrders.filter((o: any) => o.status !== "cancelled");
      const totalSpent = validOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
      const lastOrder = userOrders[0];
      const daysSinceOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / 86400000) : 999;

      return {
        ...p,
        orderCount: userOrders.length,
        totalSpent,
        avgOrderValue: userOrders.length ? totalSpent / userOrders.length : 0,
        addressCount: (addresses || []).filter((a: any) => a.user_id === p.user_id).length,
        matchedEmail: lastOrder?.customer_email || null,
        lastOrderDate: lastOrder?.created_at || null,
        daysSinceOrder,
        segment: totalSpent >= 500 ? "vip" : userOrders.length >= 3 ? "loyal" : daysSinceOrder > 90 ? "inactive" : userOrders.length > 0 ? "regular" : "new",
      };
    });
    setCustomers(enriched);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    let list = customers.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        (c.full_name || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.matchedEmail || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (filterType === "with_orders") return c.orderCount > 0;
      if (filterType === "no_orders") return c.orderCount === 0;
      if (filterType === "vip") return c.segment === "vip";
      if (filterType === "loyal") return c.segment === "loyal";
      if (filterType === "inactive") return c.segment === "inactive";
      if (filterType === "new_30d") {
        const d = new Date(c.created_at);
        return (Date.now() - d.getTime()) < 30 * 86400000;
      }
      return true;
    });
    list.sort((a: any, b: any) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [customers, search, sortField, sortDir, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, filterType]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const segmentConfig: Record<string, { label: string; color: string }> = {
    vip: { label: "VIP", color: "bg-amber-100 text-amber-700" },
    loyal: { label: "Fidel", color: "bg-green-100 text-green-700" },
    regular: { label: "Regular", color: "bg-blue-100 text-blue-700" },
    inactive: { label: "Inactiv", color: "bg-red-100 text-red-700" },
    new: { label: "Nou", color: "bg-purple-100 text-purple-700" },
  };

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0);
  const vipCount = customers.filter(c => c.segment === "vip").length;
  const activeCount = customers.filter(c => c.orderCount > 0).length;
  const newThisMonth = customers.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const avgLifetimeValue = activeCount ? totalSpent / activeCount : 0;

  const handleExportCSV = () => {
    const headers = "Nume,Telefon,Email,Segment,Comenzi,Total,Medie,Ultima Comandă,Înregistrat\n";
    const rows = filtered.map(c =>
      `"${c.full_name || ""}","${c.phone || ""}","${c.matchedEmail || ""}","${segmentConfig[c.segment]?.label || ""}",${c.orderCount},${c.totalSpent.toFixed(2)},${c.avgOrderValue.toFixed(2)},"${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("ro-RO") : "—"}","${new Date(c.created_at).toLocaleDateString("ro-RO")}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `clienti_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    showToast("📥 CSV exportat!");
  };

  const getCustomerOrders = (c: any) => {
    if (!c.phone && !c.matchedEmail) return [];
    return allOrders.filter((o: any) =>
      (c.phone && o.customer_phone === c.phone) ||
      (c.matchedEmail && o.customer_email?.toLowerCase() === c.matchedEmail.toLowerCase())
    );
  };

  const getCustomerAddresses = (c: any) => allAddresses.filter((a: any) => a.user_id === c.user_id);
  const getCustomerReviews = (c: any) => reviews.filter((r: any) => r.user_id === c.user_id);
  const getCustomerComplaints = (c: any) => complaints.filter((co: any) => co.customer_email?.toLowerCase() === c.matchedEmail?.toLowerCase());
  const getCustomerTickets = (c: any) => tickets.filter((t: any) => t.customer_email?.toLowerCase() === c.matchedEmail?.toLowerCase());
  const getCustomerNotes = (c: any) => customerNotes.filter((n: any) => n.customer_user_id === c.user_id);
  const isSubscribed = (c: any) => subscribers.some((s: any) => s.email?.toLowerCase() === c.matchedEmail?.toLowerCase() && s.is_active);

  const handleAddNote = async () => {
    if (!newNote.trim() || !viewing) return;
    setSavingNote(true);
    await supabase.from("customer_notes").insert({
      customer_user_id: viewing.user_id,
      note: newNote.trim(),
      created_by: user?.id,
    });
    setNewNote("");
    setSavingNote(false);
    const { data } = await supabase.from("customer_notes").select("*").order("created_at", { ascending: false });
    setCustomerNotes(data || []);
    showToast("✅ Notă adăugată!");
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-96" />
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

      {/* KPI */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total clienți", value: customers.length, icon: Users, color: "text-foreground" },
          { label: "Activi", value: activeCount, icon: UserCheck, color: "text-chart-2" },
          { label: "VIP", value: vipCount, icon: Crown, color: "text-accent" },
          { label: "Noi luna asta", value: newThisMonth, icon: Calendar, color: "text-chart-1" },
          { label: "LTV Mediu", value: `${avgLifetimeValue.toFixed(0)} RON`, icon: BarChart3, color: "text-chart-4" },
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
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none">
          <option value="all">Toți clienții</option>
          <option value="with_orders">Cu comenzi</option>
          <option value="no_orders">Fără comenzi</option>
          <option value="vip">VIP (500+ RON)</option>
          <option value="loyal">Fideli (3+ comenzi)</option>
          <option value="inactive">Inactivi (90+ zile)</option>
          <option value="new_30d">Noi (30 zile)</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3"><button onClick={() => handleSort("full_name")} className="flex items-center gap-1 cursor-pointer hover:text-foreground"><span className="font-medium text-muted-foreground">Client</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Segment</th>
              <th className="text-center px-4 py-3"><button onClick={() => handleSort("orderCount")} className="flex items-center gap-1 cursor-pointer hover:text-foreground"><span className="font-medium text-muted-foreground">Comenzi</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="text-right px-4 py-3"><button onClick={() => handleSort("totalSpent")} className="flex items-center gap-1 cursor-pointer hover:text-foreground justify-end"><span className="font-medium text-muted-foreground">Total</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="text-right px-4 py-3 hidden lg:table-cell font-medium text-muted-foreground">AOV</th>
              <th className="text-center px-4 py-3 hidden xl:table-cell font-medium text-muted-foreground">Înregistrat</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((c) => {
              const seg = segmentConfig[c.segment] || segmentConfig.new;
              return (
                <tr key={c.id} className="hover:bg-secondary/30 transition cursor-pointer" onClick={() => { setViewing(c); setDetailTab("overview"); }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${c.segment === "vip" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                        {c.segment === "vip" ? <Crown className="h-4 w-4" /> : (c.full_name || "?")[0].toUpperCase()}
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
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${seg.color}`}>{seg.label}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.orderCount > 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>{c.orderCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{c.totalSpent.toFixed(0)} RON</td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{c.avgOrderValue.toFixed(0)} RON</td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs hidden xl:table-cell">{new Date(c.created_at).toLocaleDateString("ro-RO")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setViewing(c); setDetailTab("overview"); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-accent transition">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
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
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              return start + i;
            }).filter(n => n <= totalPages).map(pNum => (
              <button key={pNum} onClick={() => setPage(pNum)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${page === pNum ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>{pNum}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-border p-2 text-sm disabled:opacity-40 hover:bg-secondary transition"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* ===== Customer 360° Detail Drawer ===== */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-card shadow-2xl animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${viewing.segment === "vip" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                    {viewing.segment === "vip" ? <Crown className="h-5 w-5" /> : (viewing.full_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground">{viewing.full_name || "Client"}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${segmentConfig[viewing.segment]?.color}`}>{segmentConfig[viewing.segment]?.label}</span>
                      {isSubscribed(viewing) && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700">Newsletter</span>}
                      <span className="text-xs text-muted-foreground">Înregistrat: {new Date(viewing.created_at).toLocaleDateString("ro-RO")}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewing(null)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 overflow-x-auto">
                {[
                  { id: "overview", label: "Profil", icon: Users },
                  { id: "orders", label: "Comenzi", icon: ShoppingCart },
                  { id: "activity", label: "Activitate", icon: Clock },
                  { id: "support", label: "Support", icon: MessageSquare },
                  { id: "notes", label: "Note", icon: StickyNote },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setDetailTab(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${detailTab === tab.id ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary"}`}>
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* === OVERVIEW TAB === */}
              {detailTab === "overview" && (
                <>
                  {/* Quick stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Comenzi", value: viewing.orderCount },
                      { label: "Total", value: `${viewing.totalSpent.toFixed(0)} RON` },
                      { label: "AOV", value: `${viewing.avgOrderValue.toFixed(0)} RON` },
                      { label: "Adrese", value: viewing.addressCount },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg bg-secondary p-3 text-center">
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Contact */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Date de contact</h3>
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
                  </div>

                  {/* Addresses */}
                  {getCustomerAddresses(viewing).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Adrese salvate</h3>
                      <div className="space-y-2">
                        {getCustomerAddresses(viewing).map((a: any) => (
                          <div key={a.id} className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium">{a.full_name} {a.is_default && <span className="text-[10px] text-accent ml-1">(implicit)</span>}</p>
                              <p className="text-muted-foreground">{a.address}, {a.city}, {a.county} {a.postal_code}</p>
                              {a.phone && <p className="text-muted-foreground text-xs">{a.phone}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marketing */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Marketing</h3>
                    <div className="rounded-lg bg-secondary p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Newsletter</span>
                        <span className={isSubscribed(viewing) ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {isSubscribed(viewing) ? "Abonat ✓" : "Neabonat"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Segment</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${segmentConfig[viewing.segment]?.color}`}>{segmentConfig[viewing.segment]?.label}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Zile de la ultima comandă</span>
                        <span className="text-foreground font-medium">{viewing.daysSinceOrder < 999 ? `${viewing.daysSinceOrder} zile` : "—"}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* === ORDERS TAB === */}
              {detailTab === "orders" && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Istoric comenzi ({getCustomerOrders(viewing).length})</h3>
                  {getCustomerOrders(viewing).length > 0 ? (
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {getCustomerOrders(viewing).map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-mono font-medium text-foreground">{o.order_number}</p>
                            <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")} · {(Array.isArray(o.items) ? o.items : []).length} produse</p>
                            <p className="text-xs text-muted-foreground">{o.payment_method} · {o.city}, {o.county}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{Number(o.total).toFixed(2)} RON</p>
                            <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>
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
              )}

              {/* === ACTIVITY TAB === */}
              {detailTab === "activity" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Timeline activitate</h3>
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                    {/* Registration */}
                    <div className="relative">
                      <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-purple-500 ring-2 ring-card" />
                      <p className="text-sm font-medium">Cont creat</p>
                      <p className="text-xs text-muted-foreground">{new Date(viewing.created_at).toLocaleString("ro-RO")}</p>
                    </div>
                    {/* Orders */}
                    {getCustomerOrders(viewing).slice(0, 10).map((o: any) => (
                      <div key={o.id} className="relative">
                        <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-accent ring-2 ring-card" />
                        <p className="text-sm font-medium">Comandă #{o.order_number} — {Number(o.total).toFixed(0)} RON</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ro-RO")} · {o.status}</p>
                      </div>
                    ))}
                    {/* Reviews */}
                    {getCustomerReviews(viewing).map((r: any) => (
                      <div key={r.id} className="relative">
                        <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-yellow-500 ring-2 ring-card" />
                        <p className="text-sm font-medium">Recenzie — {"★".repeat(r.rating)} {r.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ro-RO")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === SUPPORT TAB === */}
              {detailTab === "support" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Tichete support</h3>
                  {getCustomerTickets(viewing).length > 0 ? (
                    <div className="space-y-2">
                      {getCustomerTickets(viewing).map((t: any) => (
                        <div key={t.id} className="rounded-lg border border-border p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{t.subject}</p>
                              <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("ro-RO")}</p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === "open" ? "bg-red-100 text-red-700" : t.status === "resolved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{t.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground italic">Niciun tichet</p>}

                  <h3 className="text-sm font-semibold text-foreground mt-6">Reclamații</h3>
                  {getCustomerComplaints(viewing).length > 0 ? (
                    <div className="space-y-2">
                      {getCustomerComplaints(viewing).map((co: any) => (
                        <div key={co.id} className="rounded-lg border border-border p-3">
                          <p className="text-sm font-medium">{co.subject}</p>
                          <p className="text-xs text-muted-foreground">{co.priority} · {co.status} · {new Date(co.created_at).toLocaleDateString("ro-RO")}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground italic">Nicio reclamație</p>}
                </div>
              )}

              {/* === NOTES TAB === */}
              {detailTab === "notes" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Note interne admin</h3>
                  <div className="flex gap-2">
                    <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Adaugă o notă..."
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      onKeyDown={e => e.key === "Enter" && handleAddNote()} />
                    <button onClick={handleAddNote} disabled={savingNote || !newNote.trim()}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {getCustomerNotes(viewing).map((n: any) => (
                      <div key={n.id} className="rounded-lg bg-secondary p-3">
                        <p className="text-sm">{n.note}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("ro-RO")}</p>
                      </div>
                    ))}
                    {!getCustomerNotes(viewing).length && <p className="text-sm text-muted-foreground italic">Nicio notă</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
