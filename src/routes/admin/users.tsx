import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Shield, Clock, LogOut, Key, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("profiles").select("user_id, full_name, phone, avatar_url, created_at"),
    ]).then(([r, p]) => {
      setAdmins(r.data || []);
      setProfiles(p.data || []);
      setLoading(false);
    });
  }, []);

  const adminUsers = admins.filter(a => a.role === "admin").map(a => {
    const profile = profiles.find(p => p.user_id === a.user_id);
    return { ...a, ...profile };
  });

  const roles = [
    { name: "Super Admin", description: "Acces total la toate modulele", color: "bg-red-500/10 text-red-500", permissions: "Toate permisiunile" },
    { name: "Manager", description: "Acces la comenzi, produse, clienți, rapoarte", color: "bg-blue-500/10 text-blue-500", permissions: "Fără setări sistem" },
    { name: "Operator Comenzi", description: "Doar comenzi și stoc", color: "bg-amber-500/10 text-amber-600", permissions: "Comenzi, stoc, tracking" },
    { name: "Content Manager", description: "Conținut, produse, blog", color: "bg-purple-500/10 text-purple-500", permissions: "Produse, blog, pagini, media" },
    { name: "Viewer", description: "Doar vizualizare rapoarte", color: "bg-secondary text-muted-foreground", permissions: "Read-only rapoarte" },
  ];

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">👤 Utilizatori Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează accesul la panoul de administrare</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/30">
          <h3 className="font-semibold text-foreground text-sm">Administratori activi ({adminUsers.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {adminUsers.map(a => (
            <div key={a.user_id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm">
                  {(a.full_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{a.full_name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{a.user_id === user?.id ? "Tu" : "Admin"} • Creat: {a.created_at ? new Date(a.created_at).toLocaleDateString("ro-RO") : "—"}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">Super Admin</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-accent" />Roluri disponibile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map(r => (
            <div key={r.name} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.color}`}>{r.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.description}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Permisiuni: {r.permissions}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-accent" />Jurnal activitate recentă</h3>
        <p className="text-sm text-muted-foreground">Ultimele acțiuni ale administratorilor vor fi afișate aici.</p>
      </div>
    </div>
  );
}
