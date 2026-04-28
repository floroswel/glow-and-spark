import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, Shield, Activity } from "lucide-react";

export const Route = createFileRoute("/admin/audit-log")({
  component: AuditLogPage,
});

function AuditLogPage() {
  const [tab, setTab] = useState<"auth" | "activity">("activity");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (tab === "auth") {
        const { data } = await supabase.from("auth_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
        setItems(data ?? []);
      } else {
        const { data } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200);
        setItems(data ?? []);
      }
    })();
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-accent" />
        <div>
          <h1 className="font-heading text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Trasabilitate completă a operațiunilor (cerință legală)</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("activity")} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm ${tab === "activity" ? "bg-foreground text-primary-foreground" : "bg-secondary"}`}>
          <Activity className="h-4 w-4" /> Activitate
        </button>
        <button onClick={() => setTab("auth")} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm ${tab === "auth" ? "bg-foreground text-primary-foreground" : "bg-secondary"}`}>
          <Shield className="h-4 w-4" /> Auth & Securitate
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nicio înregistrare.</p>
        ) : tab === "activity" ? (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Acțiune</th>
                <th className="text-left p-3">Tip entitate</th>
                <th className="text-left p-3">Entitate</th>
                <th className="text-left p-3">Utilizator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-secondary/30">
                  <td className="p-3 text-xs whitespace-nowrap">{new Date(i.created_at).toLocaleString("ro-RO")}</td>
                  <td className="p-3 font-medium">{i.action}</td>
                  <td className="p-3"><span className="rounded bg-secondary px-2 py-0.5 text-xs">{i.entity_type}</span></td>
                  <td className="p-3 text-xs">{i.entity_name ?? i.entity_id ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{i.user_name ?? "Sistem"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Eveniment</th>
                <th className="text-left p-3">Utilizator</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">Detalii</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-secondary/30">
                  <td className="p-3 text-xs whitespace-nowrap">{new Date(i.created_at).toLocaleString("ro-RO")}</td>
                  <td className="p-3 font-medium">{i.event_type}</td>
                  <td className="p-3 text-xs">{i.user_id ?? "—"}</td>
                  <td className="p-3 text-xs">{i.ip_address ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground"><pre className="text-[10px] max-w-xs truncate">{JSON.stringify(i.event_details)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
