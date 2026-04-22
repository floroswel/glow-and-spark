import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation, Plus, Trash2, Pencil, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/admin/content/redirects")({
  component: AdminRedirects,
});

interface Redirect { from: string; to: string; type: "301" | "302"; active: boolean }

function AdminRedirects() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Redirect>({ from: "", to: "", type: "301", active: true });
  const [editing, setEditing] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "redirects").maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value)) setRedirects(data.value as unknown as Redirect[]);
      setLoading(false);
    });
  }, []);

  const save = async (updated: Redirect[]) => {
    setRedirects(updated);
    await supabase.from("site_settings").upsert({ key: "redirects", value: updated as any }, { onConflict: "key" });
    setToast("Salvat!"); setTimeout(() => setToast(""), 2500);
  };

  const add = () => {
    if (!form.from.trim() || !form.to.trim()) return;
    save([...redirects, form]);
    setForm({ from: "", to: "", type: "301", active: true });
  };

  const remove = (idx: number) => save(redirects.filter((_, i) => i !== idx));

  const exportCSV = () => {
    const csv = "From,To,Type,Active\n" + redirects.map(r => `${r.from},${r.to},${r.type},${r.active}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "redirects.csv"; a.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).split("\n").slice(1).filter(l => l.trim());
      const imported: Redirect[] = lines.map(l => {
        const [from, to, type, active] = l.split(",");
        return { from: from?.trim() || "", to: to?.trim() || "", type: (type?.trim() === "302" ? "302" : "301") as "301" | "302", active: active?.trim() !== "false" };
      }).filter(r => r.from && r.to);
      save([...redirects, ...imported]);
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="h-32 bg-secondary animate-pulse rounded-lg" />;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Adaugă redirect</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input placeholder="/pagina-veche" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="/pagina-noua" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "301" | "302" }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="301">301 (Permanent)</option>
            <option value="302">302 (Temporar)</option>
          </select>
          <button onClick={add} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium">Adaugă</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm"><Download className="h-4 w-4" />Export CSV</button>
        <label className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm cursor-pointer">
          <Upload className="h-4 w-4" />Import CSV
          <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
        </label>
      </div>

      {redirects.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Niciun redirect configurat</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30"><th className="px-4 py-2 text-left font-medium">De la</th><th className="px-4 py-2 text-left font-medium">Către</th><th className="px-4 py-2 text-center font-medium">Tip</th><th className="px-4 py-2 text-center font-medium">Acțiuni</th></tr></thead>
            <tbody>
              {redirects.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{r.from}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.to}</td>
                  <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.type === "301" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"}`}>{r.type}</span></td>
                  <td className="px-4 py-2 text-center"><button onClick={() => remove(i)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Total: {redirects.length} redirecturi</p>
    </div>
  );
}
