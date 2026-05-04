import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus, Trash2, Star, Pencil, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/addresses")({
  component: AccountAddresses,
});

interface Address {
  id: string;
  full_name: string;
  phone: string | null;
  address: string;
  city: string;
  county: string;
  postal_code: string | null;
  label: string | null;
  is_default: boolean | null;
}

const emptyForm = { full_name: "", phone: "", address: "", city: "", county: "", postal_code: "", label: "Acasă" };

function AccountAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses((data as Address[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      full_name: addr.full_name,
      phone: addr.phone || "",
      address: addr.address,
      city: addr.city,
      county: addr.county,
      postal_code: addr.postal_code || "",
      label: addr.label || "Acasă",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from("addresses").update(form).eq("id", editingId);
        toast.success("Adresa a fost actualizată.");
      } else {
        await supabase.from("addresses").insert({ ...form, user_id: user.id, is_default: addresses.length === 0 });
        toast.success("Adresa a fost adăugată.");
      }
      closeForm();
      load();
    } catch {
      toast.error("Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur vrei să ștergi această adresă?")) return;
    await supabase.from("addresses").delete().eq("id", id);
    toast.success("Adresa a fost ștearsă.");
    load();
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast.success("Adresa implicită a fost schimbată.");
    load();
  };

  if (loading) {
    return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  const inputCls = "rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 bg-background";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Adresele Mele</h1>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
          >
            <Plus className="h-4 w-4" /> Adresă nouă
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-accent/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {editingId ? "Editează adresa" : "Adresă nouă"}
            </h2>
            <button type="button" onClick={closeForm} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Nume complet *" required value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className={inputCls} />
            <input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className={inputCls} />
            <input placeholder="Adresă *" required value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className={`${inputCls} sm:col-span-2`} />
            <input placeholder="Oraș *" required value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className={inputCls} />
            <input placeholder="Județ *" required value={form.county} onChange={(e) => setForm({...form, county: e.target.value})} className={inputCls} />
            <input placeholder="Cod poștal" value={form.postal_code} onChange={(e) => setForm({...form, postal_code: e.target.value})} className={inputCls} />
            <select value={form.label} onChange={(e) => setForm({...form, label: e.target.value})} className={inputCls}>
              <option value="Acasă">Acasă</option>
              <option value="Birou">Birou</option>
              <option value="Altă adresă">Altă adresă</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50">
              {saving ? "Se salvează..." : editingId ? "Actualizează" : "Salvează"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
              Anulează
            </button>
          </div>
        </form>
      )}

      {!addresses.length && !showForm && (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">Nicio adresă salvată</h2>
          <p className="mt-1 text-sm text-muted-foreground">Adaugă o adresă pentru livrare mai rapidă.</p>
        </div>
      )}

      <div className="grid gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className={`rounded-xl border bg-card p-5 ${addr.is_default ? "border-accent" : "border-border"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">{addr.label}</span>
                  {addr.is_default && <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">Implicită</span>}
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">{addr.full_name}</p>
                <p className="text-sm text-muted-foreground">{addr.address}</p>
                <p className="text-sm text-muted-foreground">{addr.city}, {addr.county} {addr.postal_code}</p>
                {addr.phone && <p className="text-sm text-muted-foreground mt-0.5">{addr.phone}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(addr)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition" title="Editează">
                  <Pencil className="h-4 w-4" />
                </button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition" title="Setează ca implicită">
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => handleDelete(addr.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Șterge">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
