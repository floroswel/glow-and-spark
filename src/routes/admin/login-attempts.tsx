import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/login-attempts")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("login_attempts").select("*").order("created_at", { ascending: false }).limit(500).then(({ data }) => setItems(data ?? []));
  }, []);
  const failed = items.filter(i => !i.success).length;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-7 w-7 text-accent" />
        <div><h1 className="font-heading text-2xl font-bold">Încercări de autentificare</h1><p className="text-sm text-muted-foreground">{failed} eșecuri din ultimele {items.length} încercări</p></div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Email</th><th className="text-left p-3">IP</th><th className="text-left p-3">Status</th><th className="text-left p-3">Motiv</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(i => (
              <tr key={i.id}>
                <td className="p-3 text-xs">{new Date(i.created_at).toLocaleString("ro-RO")}</td>
                <td className="p-3">{i.email}</td>
                <td className="p-3 font-mono text-xs">{i.ip_address || "—"}</td>
                <td className="p-3">{i.success ? <span className="text-green-600">Reușit</span> : <span className="text-red-600">Eșuat</span>}</td>
                <td className="p-3 text-xs">{i.failure_reason || "—"}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nicio încercare</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
