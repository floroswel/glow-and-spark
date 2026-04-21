import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Lock } from "lucide-react";

export const Route = createFileRoute("/account/settings")({
  component: AccountSettings,
});

function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("user_id", user.id);
    await refreshProfile();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPw.length < 6) { setPwError("Parola trebuie să aibă minim 6 caractere."); return; }
    if (newPw !== confirmPw) { setPwError("Parolele nu coincid."); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { setPwError(error.message); }
    else {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 3000);
    }
    setPwSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Setări Cont</h1>

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Date Personale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input disabled value={user?.email || ""} className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nume complet</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Se salvează..." : "Salvează"}
          </button>
          {saved && <span className="text-sm text-accent font-medium">✓ Salvat cu succes</span>}
        </div>
      </form>

      {/* Password */}
      <form onSubmit={handleChangePassword} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
          <Lock className="h-4.5 w-4.5" /> Schimbă Parola
        </h2>
        {pwError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{pwError}</div>}
        {pwSuccess && <div className="rounded-lg bg-accent/10 p-3 text-sm text-accent">Parola a fost schimbată cu succes.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input type="password" placeholder="Parola nouă *" required value={newPw} onChange={(e) => setNewPw(e.target.value)}
            className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <input type="password" placeholder="Confirmă parola *" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <button type="submit" disabled={pwSaving}
          className="flex items-center gap-2 rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-foreground/90 transition disabled:opacity-50">
          {pwSaving ? "Se schimbă..." : "Schimbă parola"}
        </button>
      </form>
    </div>
  );
}
