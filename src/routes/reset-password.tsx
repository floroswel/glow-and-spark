import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Parolă nouă — Lumini.ro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      // Supabase handles the session automatically
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Parolele nu se potrivesc"); return; }
    if (password.length < 6) { setError("Parola trebuie să aibă minim 6 caractere"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else { setSuccess(true); setTimeout(() => navigate({ to: "/auth" }), 3000); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
        {success ? (
          <div className="text-center">
            <p className="text-5xl mb-4">✅</p>
            <h1 className="text-2xl font-heading font-bold mb-2">Parola a fost schimbată!</h1>
            <p className="text-sm text-muted-foreground">Vei fi redirecționat la autentificare...</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-2">Parolă nouă</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Introdu noua parolă.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Parolă nouă *" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="Confirmă parola *" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-12 bg-foreground text-primary-foreground rounded-lg font-semibold text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition">
                {loading ? "Se salvează..." : "Salvează parola nouă"}
              </button>
            </form>
          </>
        )}
      </div>
      <Link to="/auth" className="mt-6 text-xs text-muted-foreground hover:text-foreground transition">← Înapoi la autentificare</Link>
    </div>
  );
}
