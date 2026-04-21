import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus, Trash2, Star } from "lucide-react";

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

function AccountAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "", county: "", postal_code: "", label: "Acasă" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses((data as Address[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await supabase.from("addresses").insert({ ...form, user_id: user.id, is_default: addresses.length === 0 });
    setForm({ full_name: "", phone: "", address: "", city: "", county: "", postal_code: "", label: "Acasă" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    load();
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    load();
  };

  if (loading) {
    return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Adresele Mele</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
        >
          <Plus className="h-4 w-4" /> Adresă nouă
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Nume complet *" required value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Adresă *" required value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:col-span-2" />
            <input placeholder="Oraș *" required value={form.city} onChange={(e) => setForm({...form, city: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Județ *" required value={form.county} onChange={(e) => setForm({...form, county: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Cod poștal" value={form.postal_code} onChange={(e) => setForm({...form, postal_code: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <select value={form.label} onChange={(e) => setForm({...form, label: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="Acasă">Acasă</option>
              <option value="Birou">Birou</option>
              <option value="Altă adresă">Altă adresă</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
              Salvează
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
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
              <div className="flex gap-2">
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
