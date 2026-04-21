import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ChevronDown, ChevronUp, Mail, Phone, MapPin, ShoppingCart, Download, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: allOrders }, { data: allAddresses }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("id, customer_email, customer_phone, total"),
        supabase.from("addresses").select("user_id, id"),
      ]);
      if (!profiles) { setLoading(false); return; }

      const enriched = profiles.map((p: any) => {
        const userAddresses = (allAddresses || []).filter((a: any) => a.user_id === p.user_id);
        // Try to match orders by looking up address user
        const userOrdersByPhone = p.phone ? (allOrders || []).filter((o: any) => o.customer_phone === p.phone) : [];
        return {
          ...p,
          orderCount: userOrdersByPhone.length,
          totalSpent: userOrdersByPhone.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
          addressCount: userAddresses.length,
          email: p.user_id, // user_id is the auth id, email comes from orders
          matchedEmail: userOrdersByPhone[0]?.customer_email || null,
        };
      });
      setCustomers(enriched);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = customers.filter(c =>
      (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.matchedEmail || "").toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a: any, b: any) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [customers, search, sortField, sortDir]);

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0);

  const handleExportCSV = () => {
    const headers = "Nume,Telefon,Email,Comenzi,Total Cheltuit,Adrese,Data Înregistrare\n";
    const rows = filtered.map(c =>
      `"${c.full_name || ""}","${c.phone || ""}","${c.matchedEmail || ""}",${c.orderCount},${c.totalSpent.toFixed(2)},${c.addressCount},"${new Date(c.created_at).toLocaleDateString("ro-RO")}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "clienti.csv"; a.click();
    showToast("CSV exportat!");
  };

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-[60] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Clienți ({customers.length})</h1>
          <p className="text-sm text-muted-foreground">Total cheltuit: {totalSpent.toFixed(2)} RON</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-accent" />
          <p className="mt-2 text-xl font-bold text-foreground">{customers.length}</p>
          <p className="text-xs text-muted-foreground">Total clienți</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <ShoppingCart className="h-5 w-5 mx-auto text-chart-2" />
          <p className="mt-2 text-xl font-bold text-foreground">{totalOrders}</p>
          <p className="text-xs text-muted-foreground">Total comenzi</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-accent" />
          <p className="mt-2 text-xl font-bold text-foreground">{totalSpent.toFixed(0)} RON</p>
          <p className="text-xs text-muted-foreground">Venituri clienți</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <MapPin className="h-5 w-5 mx-auto text-chart-1" />
          <p className="mt-2 text-xl font-bold text-foreground">{customers.reduce((s, c) => s + c.addressCount, 0)}</p>
          <p className="text-xs text-muted-foreground">Adrese salvate</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Caută după nume, telefon sau email..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nume</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Comenzi</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer" onClick={() => { setSortField("totalSpent"); setSortDir(d => d === "asc" ? "desc" : "asc"); }}>
                Total Cheltuit ↕
              </th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Înregistrat</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tbody key={c.id}>
                <tr className="hover:bg-secondary/30 transition cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm">
                        {(c.full_name || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{c.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">{c.matchedEmail || "—"}</p>
                    <p className="text-xs text-muted-foreground">{c.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.orderCount > 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {c.orderCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{c.totalSpent.toFixed(2)} RON</td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString("ro-RO")}</td>
                  <td className="px-4 py-3">{expandedId === c.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</td>
                </tr>
                {expandedId === c.id && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 bg-secondary/20">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="font-mono text-xs text-foreground truncate max-w-[200px]">{c.user_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Telefon</p>
                            <p className="text-foreground">{c.phone || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Adrese</p>
                            <p className="text-foreground">{c.addressCount} salvate</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Avatar</p>
                            <p className="text-foreground">{c.avatar_url ? "Da" : "Nu"}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
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
    </div>
  );
}
