import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, ChevronDown, ChevronUp } from "lucide-react";

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
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!profiles) { setLoading(false); return; }

      const enriched = await Promise.all(profiles.map(async (p: any) => {
        const { data: orders } = await supabase.from("orders").select("id, total").eq("customer_email", p.user_id);
        const { data: addresses } = await supabase.from("addresses").select("id").eq("user_id", p.user_id);
        return {
          ...p,
          orderCount: orders?.length || 0,
          totalSpent: orders?.reduce((s: number, o: any) => s + Number(o.total || 0), 0) || 0,
          addressCount: addresses?.length || 0,
        };
      }));
      setCustomers(enriched);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter(c =>
    (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Clienți ({customers.length})</h1>
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
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nume</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Telefon</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Comenzi</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total Cheltuit</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Înregistrat</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <>
                <tr key={c.id} className="hover:bg-secondary/30 transition cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <td className="px-4 py-3 font-medium text-foreground">{c.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-center">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.totalSpent.toFixed(2)} lei</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ro-RO")}</td>
                  <td className="px-4 py-3">{expandedId === c.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-detail`}>
                    <td colSpan={6} className="px-4 py-4 bg-secondary/20">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs text-foreground">{c.user_id}</span></div>
                        <div><span className="text-muted-foreground">Adrese salvate:</span> <span className="font-medium text-foreground">{c.addressCount}</span></div>
                        <div><span className="text-muted-foreground">Avatar:</span> <span className="text-foreground">{c.avatar_url ? "Da" : "Nu"}</span></div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
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
