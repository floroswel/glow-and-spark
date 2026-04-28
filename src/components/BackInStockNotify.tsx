import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function BackInStockNotify({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      toast.error("Email invalid");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("stock_notifications").insert({
      product_id: productId,
      email: trimmed,
      user_id: user?.id ?? null,
    });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Nu am putut salva. Încearcă din nou.");
      return;
    }
    setSubmitted(true);
    toast.success("Te anunțăm pe email când produsul revine pe stoc");
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-chart-2/30 bg-chart-2/10 px-4 py-3 text-sm text-chart-2">
        <Check className="h-4 w-4" />
        Te-am înscris la notificări pentru acest produs
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 text-sm font-semibold text-foreground hover:border-accent hover:text-accent transition"
      >
        <Bell className="h-4 w-4" />
        Anunță-mă când revine pe stoc
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <p className="text-xs text-muted-foreground">Lasă-ne emailul și te anunțăm imediat ce produsul revine.</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplu.ro"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Trimite
        </button>
      </div>
    </div>
  );
}
