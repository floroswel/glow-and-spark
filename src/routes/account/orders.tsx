import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/account/orders")({
  component: AccountOrders,
});

function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email!)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, [user]);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: "În așteptare", processing: "Se procesează",
      completed: "Finalizată", cancelled: "Anulată", shipped: "Expediată",
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      shipped: "bg-purple-100 text-purple-700",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  if (!orders.length) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">Nicio comandă încă</h2>
        <p className="mt-1 text-sm text-muted-foreground">Comenzile tale vor apărea aici după prima achiziție.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-foreground">Comenzile Mele</h1>
      {orders.map((order) => {
        const expanded = expandedId === order.id;
        const items = Array.isArray(order.items) ? order.items : [];
        return (
          <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setExpandedId(expanded ? null : order.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground text-left">Comanda #{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("ro-RO")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
                <span className="text-sm font-bold text-foreground">{Number(order.total).toFixed(2)} lei</span>
                {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>
            {expanded && (
              <div className="border-t border-border px-5 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Metodă plată:</span> <span className="font-medium text-foreground">{order.payment_method === "ramburs" ? "Ramburs" : "Card"}</span></div>
                  <div><span className="text-muted-foreground">Livrare:</span> <span className="font-medium text-foreground">{order.shipping_address}, {order.city}, {order.county}</span></div>
                </div>
                {items.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Produse</p>
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-foreground">{item.name} × {item.quantity}</span>
                        <span className="font-medium text-foreground">{(Number(item.price) * Number(item.quantity)).toFixed(2)} lei</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal / Livrare / Total</span>
                  <span className="font-bold text-foreground">
                    {Number(order.subtotal).toFixed(2)} / {Number(order.shipping_cost || 0).toFixed(2)} / {Number(order.total).toFixed(2)} lei
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
