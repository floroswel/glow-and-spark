import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/transfers")({
  component: StockTransfers,
});

function StockTransfers() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [tRes, wRes] = await Promise.all([
        supabase.from("stock_transfers").select("*").order("created_at", { ascending: false }),
        supabase.from("warehouses").select("id, name"),
      ]);
      setTransfers(tRes.data || []);
      setWarehouses(wRes.data || []);
      setLoading(false);
    })();
  }, []);

  const wName = (id: string) => warehouses.find(w => w.id === id)?.name || "—";
  const statusColors: Record<string, string> = { draft: "bg-muted text-muted-foreground", pending: "bg-accent/15 text-accent", completed: "bg-chart-2/15 text-chart-2", cancelled: "bg-destructive/15 text-destructive" };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Transferuri Stoc</h1>
          <p className="text-sm text-muted-foreground">{transfers.length} transferuri</p>
        </div>
      </div>

      {transfers.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <ArrowLeftRight className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Niciun transfer înregistrat</p>
          <p className="text-xs mt-1">Transferurile apar automat când muți stoc între depozite</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nr. Transfer</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">De la</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Către</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
            </tr></thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono text-xs">{t.transfer_number}</td>
                  <td className="px-4 py-2">{wName(t.from_warehouse_id)}</td>
                  <td className="px-4 py-2">{wName(t.to_warehouse_id)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[t.status] || "bg-muted text-muted-foreground"}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString("ro-RO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
