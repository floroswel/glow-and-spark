import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stock/purchase-orders")({
  component: PurchaseOrdersPage,
});

const statusLabels: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
  sent: { label: "Trimisă", cls: "bg-accent/10 text-accent" },
  confirmed: { label: "Confirmată", cls: "bg-chart-1/10 text-chart-1" },
  received: { label: "Recepționată", cls: "bg-chart-2/10 text-chart-2" },
  paid: { label: "Plătită", cls: "bg-chart-2/10 text-chart-2" },
  cancelled: { label: "Anulată", cls: "bg-destructive/10 text-destructive" },
};

function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("purchase_orders")
      .select("*, suppliers(name), purchase_order_items(*, products(name))")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "received") updates.received_at = new Date().toISOString();
    await supabase.from("purchase_orders").update(updates).eq("id", id);
    toast.success(`Comandă ${statusLabels[status]?.label}`);
    load();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">📄 Comenzi Furnizori</h1>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nicio comandă de furnizor. Creează prima comandă din secțiunea Reaprovizionare.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const st = statusLabels[o.status] || statusLabels.draft;
            const items = o.purchase_order_items || [];
            return (
              <Card key={o.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-foreground">{o.po_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>🏭 {(o as any).suppliers?.name || "—"}</span>
                    <span>{items.length} produs(e)</span>
                    <span className="font-medium text-foreground">{Number(o.total || 0).toLocaleString("ro-RO")} RON</span>
                    {o.expected_delivery && <span>📅 {new Date(o.expected_delivery).toLocaleDateString("ro-RO")}</span>}
                  </div>
                  {o.status === "draft" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => updateStatus(o.id, "sent")} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90">Trimite</button>
                      <button onClick={() => updateStatus(o.id, "cancelled")} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">Anulează</button>
                    </div>
                  )}
                  {o.status === "sent" && <button onClick={() => updateStatus(o.id, "confirmed")} className="mt-3 px-3 py-1.5 rounded-lg bg-chart-1/10 text-chart-1 text-xs font-medium">Confirmă</button>}
                  {o.status === "confirmed" && <button onClick={() => updateStatus(o.id, "received")} className="mt-3 px-3 py-1.5 rounded-lg bg-chart-2/10 text-chart-2 text-xs font-medium">Recepționează</button>}
                  {o.status === "received" && <button onClick={() => updateStatus(o.id, "paid")} className="mt-3 px-3 py-1.5 rounded-lg bg-chart-2/10 text-chart-2 text-xs font-medium">Marchează Plătit</button>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
