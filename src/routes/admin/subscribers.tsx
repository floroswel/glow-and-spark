import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/subscribers")({
  component: AdminSubscribers,
});

function AdminSubscribers() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setSubs(data || []));
  }, []);

  const exportCSV = () => {
    const csv = "Email,Data\n" + subs.map((s) => `${s.email},${new Date(s.created_at).toLocaleDateString("ro-RO")}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "abonati.csv"; a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Abonați Newsletter</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("ro-RO")}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground"}`}>{s.is_active ? "Activ" : "Inactiv"}</span></td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Niciun abonat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
