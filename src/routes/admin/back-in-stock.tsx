import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/admin/back-in-stock")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("back_in_stock_notifications").select("*, products(name, slug)").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  const pending = items.filter(i => !i.notified_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-7 w-7 text-accent" />
        <div><h1 className="font-heading text-2xl font-bold">Notificări „Stoc revenit"</h1><p className="text-sm text-muted-foreground">{pending} în așteptare din {items.length}</p></div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Produs</th><th className="text-left p-3">Înscris</th><th className="text-left p-3">Notificat</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(i => (
              <tr key={i.id}>
                <td className="p-3">{i.email}</td>
                <td className="p-3">{i.products?.name || i.product_id}</td>
                <td className="p-3">{new Date(i.created_at).toLocaleString("ro-RO")}</td>
                <td className="p-3">{i.notified_at ? <span className="text-green-600">{new Date(i.notified_at).toLocaleString("ro-RO")}</span> : <span className="text-amber-600">Pending</span>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nicio notificare</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
