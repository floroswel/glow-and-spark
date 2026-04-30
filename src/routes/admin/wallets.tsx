import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/admin/wallets")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("customer_wallets").select("*, profiles:user_id(full_name, email)").order("balance", { ascending: false }).limit(200)
      .then(({ data }) => setItems(data ?? []));
  }, []);
  const total = items.reduce((s, i) => s + Number(i.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-7 w-7 text-accent" />
        <div><h1 className="font-heading text-2xl font-bold">Portofele clienți</h1><p className="text-sm text-muted-foreground">Sold total: {total.toFixed(2)} RON • {items.length} portofele</p></div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Client</th><th className="text-left p-3">Email</th><th className="text-left p-3">Sold</th><th className="text-left p-3">Monedă</th><th className="text-left p-3">Actualizat</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(i => (
              <tr key={i.id}>
                <td className="p-3">{i.profiles?.full_name || i.user_id}</td>
                <td className="p-3 text-xs">{i.profiles?.email || "—"}</td>
                <td className="p-3 font-semibold">{Number(i.balance).toFixed(2)}</td>
                <td className="p-3">{i.currency}</td>
                <td className="p-3 text-xs">{new Date(i.updated_at).toLocaleString("ro-RO")}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Niciun portofel</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
