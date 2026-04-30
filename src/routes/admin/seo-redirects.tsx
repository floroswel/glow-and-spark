import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/seo-redirects")({
  component: Page,
});

function Page() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => { const { data } = await supabase.from("seo_redirects").select("*").order("created_at", { ascending: false }); setItems(data ?? []); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const { error } = await supabase.from("seo_redirects").insert({ from_path: "/old", to_path: "/new", status_code: 301, is_active: true });
    if (error) return toast.error(error.message); load();
  };
  const update = async (id: string, patch: any) => { setItems(items.map(i => i.id === id ? { ...i, ...patch } : i)); await supabase.from("seo_redirects").update(patch).eq("id", id); };
  const remove = async (id: string) => { await supabase.from("seo_redirects").delete().eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-7 w-7 text-accent" />
          <div><h1 className="font-heading text-2xl font-bold">Redirect-uri SEO</h1><p className="text-sm text-muted-foreground">Redirecționări 301/302 pentru URL-uri vechi</p></div>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />Redirect nou</button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">De la</th><th className="text-left p-3">Către</th><th className="text-left p-3">Cod</th><th className="text-left p-3">Hits</th><th className="text-left p-3">Activ</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map(r => (
              <tr key={r.id}>
                <td className="p-3"><input value={r.from_path} onChange={e => update(r.id, { from_path: e.target.value })} className="w-full rounded border border-border bg-background px-2 py-1 text-xs font-mono" /></td>
                <td className="p-3"><input value={r.to_path} onChange={e => update(r.id, { to_path: e.target.value })} className="w-full rounded border border-border bg-background px-2 py-1 text-xs font-mono" /></td>
                <td className="p-3"><select value={r.status_code} onChange={e => update(r.id, { status_code: parseInt(e.target.value) })} className="rounded border border-border bg-background px-2 py-1 text-xs"><option value={301}>301</option><option value={302}>302</option><option value={307}>307</option><option value={308}>308</option></select></td>
                <td className="p-3 text-xs">{r.hit_count || 0}</td>
                <td className="p-3"><input type="checkbox" checked={!!r.is_active} onChange={e => update(r.id, { is_active: e.target.checked })} /></td>
                <td className="p-3"><button onClick={() => remove(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Niciun redirect</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
