import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/lib/gtm";
import { trackPurchase as fbTrackPurchase } from "@/lib/fbpixel";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/order-confirmed/$orderId")({
  component: OrderConfirmedPage,
  head: () => ({
    meta: [
      { title: "Comandă confirmată | Mama Lucica" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type PaymentStatus = "paid" | "pending" | "failed" | "cancelled" | "refunded" | "review";

function OrderConfirmedPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const trackedRef = useRef(false);
  const pollCountRef = useRef(0);

  // Fetch order + Realtime subscription so when IPN updates payment_status, UI updates instantly
  useEffect(() => {
    let active = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (!active || !data) return;
      setOrder(data);
      // Track purchase only once and only when paid (or non-card methods which are auto-confirmed)
      const isCard = data.payment_method === "card" || data.payment_method === "netopia";
      const shouldTrack = !isCard || data.payment_status === "paid";
      if (shouldTrack && !trackedRef.current) {
        trackedRef.current = true;
        trackPurchase({
          id: data.id,
          order_number: data.order_number,
          total: data.total,
          items: data.items as any[],
        });
        fbTrackPurchase({ id: data.id, total: data.total, items: data.items as any[] });
      }
      // Stop polling when we have a definitive status
      if (data.payment_status && data.payment_status !== "pending") {
        setPolling(false);
        if (pollTimer) clearInterval(pollTimer);
      }
    };

    fetchOrder();

    // Realtime subscription on this specific order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          if (!active) return;
          setOrder(payload.new);
          if ((payload.new as any).payment_status && (payload.new as any).payment_status !== "pending") {
            setPolling(false);
            if (pollTimer) clearInterval(pollTimer);
          }
        }
      )
      .subscribe();

    // Fallback polling every 3s for max 60s in case Realtime is unavailable / IPN slow
    setPolling(true);
    pollTimer = setInterval(() => {
      pollCountRef.current += 1;
      if (pollCountRef.current > 20) {
        setPolling(false);
        if (pollTimer) clearInterval(pollTimer);
        return;
      }
      fetchOrder();
    }, 3000);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [orderId]);

  const paymentStatus = (order?.payment_status as PaymentStatus | undefined) || "pending";
  const isCard = order?.payment_method === "card" || order?.payment_method === "netopia";

  // Visual config per status
  const statusConfig: Record<PaymentStatus, {
    bg: string;
    border: string;
    iconColor: string;
    icon: any;
    title: string;
    message: string;
  }> = {
    paid: {
      bg: "bg-green-50",
      border: "border-green-300",
      iconColor: "text-green-600",
      icon: CheckCircle,
      title: "Plată confirmată!",
      message: "Banii au fost încasați cu succes. Comanda intră în procesare.",
    },
    pending: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      iconColor: "text-yellow-600",
      icon: isCard ? Loader2 : Clock,
      title: isCard ? "Confirmăm plata..." : "Comandă înregistrată",
      message: isCard
        ? "Așteptăm confirmarea de la procesatorul de plăți. Acest pas durează de obicei câteva secunde."
        : "Comanda ta a fost înregistrată cu succes.",
    },
    failed: {
      bg: "bg-red-50",
      border: "border-red-300",
      iconColor: "text-red-600",
      icon: XCircle,
      title: "Plata a eșuat",
      message: "Plata nu a putut fi procesată. Te rugăm să încerci din nou sau să alegi altă metodă.",
    },
    cancelled: {
      bg: "bg-gray-50",
      border: "border-gray-300",
      iconColor: "text-gray-600",
      icon: XCircle,
      title: "Plată anulată",
      message: "Plata a fost anulată. Comanda nu este finalizată.",
    },
    refunded: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      iconColor: "text-blue-600",
      icon: CheckCircle,
      title: "Plată rambursată",
      message: "Suma a fost returnată în contul tău.",
    },
    review: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      iconColor: "text-orange-600",
      icon: Clock,
      title: "Plată în verificare",
      message: "Plata necesită verificare manuală. Te vom contacta în scurt timp.",
    },
  };

  const cfg = statusConfig[paymentStatus] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const isSpinning = paymentStatus === "pending" && isCard;

  return (
    <div className="min-h-screen">
      <MarqueeBanner /><TopBar /><SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className={`mx-auto rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-6`}>
          <StatusIcon className={`mx-auto h-16 w-16 ${cfg.iconColor} ${isSpinning ? "animate-spin" : ""}`} />
          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">
            {cfg.title}
          </h1>
          <p className="mt-2 text-sm text-foreground/80">
            {cfg.message}
          </p>
          {polling && paymentStatus === "pending" && isCard && (
            <p className="mt-2 text-xs text-muted-foreground">
              Verificăm automat statusul plății...
            </p>
          )}
        </div>

        {order && (
          <>
            <p className="mt-6 text-lg text-muted-foreground">
              Comanda <strong className="text-foreground">#{order.order_number}</strong>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vei primi un email de confirmare la <strong>{order.customer_email}</strong>
            </p>

            <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left">
              <h3 className="font-heading font-bold text-foreground mb-3">Rezumat comandă</h3>
              <div className="space-y-2">
                {(order.items as any[])?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.qty}</span>
                    <span>{(item.price * item.qty).toFixed(2)} RON</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{order.subtotal} RON</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Livrare</span><span>{Number(order.shipping_cost) === 0 ? "GRATUITĂ" : `${order.shipping_cost} RON`}</span></div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-chart-2"><span>Reducere</span><span>-{order.discount_amount} RON</span></div>
                )}
                {order.gift_wrapping && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Ambalaj cadou</span><span>{Number(order.gift_wrapping_price || 0).toFixed(2)} RON</span></div>
                )}
                {order.gift_message && (
                  <p className="text-xs text-muted-foreground italic">🎁 „{order.gift_message}"</p>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span><span>{order.total} RON</span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/account/orders" className="rounded-lg border border-border bg-card px-6 py-3 font-bold text-foreground transition hover:bg-muted">
            Vezi comenzile mele
          </Link>
          <Link to="/" className="rounded-lg bg-accent px-8 py-3 font-bold text-accent-foreground transition hover:opacity-90">
            Continuă cumpărăturile →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
