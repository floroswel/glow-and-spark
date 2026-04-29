import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Search, ChevronRight, Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Urmărire Comandă — Mama Lucica" },
      { name: "description", content: "Verifică statusul comenzii tale introduc numărul comenzii și adresa de email." },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    setSearched(true);

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.trim())
      .eq("customer_email", email.trim().toLowerCase())
      .maybeSingle();

    if (!data) {
      setError("Nu am găsit nicio comandă cu aceste date. Verifică numărul comenzii și emailul.");
    } else {
      setOrder(data);
    }
    setLoading(false);
  };

  const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    pending: { icon: Clock, label: "În așteptare", color: "text-yellow-600" },
    processing: { icon: Package, label: "Se procesează", color: "text-blue-600" },
    shipped: { icon: Truck, label: "Expediată", color: "text-purple-600" },
    completed: { icon: CheckCircle2, label: "Finalizată", color: "text-accent" },
    cancelled: { icon: XCircle, label: "Anulată", color: "text-destructive" },
  };

  const steps = ["pending", "processing", "shipped", "completed"];
  const currentStep = steps.indexOf(order?.status || "pending");

  return (
    <>
      <TopBar />
      <SiteHeader />
      <div className="bg-secondary/30 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition">Acasă</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Urmărire Comandă</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Urmărire Comandă</h1>
          <p className="text-sm text-muted-foreground mt-2">Introdu numărul comenzii și emailul pentru a vedea statusul.</p>
        </div>

        <form onSubmit={handleSearch} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Număr comandă</label>
              <input
                placeholder="ex: GS-1234"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                placeholder="email@exemplu.ro"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50"
          >
            <Search className="h-4 w-4" /> {loading ? "Se caută..." : "Verifică comanda"}
          </button>
        </form>

        {error && searched && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="mt-2 text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {order && (
          <div className="mt-8 space-y-6">
            {/* Status stepper */}
            {order.status !== "cancelled" && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                  <div className="absolute top-5 left-0 h-0.5 bg-accent transition-all" style={{ width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%` }} />
                  {steps.map((step, i) => {
                    const cfg = statusConfig[step];
                    const Icon = cfg.icon;
                    const active = i <= currentStep;
                    return (
                      <div key={step} className="relative flex flex-col items-center z-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${active ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"} transition`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`mt-2 text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order details */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-foreground">Comanda #{order.order_number}</h2>
                <span className={`text-sm font-semibold ${statusConfig[order.status]?.color || "text-muted-foreground"}`}>
                  {statusConfig[order.status]?.label || order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <span className="ml-2 font-medium text-foreground">{new Date(order.created_at).toLocaleDateString("ro-RO")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Plată:</span>
                  <span className="ml-2 font-medium text-foreground">{order.payment_method === "ramburs" ? "Ramburs" : "Card"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Livrare:</span>
                  <span className="ml-2 font-medium text-foreground">{order.shipping_address}, {order.city}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-bold text-accent">{Number(order.total).toFixed(2)} lei</span>
                </div>
              </div>

              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Produse comandate</p>
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.name} × {item.quantity}</span>
                      <span className="font-medium text-foreground">{(Number(item.price) * Number(item.quantity)).toFixed(2)} lei</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
