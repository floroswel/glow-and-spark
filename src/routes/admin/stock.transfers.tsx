import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stock/transfers")({
  component: TransfersPage,
});

const statusLabels: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
  approved: { label: "Aprobat", cls: "bg-accent/10 text-accent" },
  in_transit: { label: "În Tranzit", cls: "bg-amber-500/10 text-amber-600" },
  received: { label: "Recepționat", cls: "bg-chart-2/10 text-chart-2" },
  cancelled: { label: "Anulat", cls: "bg-destructive/10 text-destructive" },
};

function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [tRes, wRes] = await Promise.all([
      supabase.from("stock_transfers").select("*, stock_transfer_items(*, products(name))").order("created_at", { ascending: false }),
      supabase.from("warehouses").select("id, name").eq("is_active", true),
    ]);
    setTransfers(tRes.data || []);
    setWarehouses(wRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const whName = (id: string) => warehouses.find(w => w.id === id)?.name || "—";

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "approved") updates.approved_at = new Date().toISOString();
    if (status === "received") updates.received_at = new Date().toISOString();
    await supabase.from("stock_transfers").update(updates).eq("id", id);
    toast.success(`Transfer ${statusLabels[status]?.label || status}`);
    load();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">🔄 Transferuri Depozit</h1>
        </div>
      </div>

      {transfers.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Niciun transfer înregistrat.</p>
      ) : (
        <div className="space-y-3">
          {transfers.map(t => {
            const st = statusLabels[t.status] || statusLabels.draft;
            const items = t.stock_transfer_items || [];
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-foreground">{t.transfer_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">{whName(t.from_warehouse_id)}</span>
                    <ArrowRight className="h-4 w-4 text-accent" />
                    <span className="font-medium text-foreground">{whName(t.to_warehouse_id)}</span>
                    <span className="ml-auto">{items.length} produs(e)</span>
                  </div>
                  {items.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {items.slice(0, 3).map((it: any) => (
                        <span key={it.id} className="mr-2">{it.products?.name} ×{it.quantity}</span>
                      ))}
                      {items.length > 3 && <span>+{items.length - 3} altele</span>}
                    </div>
                  )}
                  {t.status === "draft" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => updateStatus(t.id, "approved")} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90">Aprobă</button>
                      <button onClick={() => updateStatus(t.id, "cancelled")} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20">Anulează</button>
                    </div>
                  )}
                  {t.status === "approved" && (
                    <button onClick={() => updateStatus(t.id, "in_transit")} className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/20">Marchează În Tranzit</button>
                  )}
                  {t.status === "in_transit" && (
                    <button onClick={() => updateStatus(t.id, "received")} className="mt-3 px-3 py-1.5 rounded-lg bg-chart-2/10 text-chart-2 text-xs font-medium hover:bg-chart-2/20">Confirmă Recepție</button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
