import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import {
  ShoppingBag, ChevronDown, ChevronUp, RotateCcw, X, RefreshCw, Loader2,
  FileDown, Package, Truck, CheckCircle2, Clock, XCircle, CreditCard,
  MapPin, Copy, ExternalLink, Search, Filter,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/orders")({
  component: AccountOrders,
});

const RETURN_REASONS = [
  "Produs defect",
  "Nu corespunde descrierii",
  "Am comandat greșit",
  "Alta",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; step: number }> = {
  pending: { label: "În așteptare", color: "bg-amber-100 text-amber-700", icon: Clock, step: 0 },
  processing: { label: "Se procesează", color: "bg-blue-100 text-blue-700", icon: Package, step: 1 },
  shipped: { label: "Expediată", color: "bg-purple-100 text-purple-700", icon: Truck, step: 2 },
  completed: { label: "Livrată", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, step: 3 },
  cancelled: { label: "Anulată", color: "bg-red-100 text-red-700", icon: XCircle, step: -1 },
};

const STEPS = ["pending", "processing", "shipped", "completed"] as const;
const STEP_LABELS = ["Plasată", "Procesare", "Expediată", "Livrată"];

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg p-2.5">
        <XCircle className="h-4 w-4" /> Comanda a fost anulată
      </div>
    );
  }
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, i) => {
        const done = i <= currentStep;
        const active = i === currentStep;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1.5 rounded-full transition-all ${done ? "bg-accent" : "bg-border"}`} />
            <span className={`text-[10px] leading-tight text-center ${active ? "text-accent font-semibold" : done ? "text-foreground" : "text-muted-foreground"}`}>
              {STEP_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AWBSection({ order }: { order: any }) {
  if (!order.awb_number) return null;

  const carrier = order.awb_carrier || "Curier";
  const trackingUrl = getTrackingUrl(carrier, order.awb_number);

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">Urmărire colet</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Curier:</span>
        <span className="text-sm font-medium text-foreground">{carrier}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">AWB:</span>
        <code className="text-sm font-mono font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border">{order.awb_number}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(order.awb_number); toast.success("AWB copiat!"); }}
          className="text-muted-foreground hover:text-foreground transition"
          title="Copiază AWB"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {trackingUrl && (
          <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
            <ExternalLink className="h-3 w-3" /> Urmărește coletul
          </a>
        )}
      </div>
    </div>
  );
}

function getTrackingUrl(carrier: string, awb: string): string | null {
  const c = carrier.toLowerCase();
  if (c.includes("fan") || c.includes("fancourier")) return `https://www.fancourier.ro/awb-tracking/?awb=${awb}`;
  if (c.includes("sameday")) return `https://sameday.ro/#/tracking/${awb}`;
  if (c.includes("dpd")) return `https://tracking.dpd.ro/tracking?reference=${awb}`;
  if (c.includes("gls")) return `https://gls-group.eu/RO/ro/urmarire-colete?match=${awb}`;
  if (c.includes("cargus")) return `https://www.cargus.ro/tracking-online/?t=${awb}`;
  if (c.includes("posta") || c.includes("post")) return `https://www.pfromaniastatus.ro/track/?id=${awb}`;
  return null;
}

function AccountOrders() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [existingReturns, setExistingReturns] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Return modal state
  const [returnOrder, setReturnOrder] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDetails, setReturnDetails] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<string | null>(null);

  const handleDownloadInvoice = async (order: any) => {
    setInvoiceLoadingId(order.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice", {
        body: { order_id: order.id },
      });
      if (error || !data?.pdf) {
        toast.error("Eroare la generarea facturii.");
        return;
      }
      const bytes = atob(data.pdf);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "factura-" + order.order_number + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Factura a fost descărcată!");
    } catch {
      toast.error("Eroare la descărcarea facturii.");
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  const handleReorder = async (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const productIds = items.map((i: any) => i.product_id || i.id).filter(Boolean);
    if (!productIds.length) return;

    setReorderingId(order.id);
    try {
      const { data: products } = await supabase
        .from("products_public")
        .select("id, name, slug, price, old_price, image_url, stock, is_active")
        .in("id", productIds);

      const available = (products || []).filter((p) => p.is_active && (p.stock ?? 0) > 0);
      const skipped = productIds.length - available.length;

      for (const p of available) {
        const origItem = items.find((i: any) => (i.product_id || i.id) === p.id);
        addItem(
          { id: p.id, name: p.name, slug: p.slug, price: p.price, old_price: p.old_price, image_url: p.image_url ?? undefined },
          origItem?.quantity || origItem?.qty || 1
        );
      }

      if (available.length > 0) toast.success(`${available.length} produse au fost adăugate în coș!`);
      if (skipped > 0) toast(`${skipped} produse nu mai sunt disponibile.`);
      if (available.length > 0) navigate({ to: "/cart" });
    } catch {
      toast.error("Eroare la verificarea produselor.");
    } finally {
      setReorderingId(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [ordersRes, returnsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("customer_email", user.email!)
          .order("created_at", { ascending: false }),
        supabase
          .from("returns")
          .select("order_id")
          .eq("user_id", user.id),
      ]);
      if (!active) return;
      setOrders(ordersRes.data || []);
      setExistingReturns(new Set((returnsRes.data || []).map((r: any) => r.order_id)));
      setLoading(false);
    })();

    const channel = supabase
      .channel(`account-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_email=eq.${user.email}` },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "UPDATE") {
            setOrders((prev) => prev.map((o) => (o.id === (payload.new as any).id ? payload.new : o)));
          } else if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!o.order_number?.toLowerCase().includes(q) && !o.awb_number?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openReturnModal = (order: any) => {
    setReturnOrder(order);
    setSelectedItems(new Set());
    setReturnReason(RETURN_REASONS[0]);
    setReturnDetails("");
  };

  const toggleItem = (idx: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSubmitReturn = async () => {
    if (!returnOrder || !user) return;
    if (selectedItems.size === 0) {
      toast.error("Selectează cel puțin un produs pentru retur.");
      return;
    }
    setSubmittingReturn(true);
    const items = Array.isArray(returnOrder.items) ? returnOrder.items : [];
    const returnItems = Array.from(selectedItems).map((idx) => items[idx]);

    const { error } = await supabase.from("returns").insert({
      order_id: returnOrder.id,
      user_id: user.id,
      items: returnItems,
      reason: returnReason,
      notes: returnDetails.trim() || null,
      status: "pending",
    });

    if (error) {
      toast.error("Eroare la trimiterea cererii de retur.");
      setSubmittingReturn(false);
      return;
    }

    supabase.functions.invoke("send-email", {
      body: {
        type: "return_request",
        to: "admin@mamalucica.ro",
        data: {
          orderNumber: returnOrder.order_number,
          customer_name: returnOrder.customer_name,
          customer_email: returnOrder.customer_email,
          reason: returnReason,
          details: returnDetails.trim(),
          items: returnItems,
        },
      },
    }).catch(() => {});

    setExistingReturns((prev) => new Set(prev).add(returnOrder.id));
    toast.success("Cererea de retur a fost trimisă! Vei fi contactat(ă) în curând.");
    setReturnOrder(null);
    setSubmittingReturn(false);
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  if (!orders.length) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">Nicio comandă încă</h2>
        <p className="mt-1 text-sm text-muted-foreground">Comenzile tale vor apărea aici după prima achiziție.</p>
      </div>
    );
  }

  // Status counts for filter badges
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">Comenzile Mele</h1>
        <span className="text-sm text-muted-foreground">{orders.length} {orders.length === 1 ? "comandă" : "comenzi"}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "all", label: "Toate" },
            { value: "pending", label: "În așteptare" },
            { value: "processing", label: "Procesare" },
            { value: "shipped", label: "Expediate" },
            { value: "completed", label: "Livrate" },
            { value: "cancelled", label: "Anulate" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === f.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {f.label}
              {f.value !== "all" && statusCounts[f.value] ? ` (${statusCounts[f.value]})` : ""}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Caută după nr. comandă sau AWB..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <Filter className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          Nicio comandă pentru filtrele selectate.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const expanded = expandedId === order.id;
            const items = Array.isArray(order.items) ? order.items : [];
            const canReturn = (order.status === "completed" || order.status === "shipped") && !existingReturns.has(order.id);
            const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = sc.icon;
            const daysSinceOrder = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86400000);

            return (
              <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${sc.color}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">#{order.order_number}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                        {daysSinceOrder <= 1 && <span className="ml-1.5 text-accent font-medium">• Astăzi</span>}
                        {order.awb_number && <span className="ml-1.5">• AWB: {order.awb_number}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(order.payment_method === "card" || order.payment_method === "netopia") && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        order.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        order.payment_status === "failed" ? "bg-red-100 text-red-700" :
                        order.payment_status === "cancelled" ? "bg-gray-100 text-gray-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.payment_status === "paid" ? "✓ Plătit" :
                         order.payment_status === "failed" ? "✕ Eșuat" :
                         order.payment_status === "cancelled" ? "Anulat" :
                         "În așteptare"}
                      </span>
                    )}
                    <span className="text-base font-bold text-foreground">{Number(order.total).toFixed(2)} lei</span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-border px-5 py-5 space-y-4">
                    {/* Order timeline */}
                    <OrderTimeline status={order.status} />

                    {/* AWB Tracking */}
                    <AWBSection order={order} />

                    {/* Order info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-xs text-muted-foreground block">Plată</span>
                          <span className="font-medium text-foreground">
                            {order.payment_method === "ramburs" ? "Ramburs (plata la livrare)" : "Card online"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-xs text-muted-foreground block">Adresa livrare</span>
                          <span className="font-medium text-foreground">{order.shipping_address}, {order.city}, {order.county}</span>
                        </div>
                      </div>
                      {order.notes && (
                        <div className="sm:col-span-2 rounded-lg bg-secondary/30 p-2.5 text-sm text-muted-foreground">
                          <span className="text-xs font-medium text-foreground block mb-0.5">Mențiuni comandă:</span>
                          {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Products */}
                    {items.length > 0 && (
                      <div className="border-t border-border pt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produse comandate</p>
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 py-1.5">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground line-clamp-1">{item.name}</span>
                              <span className="text-xs text-muted-foreground"> × {item.quantity}</span>
                            </div>
                            <span className="text-sm font-semibold text-foreground whitespace-nowrap">{(Number(item.price) * Number(item.quantity)).toFixed(2)} lei</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{Number(order.subtotal).toFixed(2)} lei</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Livrare</span>
                        <span className={Number(order.shipping_cost || 0) === 0 ? "text-emerald-600 font-medium" : "text-foreground"}>
                          {Number(order.shipping_cost || 0) === 0 ? "GRATUITĂ" : `${Number(order.shipping_cost).toFixed(2)} lei`}
                        </span>
                      </div>
                      {Number(order.discount_amount || 0) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Reducere {order.discount_code ? `(${order.discount_code})` : ""}</span>
                          <span>-{Number(order.discount_amount).toFixed(2)} lei</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                        <span>Total</span>
                        <span>{Number(order.total).toFixed(2)} lei</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {(order.status === "completed" || order.status === "shipped" || order.status === "processing") && (
                      <div className="border-t border-border pt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order); }}
                          disabled={invoiceLoadingId === order.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition disabled:opacity-50"
                        >
                          {invoiceLoadingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                          Descarcă factură
                        </button>
                        {(order.status === "completed" || order.status === "shipped") && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                            disabled={reorderingId === order.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition disabled:opacity-50"
                          >
                            {reorderingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Comandă din nou
                          </button>
                        )}
                        {canReturn && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openReturnModal(order); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Solicită retur
                          </button>
                        )}
                      </div>
                    )}
                    {existingReturns.has(order.id) && (
                      <div className="border-t border-border pt-3">
                        <div className="flex items-center gap-1.5 text-xs text-accent font-medium bg-accent/5 rounded-lg p-2.5">
                          <RotateCcw className="h-3.5 w-3.5" /> Cerere de retur trimisă — vei fi contactat(ă) în curând
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Return Modal */}
      {returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReturnOrder(null)}>
          <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-lg font-bold text-foreground">Solicită retur — #{returnOrder.order_number}</h2>
              <button onClick={() => setReturnOrder(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Selectează produsele pentru retur *</label>
                <div className="space-y-2">
                  {(Array.isArray(returnOrder.items) ? returnOrder.items : []).map((item: any, idx: number) => (
                    <label key={idx} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${selectedItems.has(idx) ? "border-accent bg-accent/5" : "border-border"}`}>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(idx)}
                        onChange={() => toggleItem(idx)}
                        className="accent-accent"
                      />
                      <div className="flex-1 text-sm">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="text-muted-foreground"> × {item.quantity}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{(Number(item.price) * Number(item.quantity)).toFixed(2)} lei</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Motivul returului *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Detalii suplimentare</label>
                <textarea
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Descrie problema..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
              <button onClick={() => setReturnOrder(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
                Anulează
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={submittingReturn || selectedItems.size === 0}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {submittingReturn ? "Se trimite..." : "Trimite cererea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
