import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/lib/gtm";
import { trackPurchase as fbTrackPurchase } from "@/lib/fbpixel";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/order-confirmed/$orderId")({
  component: OrderConfirmedPage,
  head: () => ({
    meta: [
      { title: "Comandă confirmată | Glow & Spark" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function OrderConfirmedPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    supabase.from("orders").select("*").eq("id", orderId).single().then(({ data }) => {
      if (data) {
        setOrder(data);
        if (!trackedRef.current) {
          trackedRef.current = true;
          trackPurchase({ id: data.id, order_number: data.order_number, total: data.total, items: data.items as any[] });
          fbTrackPurchase({ id: data.id, total: data.total, items: data.items as any[] });
        }
      }
    });
  }, [orderId]);

  return (
    <div className="min-h-screen">
      <MarqueeBanner /><TopBar /><SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle className="mx-auto h-20 w-20 text-chart-2" />
        <h1 className="mt-6 font-heading text-3xl font-bold text-foreground">
          Comanda a fost plasată!
        </h1>
        {order && (
          <>
            <p className="mt-2 text-lg text-muted-foreground">
              Comanda <strong className="text-foreground">#{order.order_number}</strong> a fost înregistrată cu succes.
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
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span><span>{order.total} RON</span>
                </div>
              </div>
            </div>
          </>
        )}
        <Link to="/" className="mt-8 inline-block rounded-lg bg-accent px-8 py-3 font-bold text-accent-foreground transition hover:opacity-90">
          Continuă cumpărăturile →
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
