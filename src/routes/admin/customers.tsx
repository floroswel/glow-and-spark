import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ChevronDown, ChevronUp, Mail, Phone, MapPin, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Get all profiles
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!profiles) { setLoading(false); return; }

      // Get all orders and addresses in bulk for efficiency
      const { data: allOrders } = await supabase.from("orders").select("customer_email, total, id");
      const { data: allAddresses } = await supabase.from("addresses").select("user_id, id");

      const enriched = profiles.map((p: any) => {
        // Match orders by user_id (since profiles have user_id)
        const userOrders = (allOrders || []).filter((o: any) => o.customer_email === p.user_id || o.customer_email === p.full_name);
        const userAddresses = (allAddresses || []).filter((a: any) => a.user_id === p.user_id);
        return {
          ...p,
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
          addressCount: userAddresses.length,
        };
      });
      setCustomers(enriched);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter(c =>
    (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Clienți ({customers.length})</h1>
          <p className="text-sm text-muted-foreground">Total cheltuit: {totalSpent.toFixed(2)} RON</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-accent" />
          <p className="mt-2 text-xl font-bold text-foreground">{customers.length}</p>
          <p className="text-xs text-muted-foreground">Total clienți</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <ShoppingCart className="h-5 w-5 mx-auto text-chart-2" />
          <p className="mt-2 text-xl font-bold text-foreground">{customers.reduce((s, c) => s + c.orderCount, 0)}</p>
          <p className="text-xs text-muted-foreground">Total comenzi</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <MapPin className="h-5 w-5 mx-auto text-chart-1" />
          <p className="mt-2 text-xl font-bold text-foreground">{customers.reduce((s, c) => s + c.addressCount, 0)}</p>
          <p className="text-xs text-muted-foreground">Adrese salvate</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Caută după nume sau telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nume</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefon</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Comenzi</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total Cheltuit</th>
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
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.orderCount > 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                      {c.orderCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{c.totalSpent.toFixed(2)} RON</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ro-RO")}</td>
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
