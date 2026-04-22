import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/purchase-orders")({
  component: PurchaseOrders,
});

function PurchaseOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    (async () => {
      const [oRes, sRes] = await Promise.all([
        supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("suppliers").select("id, name"),
      ]);
      setOrders(oRes.data || []);
      const map: Record<string, string> = {};
      (sRes.data || []).forEach(s => { map[s.id] = s.name; });
      setSuppliers(map);
      setLoading(false);
    })();
  }, []);

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paged = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const statusColors: Record<string, string> = { draft: "bg-muted text-muted-foreground", sent: "bg-chart-1/15 text-chart-1", confirmed: "bg-accent/15 text-accent", received: "bg-chart-2/15 text-chart-2", cancelled: "bg-destructive/15 text-destructive" };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Comenzi Furnizori</h1>
        <p className="text-sm text-muted-foreground">{orders.length} comenzi de achiziție</p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <FileText className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Nicio comandă de achiziție</p>
          <p className="text-xs mt-1">Comenzile către furnizori vor apărea aici</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nr. PO</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Furnizor</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
              </tr></thead>
              <tbody>
                {paged.map(o => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-mono text-xs">{o.po_number}</td>
                    <td className="px-4 py-2">{suppliers[o.supplier_id] || "—"}</td>
                    <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>{o.status}</span></td>
                    <td className="px-4 py-2 text-right font-medium">{(o.total || 0).toLocaleString("ro-RO")} RON</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded border border-border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
