import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Repeat } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function SubscribeAndSave({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState(30);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Link to="/auth" className="block w-full rounded-lg border-2 border-dashed border-accent/40 bg-accent/5 p-3 text-center text-sm hover:bg-accent/10">
        <Repeat className="inline h-4 w-4 mr-1" /> Conectează-te pentru livrare recurentă (-10%)
      </Link>
    );
  }

  const subscribe = async () => {
    setBusy(true);
    const next = new Date();
    next.setDate(next.getDate() + freq);
    const { error } = await supabase.from("product_subscriptions").insert({
      user_id: user.id,
      product_id: productId,
      quantity: qty,
      frequency_days: freq,
      next_delivery_date: next.toISOString().split("T")[0],
      discount_percent: 10,
      status: "active",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Abonament creat! -10% la fiecare livrare.");
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-lg border-2 border-dashed border-accent/40 bg-accent/5 p-3 text-sm font-medium hover:bg-accent/10 transition">
        <Repeat className="inline h-4 w-4 mr-1.5" /> Abonează-te și economisește -10%
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-accent/40 bg-accent/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-1.5"><Repeat className="h-4 w-4" /> Livrare automată</h4>
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground">Anulează</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">
          Cantitate
          <input type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} className="mt-1 w-full rounded border px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs">
          Frecvență (zile)
          <select value={freq} onChange={e => setFreq(parseInt(e.target.value))} className="mt-1 w-full rounded border px-2 py-1.5 text-sm">
            <option value={14}>La 2 săptămâni</option>
            <option value={30}>Lunar</option>
            <option value={60}>La 2 luni</option>
            <option value={90}>Trimestrial</option>
          </select>
        </label>
      </div>
      <button onClick={subscribe} disabled={busy} className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
        {busy ? "Se creează..." : "Confirmă abonamentul (-10%)"}
      </button>
      <p className="text-xs text-muted-foreground">Poți pune pe pauză sau anula oricând din contul tău.</p>
    </div>
  );
}
