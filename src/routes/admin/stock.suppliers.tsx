import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Users, X, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/stock/suppliers")({
  component: StockSuppliers,
});

function StockSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      contact_name: fd.get("contact_name") as string,
      contact_email: fd.get("contact_email") as string,
      contact_phone: fd.get("contact_phone") as string,
      city: fd.get("city") as string,
      county: fd.get("county") as string,
      cui: fd.get("cui") as string,
      payment_terms: parseInt(fd.get("payment_terms") as string) || 30,
    };
    if (!payload.name) { toast.error("Numele e obligatoriu"); return; }

    if (editing?.id) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Furnizor actualizat");
    } else {
      const { error } = await supabase.from("suppliers").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Furnizor adăugat");
    }
    setShowForm(false); setEditing(null); load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Furnizor șters"); setDeleting(null); load();
  };

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Furnizori</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} furnizori</p>
        </div>
        <button onClick={() => { setEditing({}); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent transition">
          <Plus className="h-4 w-4" /> Furnizor Nou
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută furnizor..."
          className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSave} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">{editing?.id ? "Editează Furnizor" : "Furnizor Nou"}</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
            </div>
            {[
              { name: "name", label: "Nume firmă *", def: editing?.name },
              { name: "cui", label: "CUI", def: editing?.cui },
              { name: "contact_name", label: "Persoana de contact", def: editing?.contact_name },
              { name: "contact_email", label: "Email", def: editing?.contact_email },
              { name: "contact_phone", label: "Telefon", def: editing?.contact_phone },
              { name: "city", label: "Oraș", def: editing?.city },
              { name: "county", label: "Județ", def: editing?.county },
              { name: "payment_terms", label: "Termen plată (zile)", def: editing?.payment_terms || "30" },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input name={f.name} defaultValue={f.def || ""} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
              </div>
            ))}
            <button type="submit" className="w-full rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background hover:bg-accent transition">Salvează</button>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl border border-border bg-card p-6 max-w-sm space-y-4">
            <h3 className="font-heading font-bold">Confirmă ștergerea</h3>
            <p className="text-sm text-muted-foreground">Sigur vrei să ștergi acest furnizor?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Anulează</button>
              <button onClick={() => handleDelete(deleting)} className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground">Șterge</button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Users className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium">Niciun furnizor</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{s.name}</h3>
                  {s.cui && <p className="text-xs text-muted-foreground">CUI: {s.cui}</p>}
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= (s.rating || 3) ? "text-accent fill-accent" : "text-border"}`} />)}
                </div>
              </div>
              {s.contact_name && <p className="text-xs text-muted-foreground">{s.contact_name} • {s.contact_phone || s.contact_email || ""}</p>}
              <p className="text-xs text-muted-foreground">Termen plată: {s.payment_terms || 30} zile</p>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => { setEditing(s); setShowForm(true); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" /> Editează
                </button>
                <button onClick={() => setDeleting(s.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" /> Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
