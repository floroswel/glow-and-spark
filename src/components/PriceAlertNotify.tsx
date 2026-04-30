import { useState } from "react";
import { TrendingDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function PriceAlertNotify({ productId, currentPrice }: { productId: string; currentPrice: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [target, setTarget] = useState<string>(Math.max(1, Math.floor(currentPrice * 0.9)).toString());
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = email.trim();
    const targetPrice = parseFloat(target);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) return toast.error("Email invalid");
    if (!targetPrice || targetPrice <= 0 || targetPrice >= currentPrice) return toast.error("Prețul țintă trebuie să fie sub prețul actual");
    setLoading(true);
    const { error } = await supabase.from("price_alerts").insert({
      product_id: productId,
      email: trimmed,
      target_price: targetPrice,
      user_id: user?.id ?? null,
    });
    setLoading(false);
    if (error) return toast.error("Nu am putut salva alerta");
    setSubmitted(true);
    toast.success("Te anunțăm când prețul scade sub ținta ta");
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-chart-2/30 bg-chart-2/10 px-4 py-3 text-sm text-chart-2">
        <Check className="h-4 w-4" /> Alertă de preț activă pentru {target} RON
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm text-muted-foreground hover:border-accent hover:text-accent transition">
        <TrendingDown className="h-4 w-4" />
        Anunță-mă dacă prețul scade
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <p className="text-xs text-muted-foreground">Setează prețul țintă (sub {currentPrice.toFixed(2)} RON)</p>
      <div className="grid grid-cols-3 gap-2">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email" className="col-span-2 rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input type="number" step="0.5" value={target} onChange={e => setTarget(e.target.value)} className="rounded-md border border-border bg-background px-2 py-2 text-sm" />
      </div>
      <button onClick={submit} disabled={loading} className="w-full rounded-md bg-foreground py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Activează alertă</button>
    </div>
  );
}
