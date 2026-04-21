import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, Users, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/subscribers")({
  component: AdminSubscribers,
});

function AdminSubscribers() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
    setSubs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("newsletter_subscribers").update({ is_active: !current }).eq("id", id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur dorești să ștergi acest abonat?")) return;
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    load();
  };

  const exportCSV = () => {
    const csv = "Email,Nume,Sursă,Data,Status\n" + subs.map((s) =>
      `${s.email},${s.name || ""},${s.source || ""},${new Date(s.created_at).toLocaleDateString("ro-RO")},${s.is_active ? "Activ" : "Inactiv"}`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "abonati.csv"; a.click();
  };

  const filtered = subs.filter(s =>
    (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subs.filter(s => s.is_active).length;

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Abonați Newsletter ({subs.length})</h1>
          <p className="text-sm text-muted-foreground">{activeCount} activi · {subs.length - activeCount} inactivi</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Caută după email sau nume..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nume</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Sursă</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Cod Reducere</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-secondary/30 transition">
                <td className="px-4 py-3 text-foreground">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.name || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{s.source || "popup"}</span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{s.discount_code || "—"}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{new Date(s.created_at).toLocaleDateString("ro-RO")}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(s.id, s.is_active)} className="transition">
                    {s.is_active ? <ToggleRight className="h-6 w-6 text-accent" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun abonat găsit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
