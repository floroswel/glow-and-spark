import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/admin/email-logs")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  useEffect(() => {
    let q = supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(500);
    if (filter !== "all") q = q.eq("status", filter);
    q.then(({ data }) => setItems(data ?? []));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">Jurnal email</h1><p className="text-sm text-muted-foreground">{items.length} email-uri</p></div>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="all">Toate</option><option value="sent">Trimise</option><option value="failed">Eșuate</option><option value="bounced">Bounced</option>
        </select>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Destinatar</th><th className="text-left p-3">Subiect</th><th className="text-left p-3">Template</th><th className="text-left p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(i => (
              <tr key={i.id}>
                <td className="p-3 text-xs">{new Date(i.created_at).toLocaleString("ro-RO")}</td>
                <td className="p-3">{i.recipient_email}</td>
                <td className="p-3">{i.subject || "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{i.template || "—"}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${i.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{i.status}</span>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Niciun email</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
