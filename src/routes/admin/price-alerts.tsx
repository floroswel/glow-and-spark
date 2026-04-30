import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown } from "lucide-react";

export const Route = createFileRoute("/admin/price-alerts")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("price_alerts").select("*, products(name)").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingDown className="h-7 w-7 text-accent" />
        <div><h1 className="font-heading text-2xl font-bold">Alerte de preț</h1><p className="text-sm text-muted-foreground">{items.length} alerte active</p></div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Produs</th><th className="text-left p-3">Preț țintă</th><th className="text-left p-3">Înscris</th><th className="text-left p-3">Notificat</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(i => (
              <tr key={i.id}>
                <td className="p-3">{i.email}</td>
                <td className="p-3">{i.products?.name || i.product_id}</td>
                <td className="p-3">{Number(i.target_price).toFixed(2)} RON</td>
                <td className="p-3">{new Date(i.created_at).toLocaleString("ro-RO")}</td>
                <td className="p-3">{i.notified_at ? <span className="text-green-600">Da</span> : <span className="text-amber-600">Pending</span>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nicio alertă</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
